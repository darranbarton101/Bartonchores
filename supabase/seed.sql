insert into auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  aud,
  role
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'alex.adult@barton.dev',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Alex"}',
    now(),
    now(),
    'authenticated',
    'authenticated'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'mia.kid@barton.dev',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Mia"}',
    now(),
    now(),
    'authenticated',
    'authenticated'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'leo.kid@barton.dev',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Leo"}',
    now(),
    now(),
    'authenticated',
    'authenticated'
  );

insert into auth.identities (
  id,
  user_id,
  provider,
  identity_data,
  created_at,
  updated_at
)
values
  (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    'email',
    jsonb_build_object('sub', '11111111-1111-1111-1111-111111111111', 'email', 'alex.adult@barton.dev'),
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222',
    'email',
    jsonb_build_object('sub', '22222222-2222-2222-2222-222222222222', 'email', 'mia.kid@barton.dev'),
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    '33333333-3333-3333-3333-333333333333',
    'email',
    jsonb_build_object('sub', '33333333-3333-3333-3333-333333333333', 'email', 'leo.kid@barton.dev'),
    now(),
    now()
  );

insert into profiles (id, role, display_name)
values
  ('11111111-1111-1111-1111-111111111111', 'adult', 'Alex'),
  ('22222222-2222-2222-2222-222222222222', 'kid', 'Mia'),
  ('33333333-3333-3333-3333-333333333333', 'kid', 'Leo');

insert into chores (id, title, value_pence, active, created_by)
values
  (gen_random_uuid(), 'Make bed', 50, true, '11111111-1111-1111-1111-111111111111'),
  (gen_random_uuid(), 'Feed the cat', 75, true, '11111111-1111-1111-1111-111111111111'),
  (gen_random_uuid(), 'Clear the table', 60, true, '11111111-1111-1111-1111-111111111111'),
  (gen_random_uuid(), 'Pack school bag', 40, true, '11111111-1111-1111-1111-111111111111'),
  (gen_random_uuid(), 'Water plants', 55, true, '11111111-1111-1111-1111-111111111111'),
  (gen_random_uuid(), 'Tidy toys', 80, true, '11111111-1111-1111-1111-111111111111'),
  (gen_random_uuid(), 'Vacuum living room', 120, true, '11111111-1111-1111-1111-111111111111'),
  (gen_random_uuid(), 'Sort recycling', 90, true, '11111111-1111-1111-1111-111111111111'),
  (gen_random_uuid(), 'Wipe counters', 70, true, '11111111-1111-1111-1111-111111111111'),
  (gen_random_uuid(), 'Walk the dog', 150, true, '11111111-1111-1111-1111-111111111111');

insert into chore_schedules (chore_id, days_of_week)
select id,
  case title
    when 'Make bed' then array[1,2,3,4,5,6,0]
    when 'Feed the cat' then array[1,2,3,4,5,6,0]
    when 'Clear the table' then array[1,2,3,4,5]
    when 'Pack school bag' then array[0,1,2,3,4]
    when 'Water plants' then array[2,5]
    when 'Tidy toys' then array[1,3,5]
    when 'Vacuum living room' then array[6]
    when 'Sort recycling' then array[4]
    when 'Wipe counters' then array[1,4]
    when 'Walk the dog' then array[2,6]
  end
from chores;
