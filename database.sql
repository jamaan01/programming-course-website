CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS modules (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    order_num INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    order_num INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS enrollments (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS lesson_progress (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS lesson_questions (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    order_num INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lesson_question_options (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES lesson_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    order_num INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lesson_question_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES lesson_questions(id) ON DELETE CASCADE,
    selected_option_id INTEGER NOT NULL REFERENCES lesson_question_options(id) ON DELETE CASCADE,
    is_correct BOOLEAN NOT NULL,
    answered_at TIMESTAMP NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'modules_course_order_unique'
    ) THEN
        ALTER TABLE modules
        ADD CONSTRAINT modules_course_order_unique UNIQUE (course_id, order_num);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lessons_module_order_unique'
    ) THEN
        ALTER TABLE lessons
        ADD CONSTRAINT lessons_module_order_unique UNIQUE (module_id, order_num);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lesson_questions_lesson_order_unique'
    ) THEN
        ALTER TABLE lesson_questions
        ADD CONSTRAINT lesson_questions_lesson_order_unique UNIQUE (lesson_id, order_num);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lesson_question_options_question_order_unique'
    ) THEN
        ALTER TABLE lesson_question_options
        ADD CONSTRAINT lesson_question_options_question_order_unique UNIQUE (question_id, order_num);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lesson_question_attempts_user_question_unique'
    ) THEN
        ALTER TABLE lesson_question_attempts
        ADD CONSTRAINT lesson_question_attempts_user_question_unique UNIQUE (user_id, question_id);
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS one_correct_option_per_question
ON lesson_question_options(question_id)
WHERE is_correct = true;

CREATE INDEX IF NOT EXISTS modules_course_id_idx
ON modules(course_id);

CREATE INDEX IF NOT EXISTS lessons_module_id_idx
ON lessons(module_id);

CREATE INDEX IF NOT EXISTS enrollments_course_id_idx
ON enrollments(course_id);

CREATE INDEX IF NOT EXISTS lesson_progress_lesson_id_idx
ON lesson_progress(lesson_id);

CREATE INDEX IF NOT EXISTS lesson_questions_lesson_id_idx
ON lesson_questions(lesson_id);

CREATE INDEX IF NOT EXISTS lesson_question_options_question_id_idx
ON lesson_question_options(question_id);

CREATE INDEX IF NOT EXISTS lesson_question_attempts_question_id_idx
ON lesson_question_attempts(question_id);

CREATE INDEX IF NOT EXISTS lesson_question_attempts_selected_option_id_idx
ON lesson_question_attempts(selected_option_id);
