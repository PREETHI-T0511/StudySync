# Project documentation

## Local setup

1. Install Node.js 20 or later, MySQL 8.0 or later, and Docker Compose.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env.local`, configure the MySQL connection, and set
   `SESSION_SECRET` to a random value of at least 32 characters.
4. Create the database by running the scripts in the order described in the
   root [README](../README.md). For a fresh install, run `schema.sql` first;
   existing databases need the documented migrations.
5. Start the development server with `npm run dev`.
6. Open `http://localhost:3000`, register an account, and sign in.

Start local ChromaDB before using semantic task search:
`docker compose up -d chroma`. Task embeddings are generated locally using
all-MiniLM-L6-v2; the model files are downloaded on the first semantic search
or duplicate-task check.
ChromaDB stores its persisted index in the `chroma_data` Docker volume.

The groups dashboard reads from the `v_group_overview` database view created by
`database/views.sql`. `GET /api/health` checks database connectivity. Never use
seed placeholder passwords as account credentials; the sample seed is for
database demonstrations only.

## Authentication and authorization

Registration and login return an HTTP-only, same-site session cookie. Passwords
are stored as bcrypt hashes. Unknown login emails receive a create-account
prompt. The cookie contains a signed token, while
`STUDENT_SESSION` stores a hash of the session identifier so sessions can be
revoked at logout. Keep `SESSION_SECRET` private and rotate it if it is exposed.

All student, group, task, availability, meeting, and dashboard data routes
require an authenticated session. Group members may view their group data;
leader-only routes enforce authorization on the server. Users may update their
own profile and availability. Do not rely on frontend visibility as an
authorization control.

When a team lead enters an email that has no StudySync account, the members API
creates a seven-day, single-use signup link bound to that email. The link opens
the account-creation page, pre-fills the invited email, and adds the new account
to the team after registration. Share the link directly with the intended
student; invitation links grant team access.

## API

All request and response bodies use JSON. Postman or a browser client should
retain the session cookie set by registration/login for subsequent requests.
Errors return JSON in the form `{ "error": "..." }`.

### Health and authentication

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Check MySQL connectivity. |
| GET | `/api/search/tasks?q=:query` | Return up to ten relevance-ranked task matches for the authenticated student, including partial text matches; ChromaDB adds semantic matches when available. |
| POST | `/api/groups/:groupId/tasks/similar` | Find similar existing tasks across the authenticated leader's teams before task creation; accepts `taskTitle` and optional `taskDescription`. |
| POST | `/api/auth/register` | Register with `studentName`, `email`, `password`; optional `department`, `semester`, and `cgpa`. |
| POST | `/api/auth/login` | Sign in with `email`, `password`, and optional boolean `rememberMe`. |
| POST | `/api/auth/logout` | Revoke the current session and clear its cookie. |
| GET | `/api/auth/me` | Return the authenticated student. |
| GET/PATCH | `/api/student/profile` | Read or update the authenticated student's profile. |

### Groups and tasks

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/api/groups` | List joined/led groups; create a group (creator becomes leader). |
| GET/PATCH/DELETE | `/api/groups/:groupId` | Read, update, or delete a group (leader only for changes). |
| GET/POST | `/api/groups/:groupId/members` | List members or add a registered student/create an invitation link by email (leader only to add/invite). |
| DELETE | `/api/groups/:groupId/members/:studentId` | Remove a member (leader only). |
| GET | `/api/invitations/:token` | Validate a signup link and retrieve its invited email/team. |
| POST | `/api/invitations/accept` | Accept a team invitation for an authenticated student. |
| GET/POST | `/api/groups/:groupId/tasks` | List or create group tasks (leader only to create). |
| GET | `/api/tasks?groupId=:groupId` | List tasks visible to the authenticated student. |
| GET/PATCH/DELETE | `/api/tasks/:taskId` | Read, update, or delete a task; changes require a leader or assigned student as applicable. |
| GET/POST | `/api/tasks/:taskId/assignments` | List or add task assignments (leader only to change). |
| PATCH/DELETE | `/api/tasks/:taskId/assignments/:studentId` | Reassign or remove a task assignment (leader only). |

### Availability, meetings, and dashboard

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/api/availability` | Read own availability or group availability with `?groupId=...`; create own availability. |
| PATCH/DELETE | `/api/availability/:availabilityId` | Update or remove the authenticated student's availability. |
| GET/POST | `/api/meetings` | List accessible meetings or schedule a group meeting (leader only to schedule). |
| GET/PATCH/DELETE | `/api/meetings/:meetingId` | Read, update, or delete a meeting (leader only for changes). |
| GET/POST | `/api/meetings/:meetingId/agenda` | List or add agenda items (leader only to add). |
| PATCH/DELETE | `/api/meetings/:meetingId/agenda/:agendaId` | Update or remove an agenda item (leader only). |
| GET/POST | `/api/meetings/:meetingId/participants` | List or invite group participants (leader only to invite). |
| PATCH/DELETE | `/api/meetings/:meetingId/participants/:studentId` | Update attendance or remove a participant. |
| GET | `/api/dashboard` | Return the authenticated student's group/task counts and upcoming meetings. |

Use the imported
[Postman collection](../postman/Student-Group-Collaboration.postman_collection.json)
to exercise the main authentication, group, task, availability, and meeting
requests. API mutations validate input and enforce group membership/leadership
on the server.

For existing databases, apply
`database/migrations/2026-11-group-invitations.sql` before using invitations.
Fresh databases include this table in `database/schema.sql`.

## Validation

Run `npm run typecheck` to check TypeScript. MySQL-backed routes require a
running MySQL database with the schema, views, procedures, and triggers installed.
