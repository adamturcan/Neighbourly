-- Read receipts: tracks when each user last viewed a conversation
create table public.read_receipts (
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  last_read_at timestamptz default now(),
  primary key (task_id, user_id)
);

alter table public.read_receipts enable row level security;

create policy "Users can read own receipts"
  on public.read_receipts for select
  using (auth.uid() = user_id);

-- Task participants can see each other's read receipts
create policy "Task participants can read receipts"
  on public.read_receipts for select
  using (
    exists (
      select 1 from public.tasks t
      where t.id = task_id
        and (t.creator_id = auth.uid() or t.helper_id = auth.uid())
    )
  );

create policy "Users can upsert own receipts"
  on public.read_receipts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own receipts"
  on public.read_receipts for update
  using (auth.uid() = user_id);

-- Enable realtime for seen status
alter publication supabase_realtime add table public.read_receipts;
