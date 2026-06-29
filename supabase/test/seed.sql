-- Seed determinista (como postgres/superuser: omite RLS, es setup de prueba).
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'u1-admin-A@test'),
  ('22222222-2222-2222-2222-222222222222', 'u2-member-A@test'),
  ('33333333-3333-3333-3333-333333333333', 'u3-admin-B@test')
on conflict do nothing;

insert into public.organizations (id, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Org A'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Org B')
on conflict do nothing;

insert into public.memberships (organization_id, user_id, role) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'admin'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'member'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'admin')
on conflict do nothing;

insert into public.cycles (id, organization_id, name, cadence) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2027', 'anual')
on conflict do nothing;

insert into public.objectives (id, organization_id, cycle_id, owner_id, title, kind) values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'cccccccc-cccc-cccc-cccc-cccccccccccc',
   '11111111-1111-1111-1111-111111111111',
   'Crecer en el mercado', 'comprometido')
on conflict do nothing;

insert into public.key_results
  (id, organization_id, objective_id, title, type, start_value, target_value, current_value) values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'dddddddd-dddd-dddd-dddd-dddddddddddd',
   'Ingresos 100 -> 300', 'numerico', 100, 300, 100)
on conflict do nothing;
