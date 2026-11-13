# Hostel Attendance Management System

A responsive web app that replaces the paper attendance register for a college hostel.
Includes warden login, built with **React + Bootstrap 5** (frontend), **Node.js + Express**
(backend, MVC + Service + Repository), and **MySQL 8**.

---

## Features

- **Login** — secure sign-in page; only logged-in wardens can access the app and its data.
  Passwords are stored as salted hashes and sessions use a signed token.
- **Students** — add / edit / delete / search, activate-deactivate, filter by category
  (UG/PG), department, study year, room, status.
- **Rooms** — create / edit / delete, set capacity, assign, transfer, unassign students,
  live occupancy with available/occupied beds.
- **Attendance** — bulk mark present/absent per date (once per day enforced by the DB),
  edit records, searchable/filterable history.
- **Dashboard** — student counts, today's present/absent, hostel occupancy, 14-day trend,
  present-vs-absent, recent activity, frequently absent students.
- **Reports** — daily, weekly, monthly, academic-year, per-student, room-wise; export
  **PDF / Excel / CSV** and **print**.
- **Charts & Analytics** — monthly trend, room occupancy, hall-wise attendance,
  attendance % per student, frequently absent.
- **Academic Years** — create / activate / archive; attendance is preserved for archived
  years (never auto-deleted).

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Bootstrap 5, React Router 6, Axios, React-Bootstrap, Recharts, SheetJS, jsPDF |
| Backend | Node.js, Express 4, mysql2 (pool), morgan, dotenv, cors |
| Database | MySQL 8 (InnoDB, FKs, unique + check constraints) |

---

## Prerequisites

- Node.js 18+ (built/tested with Node 24)
- MySQL 8.0 running on `localhost:3306`
- MySQL Workbench (or `mysql` CLI) to import the database

---

## Setup

### 1. Import the database

Open `backend/database/hostel_attendance.sql` in MySQL Workbench and run it
(Server → Data Import, or File → Open SQL Script → Execute). This creates the
`hostel_attendance` database, tables, and demo seed data.

Alternative CLI (needs credentials that can create DBs):

```bash
cd backend
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 2. Configure the backend

```bash
cd backend
npm install
copy .env.example .env
```

Fill in `.env` with your own local database credentials and a random auth secret.

### 3. Start the backend

```bash
npm run dev        # http://localhost:5000   (health: /api/health)
```

### 4. Start the frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev        # http://localhost:5173
```

Open http://localhost:5173.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `backend: npm run dev` | Run API with auto-restart (`node --watch`) |
| `backend: npm start` | Run API |
| `backend: npm run db:create` | Create DB via CLI (prompts for password) |
| `frontend: npm run dev` | Vite dev server |
| `frontend: npm run build` | Production build to `dist/` |
| `frontend: npm run preview` | Preview the production build |

## Configuration

All configuration lives in local `.env` files. They are **gitignored** and must never be
committed. Use the provided `backend/.env.example` and `frontend/.env.example` as
templates, and set the real values in your hosting provider's environment settings.

Production deployments must set a strong, unique `AUTH_SECRET` (32+ random characters);
the API refuses to start in production without one.

## Security Checklist

- Change the seeded `admin` password immediately after the first login.
- Set a unique `AUTH_SECRET` per deployment and keep it out of the repository.
- Set `CORS_ORIGINS` to only the exact frontend origins you use.
- Rotate any credential that has ever been committed or shared.
- Keep `.env` files out of git; they are already ignored.

## Project Structure

```
hostel-attendance/
├── backend/          Express API (controllers → services → repositories → MySQL)
│   └── database/     schema.sql, seed.sql, hostel_attendance.sql (combined import)
├── frontend/         React SPA (Vite)
└── README.md
```

## Deployment

For a single-server production setup, build the frontend (`npm run build`) and serve
`frontend/dist` behind Nginx, run the API with `NODE_ENV=production`, and back up with
`mysqldump`.
