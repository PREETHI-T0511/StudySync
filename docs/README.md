# Project documentation

## Local setup

1. Install Node.js 20 or later and MySQL 8.0 or later.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env.local` and set your MySQL connection values.
4. Run the database scripts in the order described in the root [README](../README.md).
5. Start the development server with `npm run dev`.
6. Open `http://localhost:3000`.

The groups dashboard reads from the `v_group_overview` database view, which is
created by `database/views.sql`. The schema database is named
`student_group_collaboration`; set `DB_NAME` accordingly in `.env.local`.
The health endpoint can be used to confirm that the application can reach MySQL.

## API

### `GET /api/health`

Returns HTTP 200 with `{ "status": "ok", "database": "connected" }` when the
database is reachable. Returns HTTP 503 when it is unavailable.

### `GET /api/groups`

Returns a JSON object with a `groups` array. Each item includes its ID, name,
description, member count, task count, and completed task count. Requires
`v_group_overview` to have been created.

These initial endpoints are for local development. Add authentication and
authorization before exposing application data in a deployed environment.
