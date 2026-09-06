# app

Single Express (MVC) server for the analytics platform. Replaces the former
`reporting.benyezhi.site/auth`, `reporting.benyezhi.site/reporting`,
`collector.benyezhi.site/node-app`, and `benyezhi.site/node-app` services.

## Layout

```
src/
  server.js       entrypoint (listen)
  app.js          express app wiring
  config/         env loading, constants, roles registry
  db/             mysql2 pool
  middleware/     session (cookie-session), demoSession (express-session),
                  auth (loadUser/requirePermission), cors, errorHandler
  models/         all SQL (userModel, eventModel, reportModel, analyticsModel)
  controllers/    request handlers
    api/          ingest, static, event
  routes/         url -> controller
  lib/            presenters, geo, jsonForHtml, validate, reportCategories
  views/          EJS templates
public/           report-workspace.js, report-print.js, report-pdf.js
```

## Routes

| Path | Permission | Purpose |
| --- | --- | --- |
| `GET /login`, `POST /login`, `GET /logout` | public | session auth |
| `GET /` | `reports:view` | saved-reports list (landing) |
| `GET /reports/new`, `GET /reports/new/:type` | `reports:create` | category picker, create workspace |
| `POST /reports` | `reports:create` | save a report snapshot |
| `GET /reports/:id/download` | `reports:view` | self-downloading PDF page for a saved report |
| `POST /reports/:id/delete` | `reports:delete` | delete a saved report |
| `GET/POST /users*` | `users:access` + per-action role scope (see Roles) | user CRUD |
| `GET /api/static`, `GET /api/static/:id` | `reports:view` | read static events |
| `POST /api/static`, `DELETE /api/static/:id` | `events:write` | write static events |
| `GET /api/events`, `GET /api/session/:id/timeline` | `reports:view` | read events |
| `POST /log`, `GET /log-noscript` | public | collector ingest |
| `GET /node/*` | public | CSE 135 demo endpoints |

## Roles

Defined in `config/roles.js` — the single source of truth. Each role is a slug
(stored in `users.role`) mapping to a set of permissions.

| Role | reports:view | reports:create | reports:delete | events:write | users:access |
| --- | :-: | :-: | :-: | :-: | :-: |
| `viewer` | ✓ | | | | |
| `analyst` | ✓ | ✓ | | ✓ | ✓ |
| `superadmin` | ✓ | ✓ | ✓ | ✓ | ✓ |

`requirePermission(perm)` gates routes; `res.locals.can(perm)` gates view
sections. Add a role by adding a registry entry; add a capability by adding a
permission string and gating where relevant.

**User-admin scope** (`USER_ADMIN` map in `config/roles.js`, enforced per action
in `userController`): `analyst` may `create`/`delete` users of role `viewer` only;
`superadmin` may `create`/`edit`/`delete` users of role `viewer` or `analyst`.
No one may edit or delete their own account. Superadmin accounts are managed only
via the DB / seed — the UI cannot create, edit, or delete them.

## Input handling

Two layers:

- **Output encoding** (primary XSS defense) — EJS `<%= %>` for HTML, `lib/jsonForHtml`
  for JSON embedded in `<script>` blocks, `textContent` client-side. Stored values are
  kept raw.
- **Input validation** (`lib/validate.js`) at every ingest boundary — `POST /log`,
  `GET /log-noscript`, `POST /api/static`, `POST /users` + update. Validates format
  (email, url scheme, event type charset), bounds length (`url` 2048, `sessionId` 128,
  `username` 3-50, data blob 64 KB), normalizes (trim, lowercase email, strip control
  chars). Bad input → `400` (API) or redirect-with-hint (forms); `/log` self-heals a
  missing `sessionId` (generated) or invalid `timestamp` (server time).

## Reports

`config/roles.js`-style registry in `lib/reportCategories.js` defines 4 categories
(`audience`, `performance`, `engagement`, `journey`), each with 3 chart specs
(`{ key, title, kind: bar|hbar, width: full|half }`) and a `build(start, end)` that
runs its 3 queries from `models/analyticsModel.js` over the last 7 days.

The create workspace (`report-workspace.js`) draws the charts, holds per-chart
analyst notes in browser memory (Edit/Save per box), and warns on unload while
dirty. **Save Report** POSTs `{type, charts, comments, range}` — the on-screen
snapshot — to `POST /reports`, which stores it in the `reports` table (immutable).
**Download PDF** builds the PDF client-side with jsPDF from the live canvases. A
saved report's Download link opens `GET /reports/:id/download`, a minimal page that
re-renders the stored snapshot and self-downloads the same PDF. No dashboard.

## Sessions

`cookie-session` stores only `{ userId }`. `loadUser` reads the `users` row on
every request, so role and account state are always current. The `/node/*` demo
routes use a separate `express-session` + MemoryStore so they can show a real
session id.

## Run

```
npm install
cp .env.example .env    # set SESSION_SECRET and DB_*
npm start
```

Or via the repo root: `make rebuild`.
