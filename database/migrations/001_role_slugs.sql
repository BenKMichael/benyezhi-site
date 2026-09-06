-- Run once against an existing database that still has numeric roles.
-- Fresh databases get the new schema from init/01_users.sql directly.

ALTER TABLE users MODIFY role VARCHAR(20) NOT NULL DEFAULT 'viewer';

UPDATE users SET role = CASE role
    WHEN '65535' THEN 'superadmin'
    WHEN '1' THEN 'viewer'
    ELSE 'viewer'
END;
