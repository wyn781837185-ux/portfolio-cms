create table if not exists public.portfolio_profile (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_projects (
  id text primary key,
  data jsonb not null,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_portfolio_profile_updated_at on public.portfolio_profile;
create trigger set_portfolio_profile_updated_at
before update on public.portfolio_profile
for each row execute function public.set_updated_at();

drop trigger if exists set_portfolio_projects_updated_at on public.portfolio_projects;
create trigger set_portfolio_projects_updated_at
before update on public.portfolio_projects
for each row execute function public.set_updated_at();

alter table public.portfolio_profile enable row level security;
alter table public.portfolio_projects enable row level security;

insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do update set public = true;

drop policy if exists "portfolio public read" on storage.objects;
create policy "portfolio public read"
on storage.objects for select
using (bucket_id = 'portfolio');
