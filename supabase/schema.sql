-- TeamFlow Planner: Supabase/Postgres schema
-- Run this file in Supabase SQL Editor after creating a project.
create extension if not exists pgcrypto;

create type public.project_role as enum ('viewer','creator','editor','admin');
create type public.task_progress as enum ('open','on_going','done','missed','overdue');
create type public.task_priority as enum ('low','medium','high');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  email text not null default '',
  created_at timestamptz not null default now()
);
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.project_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key(project_id,user_id)
);
create table public.sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  section_id uuid references public.sections(id) on delete set null,
  parent_task_id uuid references public.tasks(id) on delete cascade,
  title text not null,
  description text not null default '',
  priority public.task_priority not null default 'medium',
  start_date date,
  due_date date,
  progress public.task_progress not null default 'open',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_dates_valid check (start_date is null or due_date is null or due_date >= start_date)
);
create table public.task_assignees (
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key(task_id,user_id)
);
create table public.task_links (
  task_id uuid not null references public.tasks(id) on delete cascade,
  linked_task_id uuid not null references public.tasks(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key(task_id,linked_task_id),
  constraint no_self_task_link check(task_id <> linked_task_id)
);
create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  body text not null,
  mentions uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  comment_id uuid references public.task_comments(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id),
  bucket_path text not null,
  file_name text not null,
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now(),
  constraint attachment_parent check (task_id is not null or comment_id is not null)
);
create table public.activity_log (
  id bigint generated always as identity primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  actor_id uuid not null references auth.users(id),
  action text not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  kind text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.is_project_member(target_project uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.project_members pm where pm.project_id=target_project and pm.user_id=auth.uid()) $$;
create or replace function public.project_role_for(target_project uuid)
returns public.project_role language sql stable security definer set search_path = public
as $$ select role from public.project_members where project_id=target_project and user_id=auth.uid() limit 1 $$;
create or replace function public.can_create_in_project(target_project uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce(public.project_role_for(target_project) in ('creator','editor','admin'),false) $$;
create or replace function public.can_edit_project(target_project uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce(public.project_role_for(target_project) in ('editor','admin'),false) $$;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.sections enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_links enable row level security;
alter table public.task_comments enable row level security;
alter table public.attachments enable row level security;
alter table public.activity_log enable row level security;
alter table public.notifications enable row level security;

create policy "profiles visible to authenticated users" on public.profiles for select to authenticated using (true);
create policy "users update own profile" on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());
create policy "users create own profile" on public.profiles for insert to authenticated with check (id=auth.uid());

create policy "members view projects" on public.projects for select to authenticated using (public.is_project_member(id) or created_by=auth.uid());
create policy "authenticated create projects" on public.projects for insert to authenticated with check (created_by=auth.uid());
create policy "admins update projects" on public.projects for update to authenticated using (public.project_role_for(id)='admin') with check (public.project_role_for(id)='admin');
create policy "admins delete projects" on public.projects for delete to authenticated using (public.project_role_for(id)='admin');

create policy "members view membership" on public.project_members for select to authenticated using (public.is_project_member(project_id));
create policy "admins manage membership" on public.project_members for all to authenticated using (public.project_role_for(project_id)='admin') with check (public.project_role_for(project_id)='admin');

create policy "members view sections" on public.sections for select to authenticated using (public.is_project_member(project_id));
create policy "creators add sections" on public.sections for insert to authenticated with check (public.can_create_in_project(project_id) and created_by=auth.uid());
create policy "editors manage sections" on public.sections for update to authenticated using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));
create policy "editors delete sections" on public.sections for delete to authenticated using (public.can_edit_project(project_id));

create policy "members view tasks" on public.tasks for select to authenticated using (public.is_project_member(project_id));
create policy "creators add tasks" on public.tasks for insert to authenticated with check (public.can_create_in_project(project_id) and created_by=auth.uid());
create policy "editors update tasks" on public.tasks for update to authenticated using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));
create policy "editors delete tasks" on public.tasks for delete to authenticated using (public.can_edit_project(project_id));

create policy "members view assignees" on public.task_assignees for select to authenticated using (exists(select 1 from public.tasks t where t.id=task_id and public.is_project_member(t.project_id)));
create policy "editors manage assignees" on public.task_assignees for all to authenticated using (exists(select 1 from public.tasks t where t.id=task_id and public.can_edit_project(t.project_id))) with check (exists(select 1 from public.tasks t where t.id=task_id and public.can_edit_project(t.project_id)));
create policy "members view links" on public.task_links for select to authenticated using (exists(select 1 from public.tasks t where t.id=task_id and public.is_project_member(t.project_id)));
create policy "editors manage links" on public.task_links for all to authenticated using (exists(select 1 from public.tasks t where t.id=task_id and public.can_edit_project(t.project_id))) with check (exists(select 1 from public.tasks t where t.id=task_id and public.can_edit_project(t.project_id)));

create policy "members view comments" on public.task_comments for select to authenticated using (exists(select 1 from public.tasks t where t.id=task_id and public.is_project_member(t.project_id)));
create policy "members add comments" on public.task_comments for insert to authenticated with check (author_id=auth.uid() and exists(select 1 from public.tasks t where t.id=task_id and public.is_project_member(t.project_id)));
create policy "authors edit comments" on public.task_comments for update to authenticated using (author_id=auth.uid()) with check (author_id=auth.uid());
create policy "authors delete comments" on public.task_comments for delete to authenticated using (author_id=auth.uid());

create policy "members view attachments" on public.attachments for select to authenticated using (public.is_project_member(project_id));
create policy "members upload attachments" on public.attachments for insert to authenticated with check (uploaded_by=auth.uid() and public.can_create_in_project(project_id));
create policy "uploader delete attachments" on public.attachments for delete to authenticated using (uploaded_by=auth.uid() or public.can_edit_project(project_id));
create policy "members view activity" on public.activity_log for select to authenticated using (public.is_project_member(project_id));
create policy "members create activity" on public.activity_log for insert to authenticated with check (actor_id=auth.uid() and public.is_project_member(project_id));
create policy "users view own notifications" on public.notifications for select to authenticated using (user_id=auth.uid());
create policy "users update own notifications" on public.notifications for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('task-attachments','task-attachments',false,52428800,array['image/*','application/pdf','text/plain','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do nothing;
create policy "project members read task files" on storage.objects for select to authenticated using (bucket_id='task-attachments' and exists(select 1 from public.attachments a where a.bucket_path=name and public.is_project_member(a.project_id)));
create policy "project members upload task files" on storage.objects for insert to authenticated with check (bucket_id='task-attachments');
