-- Sample analytics data so the dashboard has something to render on a
-- fresh local setup, instead of empty charts/tables. Runs once on a fresh
-- database volume, same as the other seed data in this directory. Timestamps
-- are relative to NOW() so this never looks stale, however long from now
-- the container actually gets built.
--
-- Spread across the last 7 days (roughly 1-2 sessions per day) with varied
-- event types, browser-capability flags, and country codes -- gives the
-- visitors-over-time line chart a full week of buckets, the location pie
-- chart multiple slices, and the capability bar chart some non-100%
-- percentages to actually show. country values are only ever set by real
-- geoip-lite lookups in collector's own code (not something this file
-- exercises); they're just hand-picked here to make the mock data useful.

INSERT INTO events (session_id, type, url, client_timestamp, server_timestamp, ip, data) VALUES
-- 6 days ago
('sess_mock_01', 'static', NULL, NOW() - INTERVAL 6 DAY - INTERVAL 3 HOUR, NOW() - INTERVAL 6 DAY - INTERVAL 3 HOUR, '203.0.113.10',
    '{"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120","language":"en-US","cookiesAllowed":true,"javascriptAllowed":true,"imagesAllowed":true,"cssAllowed":true,"screenDimensions":{"width":1920,"height":1080},"windowDimensions":{"innerWidth":1440,"innerHeight":900},"networkConnection":{"effectiveType":"4g"},"country":"US"}'),
('sess_mock_01', 'click', 'https://test.benyezhi.site/products', NOW() - INTERVAL 6 DAY - INTERVAL 2 HOUR - INTERVAL 55 MINUTE, NOW() - INTERVAL 6 DAY - INTERVAL 2 HOUR - INTERVAL 55 MINUTE, '203.0.113.10', '{"x":120,"y":340}'),
('sess_mock_02', 'static', NULL, NOW() - INTERVAL 6 DAY - INTERVAL 1 HOUR, NOW() - INTERVAL 6 DAY - INTERVAL 1 HOUR, '203.0.113.11',
    '{"userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/604.1","language":"en-GB","cookiesAllowed":true,"javascriptAllowed":true,"imagesAllowed":true,"cssAllowed":true,"screenDimensions":{"width":1440,"height":900},"windowDimensions":{"innerWidth":1280,"innerHeight":780},"networkConnection":{"effectiveType":"4g"},"country":"GB"}'),
('sess_mock_02', 'scroll', 'https://test.benyezhi.site/', NOW() - INTERVAL 6 DAY - INTERVAL 55 MINUTE, NOW() - INTERVAL 6 DAY - INTERVAL 55 MINUTE, '203.0.113.11', '{"scrollY":400}'),

-- 5 days ago
('sess_mock_03', 'static', NULL, NOW() - INTERVAL 5 DAY - INTERVAL 5 HOUR, NOW() - INTERVAL 5 DAY - INTERVAL 5 HOUR, '203.0.113.12',
    '{"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121","language":"de-DE","cookiesAllowed":false,"javascriptAllowed":true,"imagesAllowed":true,"cssAllowed":true,"screenDimensions":{"width":1680,"height":1050},"windowDimensions":{"innerWidth":1500,"innerHeight":900},"networkConnection":{"effectiveType":"3g"},"country":"DE"}'),
('sess_mock_03', 'error', 'https://test.benyezhi.site/checkout', NOW() - INTERVAL 5 DAY - INTERVAL 4 HOUR - INTERVAL 50 MINUTE, NOW() - INTERVAL 5 DAY - INTERVAL 4 HOUR - INTERVAL 50 MINUTE, '203.0.113.12', '{"message":"TypeError: Cannot read properties of null"}'),

-- 4 days ago
('sess_mock_04', 'static', NULL, NOW() - INTERVAL 4 DAY - INTERVAL 2 HOUR, NOW() - INTERVAL 4 DAY - INTERVAL 2 HOUR, '203.0.113.13',
    '{"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120","language":"en-US","cookiesAllowed":true,"javascriptAllowed":true,"imagesAllowed":true,"cssAllowed":true,"screenDimensions":{"width":1920,"height":1080},"windowDimensions":{"innerWidth":1440,"innerHeight":900},"networkConnection":{"effectiveType":"4g"},"country":"US"}'),
('sess_mock_04', 'click', 'https://test.benyezhi.site/liquidation', NOW() - INTERVAL 4 DAY - INTERVAL 1 HOUR - INTERVAL 55 MINUTE, NOW() - INTERVAL 4 DAY - INTERVAL 1 HOUR - INTERVAL 55 MINUTE, '203.0.113.13', '{"x":900,"y":200}'),
('sess_mock_05', 'static', NULL, NOW() - INTERVAL 4 DAY - INTERVAL 8 HOUR, NOW() - INTERVAL 4 DAY - INTERVAL 8 HOUR, '203.0.113.14',
    '{"userAgent":"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1","language":"ja-JP","cookiesAllowed":true,"javascriptAllowed":true,"imagesAllowed":false,"cssAllowed":true,"screenDimensions":{"width":390,"height":844},"windowDimensions":{"innerWidth":390,"innerHeight":664},"networkConnection":{"effectiveType":"4g"},"country":"JP"}'),
('sess_mock_05', 'idle', 'https://test.benyezhi.site/', NOW() - INTERVAL 4 DAY - INTERVAL 7 HOUR - INTERVAL 50 MINUTE, NOW() - INTERVAL 4 DAY - INTERVAL 7 HOUR - INTERVAL 50 MINUTE, '203.0.113.14', '{"idleDurationMs":90000}'),

-- 3 days ago
('sess_mock_06', 'static', NULL, NOW() - INTERVAL 3 DAY - INTERVAL 4 HOUR, NOW() - INTERVAL 3 DAY - INTERVAL 4 HOUR, '203.0.113.15',
    '{"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/119","language":"en-CA","cookiesAllowed":true,"javascriptAllowed":true,"imagesAllowed":true,"cssAllowed":true,"screenDimensions":{"width":1920,"height":1080},"windowDimensions":{"innerWidth":1600,"innerHeight":950},"networkConnection":{"effectiveType":"4g"},"country":"CA"}'),
('sess_mock_06', 'page_exit', 'https://test.benyezhi.site/products', NOW() - INTERVAL 3 DAY - INTERVAL 3 HOUR - INTERVAL 55 MINUTE, NOW() - INTERVAL 3 DAY - INTERVAL 3 HOUR - INTERVAL 55 MINUTE, '203.0.113.15', '{"enterTime":"2026-01-01T00:00:00.000Z","exitTime":"2026-01-01T00:05:00.000Z"}'),

-- 2 days ago
('sess_mock_07', 'static', NULL, NOW() - INTERVAL 2 DAY - INTERVAL 6 HOUR, NOW() - INTERVAL 2 DAY - INTERVAL 6 HOUR, '203.0.113.16',
    '{"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120","language":"en-US","cookiesAllowed":true,"javascriptAllowed":true,"imagesAllowed":true,"cssAllowed":true,"screenDimensions":{"width":1366,"height":768},"windowDimensions":{"innerWidth":1300,"innerHeight":700},"networkConnection":{"effectiveType":"4g"},"country":"US"}'),
('sess_mock_07', 'click', 'https://test.benyezhi.site/', NOW() - INTERVAL 2 DAY - INTERVAL 5 HOUR - INTERVAL 55 MINUTE, NOW() - INTERVAL 2 DAY - INTERVAL 5 HOUR - INTERVAL 55 MINUTE, '203.0.113.16', '{"x":300,"y":150}'),
('sess_mock_08', 'static', NULL, NOW() - INTERVAL 2 DAY - INTERVAL 1 HOUR, NOW() - INTERVAL 2 DAY - INTERVAL 1 HOUR, '203.0.113.17',
    '{"userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Firefox/121","language":"fr-FR","cookiesAllowed":true,"javascriptAllowed":true,"imagesAllowed":true,"cssAllowed":false,"screenDimensions":{"width":1440,"height":900},"windowDimensions":{"innerWidth":1280,"innerHeight":780},"networkConnection":{"effectiveType":"3g"},"country":"FR"}'),
('sess_mock_08', 'scroll', 'https://test.benyezhi.site/liquidation', NOW() - INTERVAL 2 DAY - INTERVAL 55 MINUTE, NOW() - INTERVAL 2 DAY - INTERVAL 55 MINUTE, '203.0.113.17', '{"scrollY":900}'),

-- 1 day ago
('sess_mock_09', 'static', NULL, NOW() - INTERVAL 1 DAY - INTERVAL 3 HOUR, NOW() - INTERVAL 1 DAY - INTERVAL 3 HOUR, '203.0.113.18',
    '{"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120","language":"en-GB","cookiesAllowed":true,"javascriptAllowed":true,"imagesAllowed":true,"cssAllowed":true,"screenDimensions":{"width":1920,"height":1080},"windowDimensions":{"innerWidth":1440,"innerHeight":900},"networkConnection":{"effectiveType":"4g"},"country":"GB"}'),
('sess_mock_09', 'click', 'https://test.benyezhi.site/products', NOW() - INTERVAL 1 DAY - INTERVAL 2 HOUR - INTERVAL 55 MINUTE, NOW() - INTERVAL 1 DAY - INTERVAL 2 HOUR - INTERVAL 55 MINUTE, '203.0.113.18', '{"x":600,"y":400}'),

-- today
('sess_mock_10', 'static', NULL, NOW() - INTERVAL 25 MINUTE, NOW() - INTERVAL 25 MINUTE, '203.0.113.19',
    '{"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/119","language":"en-US","cookiesAllowed":true,"javascriptAllowed":true,"imagesAllowed":true,"cssAllowed":true,"screenDimensions":{"width":2560,"height":1440},"windowDimensions":{"innerWidth":2200,"innerHeight":1300},"networkConnection":{"effectiveType":"4g"},"country":"US"}'),
('sess_mock_10', 'click', 'https://test.benyezhi.site/liquidation', NOW() - INTERVAL 22 MINUTE, NOW() - INTERVAL 22 MINUTE, '203.0.113.19', '{"x":900,"y":200}'),
('sess_mock_11', 'static', NULL, NOW() - INTERVAL 12 MINUTE, NOW() - INTERVAL 12 MINUTE, '203.0.113.20',
    '{"userAgent":"Mozilla/5.0 (iPad; CPU OS 17_0) Safari/604.1","language":"en-AU","cookiesAllowed":true,"javascriptAllowed":true,"imagesAllowed":true,"cssAllowed":true,"screenDimensions":{"width":1024,"height":1366},"windowDimensions":{"innerWidth":1024,"innerHeight":1280},"networkConnection":{"effectiveType":"wifi"},"country":"AU"}'),
('sess_mock_11', 'idle', 'https://test.benyezhi.site/', NOW() - INTERVAL 5 MINUTE, NOW() - INTERVAL 5 MINUTE, '203.0.113.20', '{"idleDurationMs":90000}');
