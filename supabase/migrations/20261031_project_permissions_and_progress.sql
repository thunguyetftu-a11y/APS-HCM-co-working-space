-- Apply after supabase/schema.sql. Safe to run more than once.
alter table public.project_members
  add column if not exists can_view boolean not null default true,
  add column if not exists can_create boolean not null default false,
  add column if not exists can_edit boolean not null default false;

-- Preserve existing role access while moving toward explicit capabilities.
update public.project_members
set can_create = role in ('creator','editor','admin'),
    can_edit = role in ('editor','admin');

alter table public.tasks
  add column if not exists is_done boolean not null default false,
  add column if not exists is_on_going boolean not null default false;

create or replace function public.is_project_member(target_project uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.project_members pm
    where pm.project_id = target_project and pm.user_id = auth.uid() and pm.can_view
  )
$$;

create or replace function public.can_create_in_project(target_project uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.project_members pm
    where pm.project_id = target_project and pm.user_id = auth.uid() and pm.can_view and pm.can_create
  )
$$;

create or replace function public.can_edit_project(target_project uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.project_members pm
    where pm.project_id = target_project and pm.user_id = auth.uid() and pm.can_view and pm.can_edit
  )
$$;

-- The project creator is automatically its administrator/member.
create or replace function public.add_project_creator_as_admin()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.project_members(project_id,user_id,role,can_view,can_create,can_edit)
  values (new.id,new.created_by,'admin',true,true,true)
  on conflict (project_id,user_id) do update
    set role='admin', can_view=true, can_create=true, can_edit=true;
  return new;
end;
$$;

drop trigger if exists projects_add_creator_membership on public.projects;
create trigger projects_add_creator_membership
after insert on public.projects
for each row execute function public.add_project_creator_as_admin();

-- Backfill projects created before this migration.
insert into public.project_members(project_id,user_id,role,can_view,can_create,can_edit)
select p.id,p.created_by,'admin',true,true,true
from public.projects p
on conflict (project_id,user_id) do nothing;

-- Membership administration is restricted to existing project editors/admins.
drop policy if exists "admins manage membership" on public.project_members;
create policy "project admins manage membership" on public.project_members
for all to authenticated
using (public.can_edit_project(project_id))
with check (public.can_edit_project(project_id));

-- Task state flags are the source of truth; progress is calculated by the app
-- so date-based Missed/Overdue states can change when the calendar day changes.
