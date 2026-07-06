-- TeamDash Schema Migration
-- Paste this entire file into Supabase SQL Editor and run it.

-- Drop existing tables (if any) before recreating
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS project_assignments CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"          TEXT NOT NULL,
    "email"         TEXT NOT NULL UNIQUE,
    "passwordHash"  TEXT NOT NULL,
    "role"          TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE projects (
    "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "createdById" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE project_assignments (
    "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId"    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "projectId" UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE ("userId", "projectId")
);

CREATE TABLE reports (
    "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId"          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "projectId"       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    "weekStartDate"   DATE NOT NULL,
    "weekEndDate"     DATE NOT NULL,
    "tasksCompleted"  TEXT NOT NULL,
    "tasksPlanned"    TEXT NOT NULL,
    "blockers"        TEXT NOT NULL DEFAULT '',
    "hoursWorked"     REAL,
    "notes"           TEXT DEFAULT '',
    "status"          TEXT NOT NULL DEFAULT 'DRAFT',
    "submittedAt"     TIMESTAMPTZ,
    "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_userId ON reports("userId");
CREATE INDEX idx_reports_projectId ON reports("projectId");
CREATE INDEX idx_reports_status ON reports("status");
CREATE INDEX idx_reports_weekStartDate ON reports("weekStartDate");
CREATE INDEX idx_project_assignments_userId ON project_assignments("userId");
CREATE INDEX idx_project_assignments_projectId ON project_assignments("projectId");
