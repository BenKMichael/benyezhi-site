-- Least-privilege accounts, one per service, replacing the single
-- full-access app_user the mysql image would otherwise auto-create.
-- Runs after 01_users.sql and 02_events.sql so the target tables exist.

-- auth: only ever reads the users table (login lookup). No signup/profile-edit
-- flow exists yet -- add INSERT/UPDATE here if one gets built.
CREATE USER IF NOT EXISTS 'auth_user'@'%' IDENTIFIED BY 'auth_password';
GRANT SELECT ON analytics_db.users TO 'auth_user'@'%';

-- reporting: reads events, plus the admin add/remove endpoints for
-- POST/DELETE /api/static. Never touches the users table.
CREATE USER IF NOT EXISTS 'reporting_user'@'%' IDENTIFIED BY 'reporting_password';
GRANT SELECT, INSERT, DELETE ON analytics_db.events TO 'reporting_user'@'%';

-- collector: write-only ingestion via POST /log. Never reads anything,
-- never touches the users table.
CREATE USER IF NOT EXISTS 'collector_user'@'%' IDENTIFIED BY 'collector_password';
GRANT INSERT ON analytics_db.events TO 'collector_user'@'%';

FLUSH PRIVILEGES;
