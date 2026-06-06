INSERT INTO users (email, password_hash, name) VALUES
('john@test.com', 'fakehash123', 'John'),
('tee@test.com', 'fakehash456', 'Tee'),
('tai@test.com', 'fakehash789', 'Tai');

INSERT INTO sales (user_id, title, description, address, city, zip, date, start_time, end_time, categories) VALUES
(1, 'Big Backyard Sale', 'Moving out sale, everything must go!', '123 Main St', 'Albuquerque', '87101', '2026-06-07', '08:00', '14:00', 'furniture, clothes, tools'),
(2, 'Estate Sale NE Heights', 'Large estate sale with antiques', '456 Montgomery Blvd', 'Albuquerque', '87111', '2026-06-07', '09:00', '16:00', 'antiques, books, kitchen'),
(3, 'Yard Sale Rio Rancho', 'Kids stuff and garden tools', '789 Iris Rd', 'Rio Rancho', '87124', '2026-06-08', '07:00', '12:00', 'kids, garden, clothes');

-- Fake saved sales
INSERT INTO saved_sales (user_id, sale_id) VALUES
(1, 2),
(1, 3),
(2, 1);