-- Apply to a test D1 database before production. Requires users table.
CREATE TABLE IF NOT EXISTS student_projects (
 user_id TEXT NOT NULL,
 project_id TEXT NOT NULL CHECK(length(project_id) BETWEEN 1 AND 40),
 html TEXT NOT NULL,
 css TEXT NOT NULL,
 javascript TEXT NOT NULL,
 updated_at INTEGER NOT NULL,
 PRIMARY KEY(user_id, project_id),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_student_projects_user_updated ON student_projects(user_id,updated_at DESC);
