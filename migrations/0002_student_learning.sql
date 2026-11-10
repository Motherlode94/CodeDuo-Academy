-- Apply to the CodeDuo D1 development database first.
-- Existing users and sessions remain unchanged.
CREATE TABLE IF NOT EXISTS student_progress (
 user_id TEXT NOT NULL,
 track TEXT NOT NULL CHECK(track IN ('code', 'mao')),
 lesson_id INTEGER NOT NULL CHECK(lesson_id BETWEEN 1 AND 99),
 completed_at INTEGER NOT NULL,
 PRIMARY KEY(user_id, track, lesson_id),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_student_progress_user ON student_progress(user_id);
CREATE TABLE IF NOT EXISTS student_drafts (
 user_id TEXT NOT NULL,
 language TEXT NOT NULL CHECK(language IN ('javascript', 'html', 'csharp')),
 source TEXT NOT NULL,
 updated_at INTEGER NOT NULL,
 PRIMARY KEY(user_id, language),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
