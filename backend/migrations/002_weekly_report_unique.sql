-- Enforce one report per user per week
ALTER TABLE reports ADD CONSTRAINT reports_userId_weekStartDate_key UNIQUE ("userId", "weekStartDate");
