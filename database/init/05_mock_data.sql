-- Sample analytics data so the dashboard has something to render on a
-- fresh local setup, instead of empty charts/tables. Runs once on a fresh
-- database volume, same as the other seed data in this directory. Timestamps
-- are relative to NOW() so this never looks stale, however long from now
-- the container actually gets built.
--
-- 4 mock sessions, spread across roughly a day, with varied event types
-- and varied browser-capability flags -- gives the events-over-time line
-- chart multiple buckets, the event-type doughnut multiple slices, and the
-- capability bar chart some non-100% percentages to actually show.

INSERT INTO events (session_id, type, url, client_timestamp, server_timestamp, ip, data) VALUES
('sess_mock_001', 'static', NULL, NOW() - INTERVAL 190 MINUTE, NOW() - INTERVAL 190 MINUTE, '203.0.113.10',
    '{"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120","language":"en-US","cookiesAllowed":true,"javascriptAllowed":true,"imagesAllowed":true,"cssAllowed":true,"screenDimensions":{"width":1920,"height":1080},"windowDimensions":{"innerWidth":1440,"innerHeight":900},"networkConnection":{"effectiveType":"4g"}}'),
('sess_mock_001', 'click', 'https://test.benyezhi.site/products', NOW() - INTERVAL 189 MINUTE, NOW() - INTERVAL 189 MINUTE, '203.0.113.10', '{"x":120,"y":340}'),
('sess_mock_001', 'scroll', 'https://test.benyezhi.site/products', NOW() - INTERVAL 187 MINUTE, NOW() - INTERVAL 187 MINUTE, '203.0.113.10', '{"scrollY":400}'),

('sess_mock_002', 'static', NULL, NOW() - INTERVAL 340 MINUTE, NOW() - INTERVAL 340 MINUTE, '203.0.113.22',
    '{"userAgent":"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1","language":"en-US","cookiesAllowed":true,"javascriptAllowed":true,"imagesAllowed":false,"cssAllowed":true,"screenDimensions":{"width":390,"height":844},"windowDimensions":{"innerWidth":390,"innerHeight":664},"networkConnection":{"effectiveType":"4g"}}'),
('sess_mock_002', 'click', 'https://test.benyezhi.site/', NOW() - INTERVAL 338 MINUTE, NOW() - INTERVAL 338 MINUTE, '203.0.113.22', '{"x":50,"y":120}'),
('sess_mock_002', 'error', 'https://test.benyezhi.site/checkout', NOW() - INTERVAL 335 MINUTE, NOW() - INTERVAL 335 MINUTE, '203.0.113.22', '{"message":"TypeError: Cannot read properties of null"}'),

('sess_mock_003', 'static', NULL, NOW() - INTERVAL 1400 MINUTE, NOW() - INTERVAL 1400 MINUTE, '203.0.113.35',
    '{"userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Firefox/121","language":"en-GB","cookiesAllowed":false,"javascriptAllowed":true,"imagesAllowed":true,"cssAllowed":true,"screenDimensions":{"width":1440,"height":900},"windowDimensions":{"innerWidth":1280,"innerHeight":780},"networkConnection":{"effectiveType":"3g"}}'),
('sess_mock_003', 'page_exit', 'https://test.benyezhi.site/products', NOW() - INTERVAL 1395 MINUTE, NOW() - INTERVAL 1395 MINUTE, '203.0.113.35', '{"enterTime":"2026-01-01T00:00:00.000Z","exitTime":"2026-01-01T00:05:00.000Z"}'),

('sess_mock_004', 'static', NULL, NOW() - INTERVAL 25 MINUTE, NOW() - INTERVAL 25 MINUTE, '203.0.113.48',
    '{"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/119","language":"en-US","cookiesAllowed":true,"javascriptAllowed":true,"imagesAllowed":true,"cssAllowed":true,"screenDimensions":{"width":2560,"height":1440},"windowDimensions":{"innerWidth":2200,"innerHeight":1300},"networkConnection":{"effectiveType":"4g"}}'),
('sess_mock_004', 'click', 'https://test.benyezhi.site/liquidation', NOW() - INTERVAL 22 MINUTE, NOW() - INTERVAL 22 MINUTE, '203.0.113.48', '{"x":900,"y":200}'),
('sess_mock_004', 'idle', 'https://test.benyezhi.site/liquidation', NOW() - INTERVAL 15 MINUTE, NOW() - INTERVAL 15 MINUTE, '203.0.113.48', '{"idleDurationMs":90000}');
