-- TeamFlow collaboration improvements. Apply after the existing schema and migrations.
alter table public.project_members
  add column if not exists can_view boolean not null default true,
  add column if not exists can_create boolean not null default false,
  add column if not exists can_edit boolean not null default false;

alter table public.tasks
  add column if not exists is_done boolean not null default false,
  add column if not exists is_on_going boolean not null default false,
  add column if not exists assignee_id uuid references auth.users(id) on delete set null;

alter table public.profiles alter column email drop not null;
alter table public.profiles add column if not exists notification_email text;

create index if not exists profiles_email_lower_idx on public.profiles (lower(email));
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists task_comments_task_created_idx on public.task_comments(task_id, created_at);

-- Profiles are provisioned for new Auth users and keep optional contact email.
create or replace function public.sync_auth_profile()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  insert into public.profiles(id,display_name,email,notification_email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), coalesce(new.email,''), new.email)
  on conflict (id) do update set
    display_name=coalesce(nullif(excluded.display_name,''),public.profiles.display_name),
    email=coalesce(nullif(excluded.email,''),public.profiles.email);
  return new;
end;
$$;
drop trigger if exists on_auth_user_profile_sync on auth.users;
create trigger on_auth_user_profile_sync after insert or update of email,raw_user_meta_data on auth.users
for each row execute function public.sync_auth_profile();

-- Notify project members when they are assigned to a task.
create or replace function public.notify_task_assignment()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  if new.assignee_id is not null and (tg_op='INSERT' or old.assignee_id is distinct from new.assignee_id) then
    insert into public.notifications(user_id,project_id,task_id,actor_id,kind,message)
    values(new.assignee_id,new.project_id,new.id,auth.uid(),'task_assigned','You have been assigned to task: '||new.title);
  end if;
  return new;
end;
$$;
drop trigger if exists task_assignment_notification on public.tasks;
create trigger task_assignment_notification after insert or update of assignee_id on public.tasks
for each row execute function public.notify_task_assignment();

-- Notify all project members when a task is completed or becomes missed/overdue.
create or replace function public.notify_task_state()
returns trigger language plpgsql security definer set search_path=public
as $$
declare recipient record; next_state text;
begin
  if new.is_done and (tg_op='INSERT' or not old.is_done) then next_state:='completed';
  elsif new.is_on_going and new.due_date is not null and new.due_date < current_date and
    (tg_op='INSERT' or not old.is_on_going or old.due_date is distinct from new.due_date) then next_state:='overdue';
  elsif not new.is_done and not new.is_on_going and new.due_date is not null and new.due_date < current_date and
    (tg_op='INSERT' or old.due_date is distinct from new.due_date) then next_state:='missed';
  else return new;
  end if;
  for recipient in select user_id from public.project_members where project_id=new.project_id and user_id<>coalesce(auth.uid(),new.created_by) loop
    insert into public.notifications(user_id,project_id,task_id,actor_id,kind,message)
    values(recipient.user_id,new.project_id,new.id,auth.uid(),'task_'||next_state,'Task "'||new.title||'" is '||next_state||'.');
  end loop;
  return new;
end;
$$;
drop trigger if exists task_state_notification on public.tasks;
create trigger task_state_notification after insert or update of is_done,is_on_going,due_date,title on public.tasks
for each row execute function public.notify_task_state();

-- Allow authenticated project members to manage their own notification inbox.
drop policy if exists "users view own notifications" on public.notifications;
create policy "users view own notifications" on public.notifications for select to authenticated using(user_id=auth.uid());
drop policy if exists "users update own notifications" on public.notifications;
create policy "users update own notifications" on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());


-- Create Inbox notifications for @mentions stored on task comments.
create or replace function public.notify_comment_mentions()
returns trigger language plpgsql security definer set search_path=public
as $$
declare mentioned_user uuid; task_row record;
begin
  select id,project_id,title into task_row from public.tasks where id=new.task_id;
  foreach mentioned_user in array coalesce(new.mentions,'{}'::uuid[]) loop
    if mentioned_user <> new.author_id then
      insert into public.notifications(user_id,project_id,task_id,actor_id,kind,message)
      values(mentioned_user,task_row.project_id,new.task_id,new.author_id,'task_mention',
        'You were mentioned in a comment on task: '||task_row.title);
    end if;
  end loop;
  return new;
end;
$$;
drop trigger if exists task_comment_mention_notification on public.task_comments;
create trigger task_comment_mention_notification after insert on public.task_comments
for each row execute function public.notify_comment_mentions();
