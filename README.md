# TaskMgmt

A lightweight task and sprint management tool for small teams — built to track projects, break features into user stories, and run sprint planning the way a scrum team actually works.

Built with **Java Spring Boot** (backend), **React** (frontend), and **PostgreSQL** (database).

## Overview

TaskMgmt lets a team:

- Create **Projects**, each with its own set of **Features**
- Break each Feature into **User Stories** (sub-tasks), where every story has:
  - A detailed description
  - Acceptance criteria
  - Story points (estimated effort in days)
  - Reported-to and Assigned-to users
  - A status (e.g. backlog, in progress, done)
- Plan and run **Sprints** for structured delivery

### How sprint planning works

1. A product owner creates a project, defines its features, and breaks them into user stories with story points.
2. A scrum master creates a sprint (typically a 10-working-day cycle) for a given feature.
3. Backlog stories are pulled into the sprint. Since story users are already tied to the project, sprint overview automatically reflects who's available.
4. Stories are assigned to users — either self-assigned or assigned by a manager — and tracked to completion.

## Tech Stack

| Layer      | Technology              |
|------------|--------------------------|
| Backend    | Java, Spring Boot        |
| Frontend   | React                    |
| Database   | PostgreSQL               |
| Container  | Docker / Docker Compose  |

## Project Structure

```
taskmgmt/
├── demo/                 # Spring Boot backend
├── my-app/                # React frontend
├── Master_Data.sql        # Seed / reference data
├── docker-compose.yml     # Multi-container setup (db + backend + frontend)
└── LICENSE
```

## Getting Started

### Prerequisites

- Docker & Docker Compose
- (For local, non-Docker dev) Java 17+, Maven, Node.js & npm

### Run with Docker Compose (recommended)

```bash
git clone https://github.com/Narayana3544/taskmgmt.git
cd taskmgmt
docker-compose up --build
```

This spins up three services:

| Service   | Description                  | Port                    |
|-----------|-------------------------------|--------------------------|
| postgres  | PostgreSQL 15 database        | `5432`                   |
| backend   | Spring Boot API                | `8080`                   |
| frontend  | React app (served on nginx)    | `3000` → container `80`  |

Once running:
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8080](http://localhost:8080)

### Run locally without Docker

**Backend**
```bash
cd demo
./mvnw spring-boot:run
```
Set the following environment variables (or edit `application.properties`) to point at your local Postgres instance:
```
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/task_mgmt
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=<your_password>
```

**Frontend**
```bash
cd my-app
npm install
npm start
```

**Database**

Create a Postgres database named `task_mgmt`, then load the seed data:
```bash
psql -U postgres -d task_mgmt -f Master_Data.sql
```

## Core Concepts

| Concept      | Description                                                            |
|--------------|--------------------------------------------------------------------------|
| Project      | Top-level container for a body of work                                  |
| Feature      | A capability within a project (`feature_id`, `project_id`)              |
| User Story   | A sub-task of a feature, with description, acceptance criteria, story points, assignee, and status |
| Sprint       | A fixed-duration (default 10 working day) cycle where backlog stories are pulled in and assigned |

## Roadmap / Ideas

- [ ] Sprint burndown charts
- [ ] Role-based access (product owner / scrum master / developer)
- [ ] Notifications on story assignment or status change

## License

This project is licensed under the [MIT License](LICENSE).
