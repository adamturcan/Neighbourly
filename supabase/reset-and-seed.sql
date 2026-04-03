-- Reset all table data and seed with realistic test data
-- Run this in the Supabase SQL Editor

-- ============================================================
-- 1. CLEAR ALL DATA (order matters for foreign keys)
-- ============================================================
delete from public.reviews;
delete from public.messages;
delete from public.offers;
delete from public.tasks;
delete from public.services;
-- Don't delete profiles — they're tied to auth.users

-- ============================================================
-- 2. SEED REALISTIC DATA
-- ============================================================
do $$
declare
  dev_uid uuid;
begin
  -- Get the first user (your dev account)
  select id into dev_uid from auth.users order by created_at asc limit 1;
  if dev_uid is null then
    raise notice 'No users found. Sign in first.';
    return;
  end if;

  -- Update dev profile with realistic data
  update public.profiles set
    full_name = 'Adam Turcan',
    role = 'both',
    skills = array['moving', 'cleaning', 'gardening', 'car'],
    rating = 4.7,
    jobs_done = 23,
    lat = 48.1486,
    lng = 17.1077
  where id = dev_uid;

  -- ============================================================
  -- SERVICES (things the dev user offers)
  -- ============================================================
  insert into public.services (provider_id, title, categories, photo_url, price_from, lat, lng, rating, jobs_done) values
    (dev_uid, 'Lawn mowing & edging', array['gardening','chores'],
     'https://images.unsplash.com/photo-1523345863768-17bfa9f3d814?q=80&w=1400&auto=format&fit=crop',
     15, 48.1510, 17.1090, 4.8, 23),
    (dev_uid, 'Deep apartment cleaning', array['chores','cleaning'],
     'https://images.unsplash.com/photo-1581574209460-7bdd93839a0b?q=80&w=1400&auto=format&fit=crop',
     25, 48.1460, 17.1120, 4.6, 41),
    (dev_uid, 'Math & physics tutoring', array['tutoring'],
     'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1400&auto=format&fit=crop',
     18, 48.1530, 17.1000, 4.9, 15),
    (dev_uid, 'Two-people moving help', array['moving'],
     'https://images.unsplash.com/photo-1516383607781-913a19294fd1?q=80&w=1400&auto=format&fit=crop',
     30, 48.1440, 17.1150, 4.3, 57),
    (dev_uid, 'Quick plumbing fixes', array['plumbing'],
     'https://images.unsplash.com/photo-1581579188871-c6b9b9c49b08?q=80&w=1400&auto=format&fit=crop',
     25, 48.1500, 17.0980, 4.7, 33),
    (dev_uid, 'Garden care & trimming', array['gardening'],
     'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=1400&auto=format&fit=crop',
     20, 48.1475, 17.1130, 4.5, 19);

  -- ============================================================
  -- TASKS (realistic local tasks, all by dev user as seeker)
  -- ============================================================
  insert into public.tasks (id, creator_id, title, description, category, budget, payment_type, lat, lng, address, status, location_point) values
    -- Open tasks (visible on map + feed)
    (gen_random_uuid(), dev_uid,
     'Help me move a sofa downstairs',
     'Heavy 3-seat sofa from 4th floor to ground level. No elevator. Need 2 strong people, should take about 30 min.',
     'moving', 35, 'cash', 48.1495, 17.1085,
     'Kovanecká 14, Praha 9', 'open',
     ST_SetSRID(ST_MakePoint(17.1085, 48.1495), 4326)::geography),

    (gen_random_uuid(), dev_uid,
     'Deep clean before move-out',
     'Leaving my 1-bedroom flat. Need kitchen, bathroom, and windows cleaned thoroughly. Supplies provided.',
     'cleaning', 50, 'digital', 48.1520, 17.1040,
     'Karlovo nám. 13, Praha 2', 'open',
     ST_SetSRID(ST_MakePoint(17.1040, 48.1520), 4326)::geography),

    (gen_random_uuid(), dev_uid,
     'Fix a leaking kitchen faucet',
     'The faucet drips constantly. Probably just needs a new washer or cartridge. Tools needed.',
     'plumbing', 25, 'cash', 48.1450, 17.1100,
     'Žitná 45, Praha 1', 'open',
     ST_SetSRID(ST_MakePoint(17.1100, 48.1450), 4326)::geography),

    (gen_random_uuid(), dev_uid,
     'Mow my lawn + trim hedges',
     'Small garden, about 80m². Lawn needs mowing and the hedge along the fence needs trimming. I have a mower.',
     'gardening', 20, 'cash', 48.1540, 17.1060,
     'Na Pankráci 30, Praha 4', 'open',
     ST_SetSRID(ST_MakePoint(17.1060, 48.1540), 4326)::geography),

    (gen_random_uuid(), dev_uid,
     'Tutor my kid in math (grade 8)',
     'My son struggles with algebra and geometry. Looking for a patient tutor, 2x per week for 1 hour.',
     'tutoring', 15, 'cash', 48.1470, 17.1020,
     'Vinohradská 12, Praha 3', 'open',
     ST_SetSRID(ST_MakePoint(17.1020, 48.1470), 4326)::geography),

    (gen_random_uuid(), dev_uid,
     'Jump start my car',
     'Battery is dead in underground parking. Need someone with jumper cables. Škoda Octavia, B2 level.',
     'car', 10, 'cash', 48.1505, 17.1140,
     'Budějovická 1, Praha 4', 'open',
     ST_SetSRID(ST_MakePoint(17.1140, 48.1505), 4326)::geography),

    (gen_random_uuid(), dev_uid,
     'Paint one bedroom wall',
     'Accent wall in bedroom, approx 3x2.5m. I have the paint (dark blue). Need brushes and a roller.',
     'painting', 30, 'digital', 48.1490, 17.0960,
     'Štefánikova 8, Praha 5', 'open',
     ST_SetSRID(ST_MakePoint(17.0960, 48.1490), 4326)::geography),

    (gen_random_uuid(), dev_uid,
     'Install 3 ceiling lights',
     'Already bought IKEA fixtures. Just need someone comfortable with basic wiring. ~1 hour job.',
     'electrical', 40, 'cash', 48.1460, 17.1170,
     'Korunní 65, Praha 10', 'open',
     ST_SetSRID(ST_MakePoint(17.1170, 48.1460), 4326)::geography);

  -- ============================================================
  -- OFFERS (from dev user on some tasks — simulating helpers bidding)
  -- ============================================================
  -- Add offers to the first 3 tasks
  insert into public.offers (task_id, helper_id, amount, message, status)
  select t.id, dev_uid,
    case
      when t.category = 'moving' then 30
      when t.category = 'cleaning' then 45
      when t.category = 'plumbing' then 22
    end,
    case
      when t.category = 'moving' then 'I can help today after 17:00. Have a friend who can join too.'
      when t.category = 'cleaning' then 'Professional cleaner here. Can do it this Saturday morning.'
      when t.category = 'plumbing' then 'Plumber with 5 years experience. Can come in 1 hour.'
    end,
    'pending'
  from public.tasks t
  where t.category in ('moving', 'cleaning', 'plumbing')
    and t.status = 'open'
  limit 3;

  raise notice 'Seed complete: 6 services, 8 tasks, 3 offers for user %', dev_uid;
end $$;
