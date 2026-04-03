-- Services table: what helpers offer
create table public.services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  categories text[] default '{}',
  photo_url text,
  price_from numeric not null default 0,
  lat double precision,
  lng double precision,
  rating numeric default 0,
  jobs_done integer default 0,
  created_at timestamptz default now()
);

alter table public.services enable row level security;

-- Anyone can browse services
create policy "Services are publicly readable"
  on public.services for select
  using (true);

-- Helpers can create their own services
create policy "Helpers can create services"
  on public.services for insert
  with check (auth.uid() = provider_id);

-- Helpers can update their own services
create policy "Helpers can update own services"
  on public.services for update
  using (auth.uid() = provider_id);

-- Helpers can delete their own services
create policy "Helpers can delete own services"
  on public.services for delete
  using (auth.uid() = provider_id);
