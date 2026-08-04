CREATE TABLE IF NOT EXISTS lesson_practice_tasks (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    starter_code TEXT NOT NULL DEFAULT '',
    expected_output TEXT NOT NULL,
    order_num INTEGER NOT NULL CHECK (order_num > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lesson_practice_tasks_lesson_id_idx
ON lesson_practice_tasks(lesson_id);

CREATE UNIQUE INDEX IF NOT EXISTS lesson_practice_tasks_active_order_unique_idx
ON lesson_practice_tasks(lesson_id, order_num)
WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS lesson_practice_task_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id INTEGER NOT NULL REFERENCES lesson_practice_tasks(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, task_id)
);

CREATE INDEX IF NOT EXISTS lesson_practice_task_progress_user_id_idx
ON lesson_practice_task_progress(user_id);

CREATE INDEX IF NOT EXISTS lesson_practice_task_progress_task_id_idx
ON lesson_practice_task_progress(task_id);
