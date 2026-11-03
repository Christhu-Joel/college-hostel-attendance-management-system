# Hostel Attendance Management System — Design Document

Version 1.0 · Author: Senior Architect / Full-Stack Team

---

## 1. Introduction

The paper-based daily attendance register kept by the hostel warden is replaced by a
responsive web application. The warden records who is present/absent in the hostel each
night, tracks students and rooms, and produces reports for the college administration.

The system is **single-user**, **no authentication**, and designed to be run locally
(Windows + MySQL 8) or deployed to a small server.

---

## 2. Functional Requirements (FR)

| ID | Module | Requirement |
|----|--------|-------------|
| FR-01 | Students | Add, edit, delete, view, search students |
| FR-02 | Students | Activate / deactivate a student |
| FR-03 | Students | Filter students by category (UG/PG), department, study year, room, status |
| FR-04 | Rooms | Create, edit, delete rooms; set capacity |
| FR-05 | Rooms | Assign a student to a room (capacity-aware) |
| FR-06 | Rooms | Transfer a student between rooms |
| FR-07 | Rooms | View occupancy, available beds, occupied beds per room |
| FR-08 | Attendance | Mark present/absent for a date (bulk sheet) |
| FR-09 | Attendance | Edit an existing attendance record |
| FR-10 | Attendance | Attendance recorded **once per day per student** (unique constraint) |
| FR-11 | Attendance | Search/filter history by date, room, student, status, academic year |
| FR-12 | Dashboard | Show total / active / inactive students, today's present/absent, occupancy, recent activity |
| FR-13 | Reports | Daily, weekly, monthly, academic-year, per-student, room-wise reports |
| FR-14 | Reports | Export to PDF, Excel, CSV and print |
| FR-15 | Analytics | Trends, present vs absent, room occupancy, hall-wise, frequently absent students |
| FR-16 | Academic Year | Create, activate, archive academic years |
| FR-17 | Academic Year | Never delete attendance automatically; view attendance by academic year |
| FR-18 | UX | Mobile/tablet/desktop responsive via Bootstrap 5 |
| FR-19 | UX | Modals, toasts, confirmations, loading states, empty states, pagination |

## 3. Non-Functional Requirements (NFR)

- **Performance**: API responses < 500 ms for local network; paginated lists; indexed queries.
- **Reliability**: MySQL transactions for multi-step writes (room capacity + student assignment).
- **Maintainability**: Clean separation — Controller → Service → Repository → MySQL.
- **Data integrity**: FKs, unique constraints, CHECK constraints, ON DELETE rules.
- **Usability**: Simple single-screen flows; bulk actions; instant feedback via toasts.
- **Responsiveness**: Bootstrap breakpoints (xs/md/lg/xl).
- **Security (pragmatic)**: Local-only app; still parameterized SQL (no injection),
  hidden env credentials, CORS restricted to the Vite dev origin, body-size limits.
- **Portability**: Node 18+ (tested on Node 24), MySQL 8.0.

---

## 4. System Architecture

```
+--------------------------------------------------------------+
|  React SPA (Browser)   - Bootstrap 5, React Router, Axios    |
|  Pages -> Components -> api layer (axios) -> REST            |
+------------------------------+-------------------------------+
                               |  HTTP/JSON (REST, /api/*)
+------------------------------v-------------------------------+
|  Express.js API                                              |
|  Routes  ->  Controllers  ->  Services  ->  Repositories     |
|  middleware: cors, json, morgan, error handler               |
+------------------------------+-------------------------------+
                               |  mysql2 (connection pool)
+------------------------------v-------------------------------+
|  MySQL 8 - hostel_attendance                                 |
|  academic_years, rooms, students, attendance                 |
+--------------------------------------------------------------+
```

**Request lifecycle:**
1. Browser calls `GET /api/students?status=active`
2. `routes` → `studentController.list`
3. `controller` (thin) → `studentService.list(query)`
4. `service` validates & normalizes → `studentRepository.findAll(filters, page)`
5. `repository` builds parameterized SQL against the connection pool
6. `asyncHandler` forwards rejections → global `errorHandler` → JSON `{ success, message }`

---

## 5. High-Level Design (HLD)

Three logical tiers:

1. **Presentation** (React) — 7 screens, route-scoped.
2. **Application/API** (Express) — 6 resource families + health.
3. **Data** (MySQL) — 4 tables, normalized, FK-constrained.

Shared conventions:
- Uniform response envelope `{ success, message, data, pagination }`.
- All async handlers wrapped by `asyncHandler` (no try/catch duplication).
- All business rules enforced in the **service layer** (single source of truth).
- All SQL isolated in the **repository layer**.
- DB credentials only in `.env` (git-ignored).

## 6. Low-Level Design (LLD)

### 6.1 Backend layers

| Layer | File | Responsibility |
|-------|------|----------------|
| Route | `routes/*.js` | Map URL → controller method |
| Controller | `controllers/*.js` | Parse request, call service, shape response |
| Service | `services/*.js` | Validation, business rules, orchestration |
| Repository | `repositories/*.js` | Parameterized SQL, returns plain objects |
| Config | `config/config.js`, `config/db.js` | Env config + connection pool |
| Util | `utils/*.js` | `ApiError`, `asyncHandler`, `validators` |
| Middleware | `middleware/errorMiddleware.js` | 404 handler + global error mapping |

Key service rules (LLD detail):

- **studentService.create** — validate fields → unique `register_no` → room exists & not full → insert → resync room strength.
- **studentService.update** — partial update; if `room_id` changes, re-validate capacity excluding the student, sync both rooms.
- **roomService.assignStudent / transferStudent** — enforce `current < capacity`; sync strength of source & destination.
- **roomService.remove** — reject if occupants exist (409).
- **attendanceService.markForDate** — reject future dates; reject inactive students; bulk upsert with `ON DUPLICATE KEY`; tag with active academic year.
- **academicYearService** — `YYYY-YYYY` validation; activating one year deactivates the rest; archive never deletes.
- **errorHandler** — maps MySQL codes: `ER_DUP_ENTRY`→409, `ER_ROW_IS_REFERENCED_2`→409, connection refused→503, missing DB→503.

---

## 7. Use Case Diagram

```
                +-----------------------------------+
                |           Hostel Warden           |
                +-----------------------------------+
      |              |              |               |              |
 Manage Students  Manage Rooms  Record Attendance  View Dashboard  Reports/Analytics
      |              |              |               |              |
 - Add/Edit/Delete  - Create/Edit  - Mark present   - KPIs         - Daily/Weekly/
 - Search/Filter    - Set capacity - Mark absent    - Trends       - Monthly/Academic
 - Activate/Deact.  - Assign       - Edit record    - Occupancy    - Per-student
 - View details     - Transfer     - View history                  - Room-wise
                    - Occupancy                                      - Export PDF/Excel/CSV
```

## 8. Activity Diagram (Mark Attendance)

```
[Choose date] --> [Load active students + existing records]
      --> [Bulk defaults: All Present / All Absent]
      --> [Toggle per-student Present/Absent] (loop)
      --> [Validate: no future date, active students]
      --> [Save (upsert)] --> [Toast success] --> [Reload sheet]
```

## 9. Sequence Diagram (Transfer Student)

```
UI             RoomService        StudentRepo      RoomRepo           MySQL
 | POST /rooms/students/:id/transfer |                 |                 |
 |---------------------------------->| findBy id       |                 |
 |                                   |---------------->|                 |
 |                                   |< find student   |                 |
 |                                   | find dest room  |                 |
 |                                   |---------------->|                 |
 |                                   |< capacity check |                 |
 |                                   | update room_id  |                 |
 |                                   |---------------->| (UPDATE)        |
 |                                   | sync strength src/dst           |
 |                                   |<----------------|                 |
 |<----- { from_room, to_room } -----|                 |                 |
```

## 10. Class Diagram (domain objects)

```
+------------------+     1      *  +------------------+
| Room             |---------------| Student          |
| - id             |              | - id             |
| - room_number    |              | - register_no    |
| - capacity       |              | - name           |
| - current_strength|             | - category       |
| + occupants()    |              | - department     |
| + availableBeds()|              | - study_year     |
+------------------+              | - room_id -> Room|
                                  | - status         |
                                  +------------------+
                                          | 1
                                          | *
+------------------+        +---------------------+
| Attendance       |        | AcademicYear        |
| - id             |        | - id                |
| - student_id -> S|        | - year_name         |
| - attendance_date|        | - is_active         |
| - status         |        +---------------------+
| - academic_year_id (FK, SET NULL)
+------------------+

Service interfaces (abbreviated):
  StudentService  { list, get, create, update, remove, setStatus, departments }
  RoomService     { list, get, create, update, remove, assignStudent, transferStudent, unassignStudent, summary }
  AttendanceService { markForDate, getForDate, updateRecord, history }
  AcademicYearService { list, create, activate, archive, getActive }
  ReportService   { dailyReport, periodReport, studentReport, roomReport, charts, meta }
```

---

## 11. ER Diagram & Database Schema

```
academic_years 1 -- * attendance * -- 1 students * -- 1 rooms
   (archive, never deleted)              (SET NULL on room delete)
```

| Table | Columns | Keys / Constraints |
|-------|---------|--------------------|
| **academic_years** | id, year_name, is_active, created_at | PK id; UNIQUE year_name |
| **rooms** | id, room_number, capacity, current_strength, created_at, updated_at | PK id; UNIQUE room_number; CHECK capacity>=1, current_strength>=0 |
| **students** | id, register_no, name, category(UG/PG), department, study_year, room_id, status, created_at, updated_at | PK id; UNIQUE register_no; FK room_id → rooms ON DELETE SET NULL; CHECK study_year 1..6; indexes on name, category, department, study_year, room, status |
| **attendance** | id, student_id, attendance_date, status(P/A), academic_year_id, marked_at | PK id; **UNIQUE(student_id, attendance_date)** → once per day; FK student_id → students ON DELETE CASCADE; FK academic_year_id → academic_years ON DELETE SET NULL; index on attendance_date |

**Why ON DELETE CASCADE on attendance?** Deleting a student is an explicit warden action
and cascades their records. Academic years are never deleted (only archived), and attendance
keeps a nullable FK so orphaned rows cannot occur.

---

## 12. REST API Documentation

Base URL: `http://localhost:5000/api` · Content-Type: `application/json`
Envelope: `{ "success": true, "data": ... , "pagination": { page, size, total, pages } }`

### Students `/students`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/students?search=&category=&department=&study_year=&room_id=&status=&page=&size=` | List (paginated) |
| GET | `/students/:id` | Detail |
| GET | `/students/departments` | Distinct departments |
| POST | `/students` | Create `{ register_no, name, category, department, study_year, room_id?, status? }` → 201 |
| PUT | `/students/:id` | Partial update (all fields optional) |
| PATCH | `/students/:id/status` | `{ status: 'active'\|'inactive' }` |
| DELETE | `/students/:id` | Delete (cascades attendance) |

### Rooms `/rooms`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/rooms?search=&status=available\|full` | List (paginated) |
| GET | `/rooms/:id` | Detail incl. `occupants[]` |
| GET | `/rooms/summary` | Totals: rooms, capacity, occupied, available, rate |
| POST | `/rooms` | Create `{ room_number, capacity }` |
| PUT | `/rooms/:id` | Update |
| DELETE | `/rooms/:id` | Delete (409 if occupied) |
| POST | `/rooms/:id/assign` | `{ student_id }` assign to room |
| POST | `/rooms/students/:studentId/transfer` | `{ to_room_id }` transfer |
| POST | `/rooms/students/:studentId/unassign` | Vacate room |

### Attendance `/attendance`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/attendance/mark` | `{ date, records: [{student_id,status}] }` upsert (bulk) |
| GET | `/attendance/:date?page=&size=` | Sheet for a date + counts |
| PUT | `/attendance/:id` | `{ status }` edit record |
| GET | `/attendance/history?date=&room_id=&student_id=&status=&academic_year_id=&from=&to=&search=&page=&size=` | History |

### Academic Years `/academic-years`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/academic-years` | List with attendance_count |
| GET | `/academic-years/active` | Current active year |
| POST | `/academic-years` | Create `{ year_name: "2026-2027" }` |
| POST | `/academic-years/:id/activate` | Activate (deactivates others) |
| POST | `/academic-years/:id/archive` | Archive (keeps records) |

### Dashboard `/dashboard`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | KPIs + today's counts + occupancy + recent activity |
| GET | `/dashboard/charts?days=&top=` | Daily trend, present/absent totals, frequently absent |

### Reports `/reports`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/reports/daily?from=&to=&academic_year_id=` | Daily totals |
| GET | `/reports/period/:period` | period ∈ daily\|weekly\|monthly\|academic_year |
| GET | `/reports/students?from=&to=&academic_year_id=&department=&category=&student_id=&room_id=` | Per-student report |
| GET | `/reports/rooms?from=&to=&academic_year_id=` | Room-wise report |
| GET | `/reports/charts?academic_year_id=` | Monthly trend, room occupancy, hall-wise, % per student |
| GET | `/reports/meta` | Filter dropdown data |

### Status codes
`200 OK · 201 Created · 400 Validation · 404 Not found · 409 Conflict (duplicate/referenced) · 503 DB unavailable`

---

## 13. Folder Structure

```
C:\hostel-attendance\
├── backend\
│   ├── config\        config.js, db.js
│   ├── controllers\   student/room/attendance/academicYear/dashboard/report
│   ├── routes\        per-resource routers + app wiring
│   ├── services\      business logic + validation
│   ├── repositories\  parameterized SQL
│   ├── middleware\    errorMiddleware.js
│   ├── utils\         ApiError, asyncHandler, validators
│   ├── database\      schema.sql, seed.sql, hostel_attendance.sql (combined)
│   ├── .env / .env.example
│   ├── app.js  server.js  package.json
├── frontend\
│   ├── src\
│   │   ├── api\           http.js (axios), index.js (typed endpoints)
│   │   ├── components\
│   │   │   ├── layout\    Layout, Sidebar, Topbar
│   │   │   ├── common\    Loading, EmptyState, ConfirmDialog, PaginationBar, StatCard, Badges
│   │   │   ├── students\  StudentFormModal
│   │   │   └── rooms\     RoomFormModal, AssignStudentModal, TransferStudentModal
│   │   ├── pages\         Dashboard, Students, Rooms, Attendance, Analytics, Reports, AcademicYears
│   │   ├── context\       ToastContext.jsx
│   │   ├── utils\         exportUtils.js (CSV/Excel/PDF/Print)
│   │   ├── App.jsx  main.jsx  index.css
│   ├── public\ favicon.svg, index.html
│   ├── vite.config.js (proxy /api → :5000)
│   └── package.json
├── docs\ DESIGN.md
└── README.md
```

## 14. UI Wireframes (key screens)

```
DASHBOARD                     STUDENTS
+----------------------------+  +----------------------------+
| Sidebar | Cards: Total/Act |  | Sidebar | Add Student [btn]|
|         | Inact/Present/Abs|  |         | [Search][Filt]   |
|         | Occupancy        |  |         | +----------------+|
|         | Trend chart  R.A.|  |         | | Reg No| Name | |
+----------------------------+  |         | |.......|......| |
ATTENDANCE                     |         | +----------------+|
| Tabs: Mark | History        |  |         | [<1][2][3][>]    |
| Date picker | All P / All A |  +----------------------------+
| Table: Student | P/A toggle |
| [Save Attendance]           |
```

Design tokens: primary `#0d6efd`, sidebar `#1b2a4a`, success `#198754` (present), danger
`#dc3545` (absent). Tables: sticky uppercase headers, zebra hover. All actions use
icon buttons with tooltips; destructive actions always behind a ConfirmDialog.

## 15. Responsive Design Strategy

- Bootstrap grid `Row/Col` with `xs/md/lg/xl` breakpoints everywhere.
- Fixed sidebar collapses to an off-canvas drawer under `lg` (`d-lg-none` backdrop + toggle).
- Topbar shows title only on `sm+`; date hidden under `md`.
- Stat cards stack 2-up on phones, 6-up on desktops.
- Tables wrapped in `.table-responsive` for horizontal scroll on small screens.
- Charts use `ResponsiveContainer` so they scale with the card.

## 16. Testing Strategy

| Level | Scope | How |
|-------|-------|-----|
| Unit (services) | Validators, year-name regex, capacity rules | Node built-in `node:test` (add later) |
| Integration | Repository SQL against seeded DB | Seed → run queries → assert counts |
| API (contract) | All endpoints + error codes | `supertest` on `app.js` |
| E2E / Manual | Full flows: CRUD, attendance cycle, transfer, reports, export | Test checklist (below) |
| UI | Responsive, toasts, empty states | Browser dev tools + manual pass |

**Manual test checklist (included as a sample suite):**
1. Seed DB → dashboard shows 41 students, 40 active, today's counts, occupancy.
2. Add student → appears; duplicate register number → 409 toast.
3. Assign to full room → blocked with clear message.
4. Mark today's attendance → toast; re-open → statuses pre-filled ("saved").
5. Change one status → "Update attendance" persists via upsert.
6. History filters by date/room/status; edit a record.
7. Transfer student → strengths update in both rooms.
8. Reports daily/weekly/monthly; export CSV/Excel/PDF; print.
9. Archive an academic year → records still visible under year filter.
10. Resize to 375 px → sidebar drawer, scrolling tables, stacked cards.

## 17. Deployment Guide

### Local development (Windows)
1. Import `backend/database/hostel_attendance.sql` in MySQL Workbench (or `mysql -u root -p < ...`).
2. Backend: `cd backend` → `npm install` → edit `.env` (DB_PASSWORD) → `npm run dev`.
3. Frontend: `cd frontend` → `npm install` → `npm run dev` → open `http://localhost:5173`.
   Vite proxies `/api` to `http://localhost:5000`.

### Production-ish single server
- `npm run build` in frontend → serve `dist/` via Nginx/Express static.
- Run backend with `NODE_ENV=production`; set `PORT`, real `DB_*`, and `CORS_ORIGINS`.
- Recommended: PM2 (`pm2 start backend/server.js --name hostel-api`) + Nginx reverse proxy.

### Backups
- `mysqldump -u root -p hostel_attendance > backup.sql` (schedule daily). Attendance is never
  auto-deleted, so the dump is the source of truth for history.

## 18. Design Decisions (rationale)

1. **Service layer owns business rules** — controllers stay thin; rules are testable without HTTP.
2. **Repository layer owns SQL** — swapping MySQL is isolated; all queries parameterized.
3. **UNIQUE(student_id, date)** — DB enforces "once per day" even if two tabs are open.
4. **Bulk upsert (`ON DUPLICATE KEY`)** — marking the whole sheet is one query, not N.
5. **current_strength denormalized** — occupancy reads are instant; kept in sync by the
   service on every assignment/transfer/status change (plus `syncAllStrengths` safety net).
6. **Academic years never deleted** — attendance is historical; archive = `is_active=0`.
7. **Attendance linked to active year at marking time** — accurate per-year reporting.
8. **No auth** — explicit requirement (single warden, local machine). Security holes are
   accepted by design and documented; parameterized SQL still prevents injection.
9. **Client-side export** (CSV/Excel/PDF via SheetJS/jspdf) — no extra server endpoints;
   works offline once data is loaded.
10. **Error envelope** — consistent `{ success:false, message }` with MySQL-code mapping so
    the UI never shows raw stack traces (dev shows stack only).
