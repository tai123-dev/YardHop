-- ============================================================
-- YardHop Seed Data
-- Last updated: Week 3
-- ============================================================

-- Insert test users with explicit UUIDs
INSERT INTO public.users (id, email, full_name, password_hash) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'john@test.com', 'John',  'fakehash123'),
    ('a0000000-0000-0000-0000-000000000002', 'tee@test.com',  'Tee',   'fakehash456'),
    ('a0000000-0000-0000-0000-000000000003', 'tai@test.com',  'Tai',   'fakehash789');

-- Insert test sales referencing the UUIDs above
INSERT INTO public.sales (user_id, title, description, address, city, zip, date, start_time, end_time, categories) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Big Backyard Sale',      'Moving out sale, everything must go!',  '123 Main St',         'Albuquerque', '87101', '2026-06-07', '08:00', '14:00', 'furniture, clothes, tools'),
    ('a0000000-0000-0000-0000-000000000002', 'Estate Sale NE Heights', 'Large estate sale with antiques',       '456 Montgomery Blvd', 'Albuquerque', '87111', '2026-06-07', '09:00', '16:00', 'antiques, books, kitchen'),
    ('a0000000-0000-0000-0000-000000000003', 'Yard Sale Rio Rancho',   'Kids stuff and garden tools',           '789 Iris Rd',         'Rio Rancho',  '87124', '2026-06-08', '07:00', '12:00', 'kids, garden, clothes');

-- Insert test saved sales
-- user john saves sale 2 and 3, user tee saves sale 1
INSERT INTO public.saved_sales (user_id, sale_id) VALUES
    ('a0000000-0000-0000-0000-000000000001', 2),
    ('a0000000-0000-0000-0000-000000000002', 3),
    ('a0000000-0000-0000-0000-000000000003', 1);