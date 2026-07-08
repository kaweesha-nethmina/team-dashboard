# TeamDash - Weekly Report Generator & Dashboard

A full-stack team management application for generating weekly reports and tracking team performance.

## Tech Stack

- **Backend**: Express 4 + TypeScript + Supabase (PostgreSQL) + Zod
- **Frontend**: Next.js 14 + React 18 + Tailwind CSS + shadcn/ui + Recharts
- **AI**: Google Gemini 2.0 Flash integration for report analysis (with local fallback)
- **Auth**: JWT with httpOnly cookies, bcrypt, RBAC (MEMBER/MANAGER)
- **Database**: PostgreSQL via Supabase (service_role key for server-side access)

## Features

- Weekly report creation, editing, submission, and tracking
- One report per member per week enforced (unique + UI guard)
- Role-based access control (Members submit reports, Managers view dashboards)
- Dashboard with charts (report trends, submission status, workload distribution)
- AI-powered assistant for report, blocker, and project analysis
- Project-aware AI chat with clickable project selection buttons
- Project management with member assignments
- Filterable team reports view
- Pagination on report listing endpoints

## ER Diagram

[View ER Diagram](https://drive.google.com/file/d/1IF83plx3xEehKYhQqWID2FH3OOF0GFyB/view?usp=sharing) 

### Entities

- **User** — id, name, email (unique), passwordHash, role (MEMBER/MANAGER), createdAt, updatedAt
- **Project** — id, name, description, createdById (FK→User), createdAt, updatedAt
- **ProjectAssignment** — id, userId (FK→User), projectId (FK→Project), createdAt. Unique(userId, projectId)
- **Report** — id, userId (FK→User), projectId (FK→Project), weekStartDate, weekEndDate, tasksCompleted, tasksPlanned, blockers, hoursWorked, notes, status (DRAFT/SUBMITTED/LATE), submittedAt, createdAt, updatedAt

## Project Structure

```
TeamDash/
├── backend/
│   ├── src/
│   │   ├── config/        # env, prisma-like supabase adapter, seed script
│   │   ├── middleware/     # auth (JWT), role (RBAC), validation (Zod)
│   │   └── modules/
│   │       ├── auth/       # register, login, logout, me
│   │       ├── reports/    # CRUD, submit, filter, pagination
│   │       ├── projects/   # CRUD, member assignment
│   │       ├── dashboard/  # aggregation endpoints (summary, trends, workload, etc.)
│   │       └── ai/         # Gemini integration (Q&A + summary with project-aware chat)
│   ├── migrations/         # SQL migration (run in Supabase SQL Editor)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router pages
│   │   ├── components/     # UI + feature components
│   │   ├── hooks/          # useAuth context
│   │   ├── lib/            # API client, utils
│   │   └── types/          # TypeScript interfaces
│   └── package.json
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase project (free tier)
- Google Gemini API key (optional, for AI features, get one at https://aistudio.google.com/apikey)

### Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Open and paste `backend/migrations/001_initial_schema.sql`, then click **Run**
4. Open and paste `backend/migrations/002_weekly_report_unique.sql`, then click **Run**

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase URL and service_role key (find these in Supabase Dashboard → Settings → API)
npm install
npm run seed
npm run dev
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Docker Setup

Pull and run with Docker:

```bash
# Create a backend .env file
cp backend/.env.example .env
# Edit .env with your Supabase credentials

# Run both services
docker compose up

# Or pull individual images
docker pull kaweesha/backend
docker pull kaweesha/frontend

# Run with custom env
docker run -p 4000:4000 --env-file backend/.env kaweesha/backend
docker run -p 3000:3000 kaweesha/frontend
```

> Frontend connects to backend at `http://localhost:4000` by default. Override with `NEXT_PUBLIC_API_URL` build arg if deploying elsewhere.

### Environment Variables

**Backend** (`backend/.env`):

| Variable | Description | Required |
|---|---|---|
| `PORT` | Server port | No (default: 4000) |
| `SUPABASE_URL` | Supabase project URL | **Yes** |
| `SUPABASE_SECRET_KEY` | Supabase service_role key | **Yes** |
| `JWT_SECRET` | JWT signing secret | **Yes** |
| `JWT_EXPIRES_IN` | Token expiration | No (default: 7d) |
| `FRONTEND_URL` | Frontend origin for CORS | No (default: http://localhost:3000) |
| `GEMINI_API_KEY` | Google Gemini API key (optional — local fallback if missing) | No |

**Frontend** (`frontend/.env.local`):

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:4000` |

### Default Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Manager | manager@teamdash.com | password123 |
| Member | member@teamdash.com | password123 |
| Member | carol@teamdash.com | password123 |
| Member | dave@teamdash.com | password123 |

### Available Scripts

#### Backend

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Start production server |
| `npm run seed` | Seed database with sample data |

#### Frontend

| Script | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## API Overview

All endpoints are prefixed with `/auth`, `/reports`, `/projects`, `/dashboard`, or `/ai`.

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Create account |
| POST | `/auth/login` | Public | Login, receive JWT |
| POST | `/auth/logout` | Authenticated | Clear session |
| GET | `/auth/me` | Authenticated | Current user profile |
| GET | `/reports/me` | Member | Own report history |
| POST | `/reports` | Member | Create report (one per week enforced) |
| PUT | `/reports/:id` | Member (own) | Edit draft report |
| POST | `/reports/:id/submit` | Member (own) | Submit report |
| GET | `/reports` | Manager | All reports (filterable + paginated) |
| GET | `/reports/status` | Manager | Current week submission compliance |
| GET | `/reports/:id` | Authenticated | Single report detail |
| GET | `/projects` | Authenticated | List projects (week-based report counts) |
| POST | `/projects` | Manager | Create project |
| PUT | `/projects/:id` | Manager | Update project |
| DELETE | `/projects/:id` | Manager | Delete project |
| GET | `/dashboard/summary` | Manager | Current week KPI summary |
| GET | `/dashboard/trends` | Manager | Weekly trend data (all weeks) |
| GET | `/dashboard/workload` | Manager | Current week workload distribution |
| GET | `/dashboard/member-status` | Manager | Current week per-member stats |
| GET | `/dashboard/recent-activity` | Manager | Recent submissions |
| POST | `/ai/ask` | Manager | AI Q&A (body: `{ question, projectId? }`) |
| GET | `/ai/summary` | Manager | AI team summary |

### AI Ask Flow

When you call `POST /ai/ask`:
- If `projectId` is omitted and the question is project-related, the API returns `requiresProjectSelection: true` with a list of projects.
- Pass the selected `projectId` to get a project-scoped answer.
- If Gemini quota is exceeded, the API falls back to a local data summary (keyword-matched stats).


# Tests
Tests (48 passing)
- Auth tests (10) — register, login, getMe, getMembers with validation errors
- Reports tests (17) — CRUD, submit, filter, pagination, ownership checks, submission status, duplicate week guard
- Projects tests (13) — CRUD, assign by email, duplicate assignment guard, member listing
- Dashboard tests (8) — summary (week-filtered), trends, workload (week-filtered), member status (week-filtered), recent activity, tasks by project