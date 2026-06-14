-- Enable fuzzy text search
create extension if not exists pg_trgm;

create table if not exists public.apis (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text,
  description text,
  homepage_url text,
  docs_url text,
  provider text,
  auth_type text,
  pricing_notes text,
  tags text[] default '{}',
  source_repo_path text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists apis_name_trgm_idx on public.apis using gin (name gin_trgm_ops);
create index if not exists apis_description_trgm_idx on public.apis using gin (description gin_trgm_ops);
create index if not exists apis_category_idx on public.apis (category);
create index if not exists apis_auth_type_idx on public.apis (auth_type);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists apis_updated_at on public.apis;
create trigger apis_updated_at
  before update on public.apis
  for each row execute function public.set_updated_at();
