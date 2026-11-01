# Student Group Collaboration and Task Management System

A database-driven web application designed to help students organize academic group projects, manage tasks, coordinate availability, schedule meetings, and track group progress.

## 1. Project Overview

Students working on academic projects often face challenges in coordinating tasks, distributing responsibilities, tracking deadlines, and scheduling meetings.

Information is commonly scattered across messaging applications, spreadsheets, and documents. This can lead to missed deadlines, unclear responsibilities, scheduling conflicts, and difficulty monitoring project progress.

The **Student Group Collaboration and Task Management System** provides a centralized platform where students can create groups, manage members, assign tasks, track progress, coordinate availability, and organize meetings.

The system uses MySQL as its primary relational database and Next.js for the web application. An optional vector database provides semantic search capabilities, allowing users to find relevant tasks using natural-language queries.

## 2. Objectives

- Provide a centralized platform for student group collaboration.
- Allow students to create and manage academic groups.
- Enable task creation, assignment, and progress tracking.
- Maintain student availability information.
- Support meeting scheduling and agenda management.
- Maintain data consistency using database constraints and relationships.
- Demonstrate advanced DBMS concepts through SQL queries, joins, views, triggers, stored procedures, and transactions.
- Integrate the database with a functional web application.
- Explore semantic search using vector embeddings.

## 3. Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js, TypeScript |
| Backend | Next.js API Route Handlers |
| Relational Database | MySQL |
| Database Connectivity | mysql2 |
| Database Development | MySQL Workbench |
| Authentication | Signed, revocable HTTP-only sessions |
| Password Hashing | bcryptjs |
| Vector Database | ChromaDB (optional) |
| Embedding Model | Sentence Transformers – all-MiniLM-L6-v2 |
| Similarity Metric | Cosine Similarity |
| API Testing | Postman |
| Version Control | Git and GitHub |

## 4. System Architecture

The application follows a layered architecture:

1. **Frontend:** Provides the user interface for managing students, groups, tasks, assignments, availability, and meetings.
2. **Backend:** Handles API requests, authentication, authorization, validation, and business logic.
3. **MySQL Database:** Stores structured application data and maintains relationships between entities.
4. **Vector Database (Optional):** Stores embeddings to support semantic search.

### Architecture Flow

```text
             STUDENT / USER
                   |
                   v
           NEXT.JS FRONTEND
                   |
                   v
           NEXT.JS BACKEND
              /        \
             v          v
          MySQL       ChromaDB
        Database    (Optional)
             |          |
             v          v
       Structured    Semantic
          Data        Search
```

MySQL is the primary source of truth. ChromaDB is used only for semantic retrieval and does not replace the relational database.

## 5. Database Design

The system has nine collaboration tables plus a session table used to revoke
authenticated sessions.

| Table | Description |
|---|---|
| STUDENT | Stores student information and account details. |
| GROUP | Stores academic group information. |
| GROUP_MEMBER | Maintains student membership in groups. |
| AVAILABILITY | Stores student availability schedules. |
| TASK | Stores tasks created for groups. |
| TASK_ASSIGNMENT | Maintains task allocation to students. |
| MEETING | Stores scheduled group meetings. |
| MEETING_AGENDA | Stores agenda items for meetings. |
| MEETING_PARTICIPANT | Maintains meeting participants and attendance. |
| STUDENT_SESSION | Stores hashed session identifiers and expiry times. |

### Main Relationships

- A student can belong to multiple groups.
- A group can contain multiple students.
- A group can have multiple tasks.
- A task can be assigned to multiple students.
- A student can have multiple task assignments.
- A group can schedule multiple meetings.
- A meeting can contain multiple agenda items.
- A meeting can have multiple participants.
- A student can have multiple availability records.

Primary keys, foreign keys, unique constraints, and other integrity constraints are used to maintain database consistency.

**Note:** `GROUP` is a reserved SQL keyword in MySQL, so queries referencing this table should use backticks: `` `GROUP` ``.

### Database scripts

The `database/` directory contains the MySQL schema and supporting scripts:

| File | Purpose |
|---|---|
| `schema.sql` | Creates the database and all eleven tables, including sessions and group invitations. |
| `indexes.sql` | Adds indexes for task-group, deadline, and meeting lookups. |
| `procedures.sql` | Defines `GetGroupTasks`, which lists tasks for a group ID. |
| `queries.sql` | Provides example membership, task, meeting, and availability reports. |
| `seed.sql` | Inserts the sample students, groups, availability, tasks, meetings, agendas, participants, and assignments. Replace the password placeholders with password hashes before using the sample accounts for authentication. |
| `transactions.sql` | Demonstrates commit, rollback, and savepoint behavior using task updates. |
| `triggers.sql` | Prevents task assignment hours from exceeding a task estimate and task estimates from exceeding the group's project estimate. |
| `views.sql` | Defines `task_group_details` and the group summary view used by the dashboard. |
| `migrations/2026-10-project-hour-estimates.sql` | One-time upgrade for existing databases created before project/task hour estimates. |
| `migrations/2026-11-auth-sessions.sql` | Adds revocable sessions to an existing database. |
| `migrations/2026-11-group-invitations.sql` | Adds expiring account-creation invitations to an existing database. |

Run these scripts against MySQL 8.0 or later in this order:

1. `schema.sql`
2. `triggers.sql`
3. `indexes.sql`
4. `views.sql`
5. `procedures.sql`
6. `seed.sql` (optional)
7. `transactions.sql` (optional; changes sample task status if run)

The scripts use the `student_group_collaboration` database. Run them with the MySQL CLI, for example: `mysql -u <user> -p < database/schema.sql`. Run the seed script only once on a fresh database; the sample inserts are not designed to be re-run. Seed passwords are placeholders and must be replaced with securely generated hashes before enabling authentication.

For an existing database created before project/task hour estimates, run
`database/migrations/2026-10-project-hour-estimates.sql` once. For databases
created before authentication was added, run
`database/migrations/2026-11-auth-sessions.sql` once. Then rerun
`database/migrations/2026-11-group-invitations.sql` once to enable account
invitation links. Then rerun
`database/triggers.sql`, `database/indexes.sql`, `database/views.sql`, and
`database/procedures.sql` as needed. Do not run these migrations on a fresh
database created from `schema.sql`.

## 6. Features

### Student Management
- Student registration and login.
- Student profile management.
- Authentication and password security.

### Group Management
- Create academic groups.
- Set a total estimated-hour budget for each project; task estimates are checked
  against the remaining budget, and the budget can’t be lowered below planned hours.
- View group details.
- Add students as group members.

### Tasks, Meetings, and Collaboration
- Create tasks for a group, set a due date and priority, and update task progress.
- Set an estimate for each task and review planned hours against its project budget.
- Assign tasks to joined teammates, reassign them from the team workspace, and filter tasks by ownership, progress, and completion.
- Schedule group meetings with a date, time, and location.
- Open scheduled meetings to review their agenda, date and time, project, team lead, invitees, and online link or in-person location; record attendance to update the profile total.
- Add existing students directly to a team, or create a seven-day, email-bound signup link for a classmate who does not yet have an account. Every joined teammate can submit their own availability, while team leads can review submissions and use overlapping free slots to plan meetings.
- Review group membership, task progress, and upcoming meetings from the dashboard.
- Use a focused 25-minute timer to make space for individual work.
- View upcoming-meeting notifications, teammate and project profile stats, focus time, and achievement badges.
- Choose task deadlines using a calendar date picker.

### Web application
The Next.js workspace preserves the existing StudySync interface and loads
groups, tasks, meetings, participants, and availability from authenticated API
routes. Students can register, sign in/out, and update their profiles. Team
leaders can create groups, add existing students, set project-hour budgets,
create tasks, assign tasks, and schedule meetings with agenda items. Members
can update their own availability and attendance; server-side authorization
protects API operations.

The focus timer and achievement indicators are browser-session UI features;
focus time is not persisted to MySQL. Email delivery and password recovery are
not configured. See [the API and setup guide](docs/README.md) for route access,
database setup, and Postman instructions.

## 7. Project structure

```text
app/          Next.js pages, styles, and API routes
database/     MySQL schema and supporting SQL scripts
docs/         Setup and API documentation
lib/          Shared database connection
postman/      Postman API collection
```

`.next/` and `node_modules/` are generated by Next.js and npm; create them with
`npm run dev` and `npm install` rather than adding them to source control.

## 8. Run the application

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`, configure the MySQL connection, and set
   `SESSION_SECRET` to a random secret of at least 32 characters.
3. Run the database scripts in the order listed above.
4. Start the application with `npm run dev`.
5. Open `http://localhost:3000`.

The dashboard uses the `v_group_overview` view. Use `GET /api/health` to check
the database connection. See [docs/README.md](docs/README.md)
and import [the Postman collection](postman/Student-Group-Collaboration.postman_collection.json)
for API details.
