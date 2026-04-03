-- Seed data for development
-- Run this AFTER 001_schema.sql and 002_services.sql

do $$
declare
  dev_uid uuid;
begin
  select id into dev_uid from auth.users limit 1;
  if dev_uid is null then
    raise notice 'No users found. Sign in first, then run this seed.';
    return;
  end if;

  -- Update dev profile
  update public.profiles set
    full_name = 'Dev User',
    role = 'both',
    skills = array['moving', 'chores', 'gardening', 'tutoring'],
    rating = 4.5,
    jobs_done = 12,
    lat = 48.1482,
    lng = 17.1067
  where id = dev_uid;

  -- Insert services
  insert into public.services (provider_id, title, categories, photo_url, price_from, lat, lng, rating, jobs_done) values
    (dev_uid, 'Lawn mowing & edging', array['gardening','chores'],
     'https://images.unsplash.com/photo-1523345863768-17bfa9f3d814?q=80&w=1400&auto=format&fit=crop',
     15, 48.1482 + 0.005, 17.1067 + 0.003, 4.8, 23),
    (dev_uid, 'Deep apartment cleaning', array['chores'],
     'https://images.unsplash.com/photo-1581574209460-7bdd93839a0b?q=80&w=1400&auto=format&fit=crop',
     25, 48.1482 - 0.003, 17.1067 + 0.007, 4.6, 41),
    (dev_uid, 'Math tutoring (HS/Uni)', array['tutoring'],
     'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1400&auto=format&fit=crop',
     18, 48.1482 + 0.008, 17.1067 - 0.004, 4.9, 15),
    (dev_uid, 'Two-people moving help', array['moving'],
     'https://images.unsplash.com/photo-1516383607781-913a19294fd1?q=80&w=1400&auto=format&fit=crop',
     30, 48.1482 - 0.006, 17.1067 - 0.002, 4.3, 57),
    (dev_uid, 'Quick plumbing fixes', array['plumbing','maintenance'],
     'https://images.unsplash.com/photo-1581579188871-c6b9b9c49b08?q=80&w=1400&auto=format&fit=crop',
     25, 48.1482 + 0.002, 17.1067 + 0.009, 4.7, 33),
    (dev_uid, 'Garden care & trimming', array['gardening'],
     'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=1400&auto=format&fit=crop',
     20, 48.1482 - 0.007, 17.1067 + 0.005, 4.5, 19);

  -- Insert a demo task (no lat/lng columns — uses location_point geography only)
  insert into public.tasks (creator_id, title, description, category, budget, payment_type, address, location_point)
  values (
    dev_uid,
    'Help me move a desk',
    'From 3rd floor, today at 18:00. Need someone strong.',
    'moving',
    40,
    'cash',
    'Kovanecká 14, Praha 9',
    ST_SetSRID(ST_MakePoint(17.1067, 48.1482), 4326)::geography
  );

  raise notice 'Seed data inserted for user %', dev_uid;
end $$;
