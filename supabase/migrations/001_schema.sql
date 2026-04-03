-- Neighbourly: Core schema
-- Run this in the Supabase SQL Editor

-- Enable PostGIS for geo queries
create extension if not exists postgis;

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  bio text,
  avatar_url text,
  role text not null default 'both' check (role in ('seeker', 'helper', 'both')),
  skills text[] default '{}',
  rating numeric default 0,
  jobs_done integer default 0,
  lat double precision,
  lng double precision,
  push_token text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Anyone can read profiles (for discovery)
create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Users can insert their own profile (on signup)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- TASKS
-- ============================================================
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles(id) on delete cascade not null,
  helper_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  category text not null,
  status text not null default 'open'
    check (status in ('open', 'matched', 'in_progress', 'disputed', 'completed', 'cancelled')),
  budget numeric,
  payment_type text default 'cash' check (payment_type in ('digital', 'cash')),
  photos text[] default '{}',
  location_point geography(Point, 4326),
  address text,
  scheduled_at timestamptz,
  created_at timestamptz default now()
);

alter table public.tasks enable row level security;

-- Open tasks are publicly readable (for discovery)
create policy "Open tasks are publicly readable"
  on public.tasks for select
  using (status = 'open' or creator_id = auth.uid() or helper_id = auth.uid());

-- Authenticated users can create tasks
create policy "Authenticated users can create tasks"
  on public.tasks for insert
  with check (auth.uid() = creator_id);

-- Task creator or matched helper can update
create policy "Task participants can update"
  on public.tasks for update
  using (auth.uid() = creator_id or auth.uid() = helper_id);

-- Spatial index for geo queries
create index tasks_location_idx on public.tasks using gist (location_point);

-- ============================================================
-- OFFERS
-- ============================================================
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade not null,
  helper_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric not null,
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now()
);

alter table public.offers enable row level security;

-- Task creator can see offers on their tasks; helper can see their own offers
create policy "Offer visibility"
  on public.offers for select
  using (
    helper_id = auth.uid()
    or exists (
      select 1 from public.tasks t where t.id = task_id and t.creator_id = auth.uid()
    )
  );

-- Authenticated helpers can create offers
create policy "Helpers can create offers"
  on public.offers for insert
  with check (auth.uid() = helper_id);

-- Task creator can update offers (accept/reject)
create policy "Task creator can update offers"
  on public.offers for update
  using (
    exists (
      select 1 from public.tasks t where t.id = task_id and t.creator_id = auth.uid()
    )
  );

-- ============================================================
-- MESSAGES
-- ============================================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

-- Only task participants can see messages
create policy "Task participants can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.tasks t
      where t.id = task_id
        and (t.creator_id = auth.uid() or t.helper_id = auth.uid())
    )
  );

-- Task participants can send messages
create policy "Task participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.tasks t
      where t.id = task_id
        and (t.creator_id = auth.uid() or t.helper_id = auth.uid())
    )
  );

-- Enable realtime for messages
alter publication supabase_realtime add table public.messages;

-- ============================================================
-- REVIEWS
-- ============================================================
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade not null,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  reviewee_id uuid references public.profiles(id) on delete cascade not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  -- Prevent duplicate reviews
  unique (task_id, reviewer_id)
);

alter table public.reviews enable row level security;

-- Reviews are publicly readable
create policy "Reviews are publicly readable"
  on public.reviews for select
  using (true);

-- Task participants can leave reviews
create policy "Task participants can leave reviews"
  on public.reviews for insert
  with check (
    auth.uid() = reviewer_id
    and exists (
      select 1 from public.tasks t
      where t.id = task_id
        and t.status = 'completed'
        and (t.creator_id = auth.uid() or t.helper_id = auth.uid())
    )
  );

-- Recompute profile rating on new review
create or replace function public.update_profile_rating()
returns trigger as $$
begin
  update public.profiles
  set rating = (
    select coalesce(avg(r.rating), 0)
    from public.reviews r
    where r.reviewee_id = new.reviewee_id
  ),
  jobs_done = (
    select count(distinct r.task_id)
    from public.reviews r
    where r.reviewee_id = new.reviewee_id
  )
  where id = new.reviewee_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_review_created
  after insert on public.reviews
  for each row execute function public.update_profile_rating();
