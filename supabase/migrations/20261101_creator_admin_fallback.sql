-- Ensure project creators retain administrator capabilities for legacy projects.
-- Apply this migration in Supabase SQL Editor after prior TeamFlow migrations.
create or replace function public.is_project_member(target_project uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id=target_project and p.created_by=auth.uid()
  ) or exists (
    select 1 from public.project_members pm
    where pm.project_id=target_project and pm.user_id=auth.uid() and pm.can_view
  )
$$;

create or replace function public.can_create_in_project(target_project uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id=target_project and p.created_by=auth.uid()
  ) or exists (
    select 1 from public.project_members pm
    where pm.project_id=target_project and pm.user_id=auth.uid() and pm.can_view and pm.can_create
  )
$$;

create or replace function public.can_edit_project(target_project uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id=target_project and p.created_by=auth.uid()
  ) or exists (
    select 1 from public.project_members pm
    where pm.project_id=target_project and pm.user_id=auth.uid() and pm.can_view and pm.can_edit
  )
$$;

-- Repair missing creator membership rows and restore full admin permissions.
insert into public.project_members(project_id,user_id,role,can_view,can_create,can_edit)
select id,created_by,'admin',true,true,true from public.projects
on conflict(project_id,user_id) do update set role='admin',can_view=true,can_create=true,can_edit=true;
