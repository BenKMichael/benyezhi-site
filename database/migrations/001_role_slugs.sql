-- Run once against an existing database that still has numeric roles.
-- Fresh databases get the new schema from init/01_users.sql directly.
-- Safe to re-run: the UPDATEs only match rows still holding numeric values.

ALTER TABLE users MODIFY role VARCHAR(20) NOT NULL DEFAULT 'viewer';

UPDATE users SET role = 'superadmin' WHERE role = '65535';
UPDATE users SET role = 'viewer'     WHERE role = '1';
