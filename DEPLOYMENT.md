# Deployment

## Local

`make rebuild` builds three containers:

- `mysql-db` — seeded from `database/init/*.sql`
- `app` — the unified Express server on port 3000
- `web` — Apache, front proxy + `benyezhi.site` static/CGI, ports 8080/8081/8082

| URL | Serves |
| --- | --- |
| http://localhost:8080 | `benyezhi.site` (static + CGI, `/node/`, `/api`, `/reporting/`) |
| http://localhost:8081 | `reporting.benyezhi.site` (whole app) |
| http://localhost:8082 | `collector.benyezhi.site` (static landing + `/log`, `/log-noscript`) |

## Production

One PM2 process (`cse135-app`) runs `app/src/server.js`. The `.github/workflows/app.yml`
workflow SCPs `app/` to `/var/www/app`, writes `.env` from the `APP_ENV` secret,
installs, and restarts PM2.

Static content deploys separately: `deploy.yml` (benyezhi.site static + CGI),
`test-site.yml`, and `collector-site.yml` — the last two are the same shape
(SCP `<subdomain>/*` to `/var/www/<subdomain>/html`).

### Required one-time changes on the server

1. Create the GitHub secret `APP_ENV` with the full `.env` contents
   (`PORT`, `SESSION_SECRET`, `COOKIE_SECURE=true`, `DB_*`). The old
   `AUTH_ENV` / `REPORTING_ENV` / `COLLECTOR_ENV` secrets are unused.
2. Point every vhost at the one process:

   - `reporting.benyezhi.site` — proxy `/` to `127.0.0.1:3000`
   - `collector.benyezhi.site` — serve its static dir; proxy `/log` and
     `/log-noscript` to `127.0.0.1:3000`
   - `benyezhi.site` — proxy `/node/`, `/api`, `/reporting/` to `127.0.0.1:3000`

3. Remove the old PM2 processes: `pm2 delete reporting-auth reporting-api collector-api node-app` (the last is the former benyezhi.site demo server — its `/node/*` endpoints are now in the unified app; leaving it running holds port 3000 and crash-loops `cse135-app`). Then `pm2 save`.
4. Drop the `sessions` table (no longer used) and ensure the DB user matches
   `database/init/04_grants.sql` (SELECT/INSERT/UPDATE/DELETE on `users` + `events`).
5. Run `database/migrations/001_role_slugs.sql` once to convert the numeric
   `users.role` column to slugs (`superadmin` / `analyst` / `viewer`).
6. Run `database/migrations/002_reports.sql` once to create the `reports` table
   and grant `app_user` access to it.
