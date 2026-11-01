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
| Authentication | Auth.js or secure session-based authentication |
| Password Hashing | bcrypt |
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

The system consists of nine main relational tables.

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

## 6. Features

### Student Management
- Student registration and login.
- Student profile management.
- Authentication and password security.

### Group Management
- Create academic groups.
- View group details.
- Add
