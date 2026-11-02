# StudySync
### Student Group Collaboration and Task Management System

StudySync is a full-stack web application designed to simplify academic group collaboration. It provides students with a centralized platform to create project teams, distribute responsibilities, manage tasks, coordinate availability, schedule meetings, and track project progress.

Built with **Next.js, TypeScript,ChromaDB and MySQL**, StudySync combines a modern web interface with a relational database to provide structured, reliable, and efficient project management.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Objectives](#objectives)
3. [Features](#features)
4. [Technology Stack](#technology-stack)
5. [System Architecture](#system-architecture)
6. [Database Design](#database-design)
7. [DBMS Concepts Implemented](#dbms-concepts-implemented)
8. [Project Structure](#project-structure)
9. [Installation and Setup](#installation-and-setup)
10. [Environment Configuration](#environment-configuration)
11. [API Documentation](#api-documentation)
12. [Testing](#testing)
13. [Future Enhancements](#future-enhancements)

---

## Project Overview

Managing academic group projects involves coordinating multiple students, distributing tasks, tracking deadlines, and finding suitable meeting times. When these activities are managed across different applications, it becomes difficult to maintain consistency and monitor progress.

StudySync addresses these challenges by providing a unified workspace for academic collaboration.

Students can:
- Create academic project groups.
- Invite and manage team members.
- Assign tasks and monitor their progress.
- Set project and task hour estimates.
- Share their availability.
- Find overlapping free time slots.
- Schedule meetings and manage agendas.
- Monitor individual and group productivity.

The application uses **MySQL as its primary relational database** and Next.js API Route Handlers for backend operations. It also includes dependencies and configuration for an optional ChromaDB-based semantic search integration.

## Objectives

- Develop a centralized platform for academic group collaboration.
- Implement student authentication and profile management.
- Simplify team creation and member management.
- Enable task allocation, deadline tracking, and progress monitoring.
- Facilitate meeting scheduling through availability coordination.
- Maintain data consistency using relational constraints and database triggers.
- Demonstrate advanced DBMS concepts through SQL operations.
- Integrate a relational database with a full-stack web application.
- Explore vector database technology for semantic retrieval.

---

## Features

### 1. Student Authentication and Profile Management

- Student registration and login.
- Password hashing using bcryptjs.
- HTTP-only session-based authentication.
- Revocable sessions with expiry management.
- Student profile creation and modification.
- Profile statistics and achievement indicators.

### 2. Group Management

- Create academic project groups.
- Manage group information and membership.
- Add existing students using their email addresses.
- Generate email-bound invitation links for students who have not registered.
- Invitations expire after seven days.
- View group details and member information.
- Set estimated project-hour budgets.

### 3. Task Management

- Create tasks within academic groups.
- Assign tasks to team members.
- Reassign responsibilities.
- Set task priorities and deadlines.
- Track task statuses:
  - Pending
  - In Progress
  - Completed
- Set estimated hours for individual tasks.
- Allocate estimated working hours among assigned students.
- Filter tasks according to ownership and progress.

### 4. Availability Management

- Submit individual availability schedules.
- View personal availability records.
- Review availability submitted by group members.
- Identify overlapping free time slots.
- Coordinate suitable meeting schedules.

### 5. Meeting Management

- Schedule meetings for academic groups.
- Specify meeting dates, start times, end times, and locations.
- Add and manage meeting agenda items.
- Manage meeting participants.
- Record meeting attendance.
- Maintain attendance information for student profiles.

### 6. Dashboard and Productivity

- Centralized dashboard for group information.
- View project and task statistics.
- Monitor task completion.
- Track upcoming meetings.
- View teammate and project information.
- Upcoming-meeting notifications.
- 25-minute focus timer.
- Achievement badges and productivity indicators.

*Note: The focus timer and achievement indicators are browser-session UI features. Focus time is not persisted in MySQL.*

### 7. Semantic Search

The project includes dependencies for an optional ChromaDB integration.

- ChromaDB as the vector database.
- Embedding functionality through `@chroma-core/default-embed`.
- `CHROMA_URL` configuration for the ChromaDB service.
- Designed to complement relational data retrieval with semantic search.


---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 15, React 19 |
| Language | TypeScript |
| Backend | Next.js API Route Handlers |
| Database | MySQL 8.0+ |
| Database Connectivity | mysql2 |
| Authentication | HTTP-only sessions |
| Password Security | bcryptjs |
| Vector Database | ChromaDB (optional) |
| Embedding Integration | @chroma-core/default-embed |
| API Testing | Postman |
| Database Management | MySQL Workbench |
| Version Control | Git, GitHub |

---

## System Architecture

StudySync follows a layered application architecture.

```text
                  STUDENT / USER
                        |
                        v
                 PRESENTATION LAYER
                  Next.js / React
                        |
                        v
                 APPLICATION LAYER
                 Next.js API Routes
                        |
               +--------+--------+
               |                 |
               v                 v
         DATA LAYER         OPTIONAL SEARCH
         MySQL Database        ChromaDB
               |                 |
               v                 v
       Relational Records   Vector Embeddings
       and Relationships    and Retrieval
```

### Architecture Components

**Presentation Layer**

Provides the user interface for registration, authentication, dashboard operations, group management, task allocation, availability, and meetings.

**Application Layer**

Handles API requests, authentication, authorization, validation, and application business logic using Next.js Route Handlers.

**Relational Data Layer**

MySQL stores structured application information, including students, groups, memberships, tasks, assignments, meetings, and availability.

**Optional Vector Search Layer**

ChromaDB provides an additional vector storage and retrieval capability. It does not replace MySQL.

---

## Database Design

The application uses the MySQL database:

`student_group_collaboration`

The database contains 11 relational tables.

### Database Tables

| Table | Description |
|---|---|
| `STUDENT` | Stores student profiles and authentication information. |
| `STUDENT_SESSION` | Maintains authenticated sessions, expiry, and revocation. |
| `GROUP` | Stores academic project group details and project-hour estimates. |
| `GROUP_MEMBER` | Maintains student membership and group roles. |
| `GROUP_INVITATION` | Manages email-bound group invitations and expiry. |
| `TASK` | Stores tasks, deadlines, priorities, statuses, and estimated hours. |
| `TASK_ASSIGNMENT` | Maintains task allocation and assigned working hours. |
| `AVAILABILITY` | Stores individual student availability schedules. |
| `MEETING` | Stores scheduled group meetings. |
| `MEETING_AGENDA` | Stores meeting agenda items. |
| `MEETING_PARTICIPANT` | Maintains meeting participants and attendance status. |

### Entity Relationships

- A student can belong to multiple groups.
- A group can contain multiple students through `GROUP_MEMBER`.
- A group can contain multiple tasks.
- A task can have multiple student assignments.
- A student can have multiple task assignments.
- A group can schedule multiple meetings.
- A meeting can contain multiple agenda items.
- A meeting can have multiple participants.
- A student can maintain multiple availability records.
- A group can have multiple invitations.

Primary keys, foreign keys, unique constraints, and check constraints maintain referential integrity and data consistency.

**Important:** `GROUP` is a reserved keyword in MySQL. Queries referencing this table use backticks.

### Database Scripts

The `database/` directory contains the following SQL scripts:

| File | Purpose |
|---|---|
| `schema.sql` | Creates the database and all 11 relational tables. |
| `seed.sql` | Inserts sample students, groups, tasks, assignments, meetings, and availability records. |
| `queries.sql` | Contains SQL queries for retrieving application information. |
| `indexes.sql` | Creates indexes for frequently accessed records. |
| `views.sql` | Creates reusable views for task and group information. |
| `procedures.sql` | Defines stored procedures for retrieving group tasks. |
| `triggers.sql` | Implements automatic validation of project and task-hour limits. |
| `transactions.sql` | Demonstrates transaction control using COMMIT, ROLLBACK, and SAVEPOINT. |

### Database Views

**1. `task_group_details`**

Combines task and group information to simplify queries involving task details and their corresponding academic groups.

**2. `v_group_overview`**

Provides a consolidated group overview containing:
- Group identification and name.
- Group description.
- Creator and creation date.
- Estimated project hours.
- Number of group members.
- Total number of tasks.
- Number of completed tasks.

### Stored Procedure

**`GetGroupTasks(IN gid INT)`**

Retrieves all tasks associated with a specified group ID, including task titles, descriptions, deadlines, priorities, statuses, and estimated hours.

### Database Triggers

The project implements triggers to enforce hour-allocation rules.

| Trigger | Function |
|---|---|
| `check_task_assignment_hours` | Prevents assigned hours from exceeding the estimated hours of a task. |
| `check_task_assignment_hours_update` | Validates hour limits when task assignments are updated. |
| `check_task_project_estimate_insert` | Prevents new task estimates from exceeding the group's project-hour budget. |
| `check_task_project_estimate_update` | Validates project-hour limits when task estimates are modified. |
| `check_group_project_estimate_update` | Prevents reducing a project's estimated hours below its existing planned task hours. |

These triggers use MySQL's `SIGNAL SQLSTATE '45000'` to reject invalid operations.

### Database Indexes

The following indexes improve query performance:

- `idx_task_group` – Indexes tasks by group ID.
- `idx_task_deadline` – Improves task deadline lookups.
- `idx_meeting_group_date` – Improves meeting retrieval by group and date.

### Database Migrations

The `database/migrations/` directory contains scripts for upgrading previously initialized databases.

- `2026-10-project-hour-estimates.sql`
- `2026-11-auth-sessions.sql`
- `2026-11-group-invitations.sql`

These migrations are intended for existing databases created using older schema versions.

**Do not execute these migration scripts on a fresh database initialized using the current `schema.sql`.**

---

## DBMS Concepts Implemented

StudySync demonstrates practical implementation of database management concepts.

| DBMS Concept | Application |
|---|---|
| DDL | Creating and modifying database structures. |
| DML | Inserting and updating application records. |
| Primary Keys | Uniquely identifying database records. |
| Foreign Keys | Maintaining relationships between tables. |
| Constraints | Enforcing data integrity. |
| Joins | Retrieving related information across tables. |
| Views | Simplifying frequently used queries. |
| Stored Procedures | Encapsulating reusable SQL operations. |
| Triggers | Automatically validating business rules. |
| Indexes | Improving query performance. |
| Transactions | Maintaining reliable database operations. |
| COMMIT | Permanently applying transactional changes. |
| ROLLBACK | Reverting uncommitted changes. |
| SAVEPOINT | Establishing intermediate transaction rollback points. |

---

## Project Structure

```text
StudySync/
│
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── groups/
│   │   ├── tasks/
│   │   ├── meetings/
│   │   ├── availability/
│   │   ├── invitations/
│   │   ├── dashboard/
│   │   └── student/
│   ├── components/
│   └── pages and styles
│
├── database/
│   ├── migrations/
│   ├── schema.sql
│   ├── seed.sql
│   ├── queries.sql
│   ├── indexes.sql
│   ├── procedures.sql
│   ├── triggers.sql
│   ├── views.sql
│   └── transactions.sql
│
├── docs/
│   └── README.md
│
├── lib/
│   └── Shared database and application utilities
│
├── postman/
│   └── Student-Group-Collaboration.postman_collection.json
│
├── .env.example
├── .gitignore
├── middleware.ts
├── next.config.mjs
├── package.json
├── package-lock.json
└── tsconfig.json
```

---

## Installation and Setup

### Prerequisites

Ensure that the following are installed:

- Node.js 20 or later.
- npm.
- MySQL 8.0 or later.
- MySQL Workbench (recommended).
- Git.

### 1. Clone the Repository

```bash
git clone https://github.com/PREETHI-T0511/StudySync.git
cd StudySync
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a local environment configuration file:

**Windows:**

```cmd
copy .env.example .env.local
```

**Linux / macOS:**

```bash
cp .env.example .env.local
```

Update the database credentials and authentication secret.

### 4. Set Up the MySQL Database

Open MySQL Workbench or the MySQL command-line client.

Execute the SQL scripts in the following order:

1. `database/schema.sql`
2. `database/triggers.sql`
3. `database/indexes.sql`
4. `database/views.sql`
5. `database/procedures.sql`
6. `database/seed.sql` (optional)
7. `database/transactions.sql` (optional)

The database is created automatically using the name `student_group_collaboration`.

The seed script inserts sample records. Replace its placeholder passwords with valid bcrypt hashes before testing authentication.

Run the seed script only once on a fresh database.

The transaction demonstration script modifies sample task records.

### 5. Start the Development Server

```bash
npm run dev
```

### 6. Access the Application

Open your browser and navigate to:

```text
http://localhost:3000
```

---

## Environment Configuration

The application uses `.env.local` to configure database connectivity and authentication.

The expected variables are:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=student_group_collaboration

SESSION_SECRET=your_random_secret_of_at_least_32_characters

CHROMA_URL=http://localhost:8000
```

| Variable | Description |
|---|---|
| `DB_HOST` | MySQL server hostname. |
| `DB_PORT` | MySQL server port. |
| `DB_USER` | MySQL username. |
| `DB_PASSWORD` | MySQL password. |
| `DB_NAME` | Application database name. |
| `SESSION_SECRET` | Secret used for session authentication. |
| `CHROMA_URL` | Optional ChromaDB service URL. |

Keep `.env.local` private and never commit database credentials or authentication secrets to GitHub.

---

## API Documentation

StudySync uses Next.js API Route Handlers to expose application functionality.

The Postman collection is available at:

`postman/Student-Group-Collaboration.postman_collection.json`

### Main API Endpoints

| Module | Method | Endpoint | Description |
|---|---|---|---|
| Health | GET | `/api/health` | Checks database connectivity. |
| Authentication | POST | `/api/auth/register` | Registers a student. |
| Authentication | POST | `/api/auth/login` | Authenticates a student. |
| Authentication | GET | `/api/auth/me` | Retrieves the current student. |
| Authentication | POST | `/api/auth/logout` | Ends the current session. |
| Profile | PATCH | `/api/student/profile` | Updates student information. |
| Dashboard | GET | `/api/dashboard` | Retrieves dashboard information. |
| Groups | GET | `/api/groups` | Lists groups. |
| Groups | POST | `/api/groups` | Creates a group. |
| Groups | GET | `/api/groups/:groupId` | Retrieves group details. |
| Members | GET | `/api/groups/:groupId/members` | Lists group members. |
| Members | POST | `/api/groups/:groupId/members` | Adds a member by email. |
| Invitations | GET | `/api/invitations/:token` | Inspects an invitation. |
| Invitations | POST | `/api/invitations/accept` | Accepts a group invitation. |
| Tasks | GET | `/api/groups/:groupId/tasks` | Lists group tasks. |
| Tasks | POST | `/api/groups/:groupId/tasks` | Creates a task. |
| Tasks | PATCH | `/api/tasks/:taskId` | Updates task status. |
| Availability | GET | `/api/availability` | Retrieves personal availability. |
| Availability | POST | `/api/availability` | Adds an availability record. |
| Availability | DELETE | `/api/availability/:id` | Deletes an availability record. |
| Meetings | GET | `/api/meetings?groupId=:groupId` | Lists group meetings. |
| Meetings | POST | `/api/meetings` | Schedules a meeting with agenda items. |
| Meetings | GET | `/api/meetings/:meetingId` | Retrieves meeting details. |
| Meetings | POST | `/api/meetings/:meetingId/agenda` | Adds a meeting agenda item. |

### Authentication

Authenticated API requests use HTTP-only session cookies.

After successful registration or login, Postman retains the session cookie and automatically sends it with subsequent requests.

### Health Check

```http
GET /api/health
```

Successful response:

```json
{
  "status": "ok",
  "database": "connected"
}
```

Returns HTTP 503 when the database is unavailable.

---

## Testing

StudySync includes a Postman collection for testing its API endpoints.

### Postman Setup

1. Open Postman.
2. Select Import.
3. Choose `postman/Student-Group-Collaboration.postman_collection.json`.
4. Set the `baseUrl` collection variable to `http://localhost:3000`.
5. Start the development server.
6. Register or log in using the authentication requests.
7. Execute the remaining authenticated requests.

The collection includes requests for:
- Health checks.
- Student registration and authentication.
- Profile management.
- Group creation and membership.
- Group invitations.
- Task creation and updates.
- Availability management.
- Meeting scheduling and agenda management.

### Available npm Scripts

**Start development server**

```bash
npm run dev
```

**Create production build**

```bash
npm run build
```

**Run production server**

```bash
npm run start
```

**Run TypeScript type checking**

```bash
npm run typecheck
```

**Run linting**

```bash
npm run lint
```

---

## Future Enhancements

Potential improvements include:

- Complete semantic search functionality using ChromaDB.
- Automated email notifications for invitations and deadlines.
- Password recovery and email verification.
- Real-time task updates and collaboration.
- Calendar integration for meeting scheduling.
- Persistent productivity analytics.
- Improved reporting and visualization of team performance.

---

## Conclusion

StudySync provides an integrated environment for academic teamwork by combining group management, task allocation, availability coordination, and meeting scheduling.

Beyond its application functionality, the project demonstrates the practical implementation of relational database concepts, including normalization, constraints, joins, views, stored procedures, triggers, indexes, and transaction management.

By integrating a structured MySQL database with a modern Next.js application, StudySync aims to make student collaboration more organized, transparent, and efficient.

---

**StudySync — Organize. Collaborate. Accomplish.**
