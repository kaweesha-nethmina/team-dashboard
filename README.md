# TeamDash - Weekly Report Generator & Dashboard

A full-stack team management application for generating weekly reports and tracking team performance.

## Tech Stack

- **Backend**: Express 4 + TypeScript + Prisma 5 + PostgreSQL
- **Frontend**: Next.js 14 + React 18 + Tailwind CSS + shadcn/ui + Recharts
- **AI**: Anthropic Claude integration for report analysis
- **Auth**: JWT with httpOnly cookies, bcrypt, RBAC (MEMBER/MANAGER)

## Features

- Weekly report creation, submission, and tracking
- Role-based access control (Members submit reports, Managers view dashboards)
- Dashboard with charts (report trends, submission status, workload distribution)
- AI-powered assistant for report and blocker analysis
- Project management with member assignments
- Filterable team reports view

## Project Structure

```
Github/
├── backend/
│   ├── src/
│   │   ├── config/        # env, prisma client
│   │   ├── middleware/     # auth, role, validation
│   │   └── modules/
│   │       ├── auth/       # register, login, logout, me
│   │       ├── reports/    # CRUD, submit, filter
│   │       ├── projects/   # CRUD, member assignment
│   │       ├── dashboard/  # aggregation endpoints
│   │       └── ai/         # Claude integration
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js pages
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
- PostgreSQL
- Anthropic API key (optional, for AI features)

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your database URL and secrets
npm install
npx prisma migrate dev --name init
npm run db:seed
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

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `4000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/team_dash` |
| `JWT_SECRET` | JWT signing secret | (required) |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:3000` |
| `ANTHROPIC_API_KEY` | Claude API key (optional) | |

**Frontend** (`frontend/.env.local`):

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:4000` |

### Available Scripts

#### Backend

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Start production server |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset database |

#### Frontend

| Script | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
