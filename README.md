# TeamDash - Weekly Report Generator & Dashboard

A full-stack team management application for generating weekly reports and tracking team performance.

## Tech Stack

- **Backend**: Express 4 + TypeScript + Supabase (PostgreSQL) + Zod
- **Frontend**: Next.js 14 + React 18 + Tailwind CSS + shadcn/ui + Recharts
- **AI**: Anthropic Claude integration for report analysis
- **Auth**: JWT with httpOnly cookies, bcrypt, RBAC (MEMBER/MANAGER)
- **Database**: PostgreSQL via Supabase (service_role key for server-side access)

## Features

- Weekly report creation, editing, submission, and tracking
- Role-based access control (Members submit reports, Managers view dashboards)
- Dashboard with charts (report trends, submission status, workload distribution)
- AI-powered assistant for report and blocker analysis
- Project management with member assignments
- Filterable team reports view
- Pagination on report listing endpoints

## ER Diagram

[View ER Diagram on dbdiagram.io](https://dbdiagram.io/d/teamdash-schema) <!-- Replace with your actual dbdiagram link -->

### Entities

- **User** — id, name, email (unique), passwordHash, role (MEMBER/MANAGER), createdAt, updatedAt
- **Project** — id, name, description, createdById (FK→User), createdAt, updatedAt
- **ProjectAssignment** — id, userId (FK→User), projectId (FK→Project), createdAt. Unique(userId, projectId)
- **Report** — id, userId (FK→User), projectId (FK→Project), weekStartDate, weekEndDate, tasksCompleted, tasksPlanned, blockers, hoursWorked, notes, status (DRAFT/SUBMITTED/LATE), submittedAt, createdAt, updatedAt

## Project Structure

```
Github/
├── backend/
│   ├── src/
│   │   ├── config/        # env, prisma-like supabase adapter, seed script
│   │   ├── middleware/     # auth (JWT), role (RBAC), validation (Zod)
│   │   └── modules/
│   │       ├── auth/       # register, login, logout, me
│   │       ├── reports/    # CRUD, submit, filter, pagination
│   │       ├── projects/   # CRUD, member assignment
│   │       ├── dashboard/  # aggregation endpoints (summary, trends, workload, etc.)
│   │       └── ai/         # Claude integration (Q&A + summary)
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
- Anthropic API key (optional, for AI features)

### Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Open and paste the contents of `backend/migrations/001_initial_schema.sql`
4. Click **Run** to create the tables

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
| `ANTHROPIC_API_KEY` | Claude API key (optional) | No |

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
| POST | `/reports` | Member | Create report |
| PUT | `/reports/:id` | Member (own) | Edit draft report |
| POST | `/reports/:id/submit` | Member (own) | Submit report |
| GET | `/reports` | Manager | All reports (filterable + paginated) |
| GET | `/reports/status` | Manager | Submission compliance |
| GET | `/reports/:id` | Authenticated | Single report detail |
| GET | `/projects` | Authenticated | List projects |
| POST | `/projects` | Manager | Create project |
| PUT | `/projects/:id` | Manager | Update project |
| DELETE | `/projects/:id` | Manager | Delete project |
| GET | `/dashboard/summary` | Manager | KPI summary |
| GET | `/dashboard/trends` | Manager | Weekly trend data |
| GET | `/dashboard/workload` | Manager | Workload distribution |
| GET | `/dashboard/member-status` | Manager | Per-member stats |
| GET | `/dashboard/recent-activity` | Manager | Recent submissions |
| POST | `/ai/ask` | Manager | Natural-language Q&A |
| GET | `/ai/summary` | Manager | AI team summary |
