create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table if not exists private.editor_emails (
  email text primary key check (email = lower(trim(email)))
);
alter table private.editor_emails enable row level security;
revoke all on private.editor_emails from public, anon, authenticated;

create or replace function private.is_project_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.editor_emails
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function private.is_project_editor() from public, anon, authenticated;
grant execute on function private.is_project_editor() to authenticated;

create table if not exists public.milestones (
  id text primary key,
  week integer not null check (week > 0),
  sort_order integer not null check (sort_order > 0),
  name text not null check (length(trim(name)) > 0),
  description text not null,
  status text not null check (status in ('completed', 'in_progress', 'not_started'))
);

alter table public.milestones enable row level security;
revoke all on public.milestones from public, anon, authenticated;
grant select on public.milestones to anon, authenticated;
grant update (name, description, status) on public.milestones to authenticated;

drop policy if exists "Anyone can read milestones" on public.milestones;
create policy "Anyone can read milestones"
  on public.milestones for select
  to anon, authenticated
  using (true);

drop policy if exists "Approved editors can update milestones" on public.milestones;
create policy "Approved editors can update milestones"
  on public.milestones for update
  to authenticated
  using ((select private.is_project_editor()))
  with check ((select private.is_project_editor()));

create or replace function public.can_edit_milestones()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_project_editor();
$$;
revoke all on function public.can_edit_milestones() from public, anon, authenticated;
grant execute on function public.can_edit_milestones() to authenticated;

insert into public.milestones (id, week, sort_order, name, description, status) values
  ('requirements-gathering', 1, 1, 'Requirements Gathering', 'Define project scope & collect web requirements', 'completed'),
  ('ui-ux-prototyping', 1, 2, 'UI/UX Prototyping', 'Create wireframes prototype using Figma', 'completed'),
  ('design-finalization', 1, 3, 'Design Finalization', 'Finalize website layout, user flow, etc.', 'completed'),
  ('frontend-development', 2, 1, 'Frontend Development', 'Build website structure using HTML & CSS', 'completed'),
  ('interactive-components', 2, 2, 'Interactive Components', 'Implement interactive elements using JavaScript', 'completed'),
  ('responsive-design', 2, 3, 'Responsive Design', 'Optimize UI for any device layout', 'completed'),
  ('backend-development', 3, 1, 'Backend Development', 'Develop server logic & application functionality', 'completed'),
  ('database-integration', 3, 2, 'Database Integration', 'Configure database & data management', 'completed'),
  ('api-integration', 3, 3, 'API Integration', 'Connect frontend components with backend', 'completed'),
  ('functional-testing', 4, 1, 'Functional Testing', 'Test website features, buttons, etc.', 'completed'),
  ('bug-fixing', 4, 2, 'Bug Fixing', 'Identify & resolve functional or interface issues', 'in_progress'),
  ('deployment', 4, 3, 'Deployment', 'Finalize configuration & publish the website', 'not_started')
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'milestones'
  ) then
    alter publication supabase_realtime add table public.milestones;
  end if;
end;
$$;
