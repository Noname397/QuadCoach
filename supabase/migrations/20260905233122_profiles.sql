create table if not exists public.profiles (
  id uuid primary key
    references auth.users(id)
    on delete cascade,

  name text not null
    check (char_length(trim(name)) between 1 and 100),

  profile_picture_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;


create policy "Users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);


create policy "Users can create their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);


create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ============================================================
-- AUTOMATIC updated_at
-- ============================================================

create or replace function public.handle_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


create trigger profiles_updated_at
before update on public.profiles
for each row
execute function public.handle_profile_updated_at();