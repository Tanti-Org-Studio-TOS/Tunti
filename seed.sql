
-- Seed data for Tunti schema

-- Kingdoms
INSERT INTO kingdoms(code, name) VALUES
  ('MM', 'မြန်မာ'),
  ('TH', 'ထိုင်း')
ON CONFLICT (code) DO NOTHING;

-- Initial resources
INSERT INTO resources(kingdom_id, rice, gold, timber, spices)
SELECT id, 100, 100, 100, 0 FROM kingdoms
ON CONFLICT (kingdom_id) DO NOTHING;

-- Capital tiles (city)
WITH mm AS (SELECT id FROM kingdoms WHERE code='MM'),
     th AS (SELECT id FROM kingdoms WHERE code='TH')
INSERT INTO tiles(x, y, terrain, is_city, owner_id, building)
SELECT 4, 8, 'city', TRUE, (SELECT id FROM mm), 'pagoda'
ON CONFLICT (x, y) DO NOTHING;

WITH th AS (SELECT id FROM kingdoms WHERE code='TH')
INSERT INTO tiles(x, y, terrain, is_city, owner_id, building)
SELECT 12, 6, 'city', TRUE, (SELECT id FROM th), 'palace'
ON CONFLICT (x, y) DO NOTHING;

-- Create capitals mapping
INSERT INTO capitals(kingdom_id, tile_id, hp)
SELECT k.id, t.id, 5
FROM kingdoms k
JOIN tiles t ON t.owner_id = k.id AND t.is_city = TRUE
ON CONFLICT (kingdom_id) DO NOTHING;

-- Surrounding owned tiles
INSERT INTO tiles(x, y, terrain, is_city, owner_id) VALUES
  (3, 8, 'plains', FALSE, (SELECT id FROM kingdoms WHERE code='MM')),
  (5, 8, 'plains', FALSE, (SELECT id FROM kingdoms WHERE code='MM')),
  (4, 7, 'plains', FALSE, (SELECT id FROM kingdoms WHERE code='MM')),
  (4, 9, 'plains', FALSE, (SELECT id FROM kingdoms WHERE code='MM')),
  (11, 6, 'plains', FALSE, (SELECT id FROM kingdoms WHERE code='TH')),
  (13, 6, 'plains', FALSE, (SELECT id FROM kingdoms WHERE code='TH')),
  (12, 5, 'plains', FALSE, (SELECT id FROM kingdoms WHERE code='TH')),
  (12, 7, 'plains', FALSE, (SELECT id FROM kingdoms WHERE code='TH'))
ON CONFLICT (x, y) DO NOTHING;

-- Starter buildings near capitals
UPDATE tiles SET building='barracks' WHERE (x, y) IN ((4, 7), (12, 5));

-- Starter units
INSERT INTO units(type, hp, tile_id, owner_id)
SELECT 'infantry', 3, t.id, k.id
FROM tiles t
JOIN kingdoms k ON k.code='MM'
WHERE t.x=4 AND t.y=7
ON CONFLICT DO NOTHING;

INSERT INTO units(type, hp, tile_id, owner_id)
SELECT 'infantry', 3, t.id, k.id
FROM tiles t
JOIN kingdoms k ON k.code='TH'
WHERE t.x=12 AND t.y=5
ON CONFLICT DO NOTHING;
