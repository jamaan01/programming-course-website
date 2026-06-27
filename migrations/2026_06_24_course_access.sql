CREATE TABLE IF NOT EXISTS course_access (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    granted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    granted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMP NULL,
    UNIQUE(user_id, course_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS course_access_user_course_unique_idx
ON course_access(user_id, course_id);

CREATE INDEX IF NOT EXISTS course_access_user_id_idx
ON course_access(user_id);

CREATE INDEX IF NOT EXISTS course_access_course_id_idx
ON course_access(course_id);

CREATE INDEX IF NOT EXISTS course_access_active_idx
ON course_access(user_id, course_id)
WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS course_access_is_active_idx
ON course_access(is_active);
