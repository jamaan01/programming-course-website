CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE, 
    section_name VARCHAR(255) DEFAULT 'Основи', 
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    homework TEXT,
    order_num INTEGER
);


INSERT INTO lessons (course_id, section_name, title, content, homework, order_num) 
VALUES 
(1, 'Основи', 'Урок 1: Що таке програмування', 'Текст першого уроку...', 'Завдання 1', 1),
(1, 'Основи', 'Урок 2: Перша програма', 'Текст другого уроку...', 'Завдання 2', 2),
(1, 'Типи даних', 'Урок 3: Числа та рядки', 'Текст третього уроку...', 'Завдання 3', 3);


CREATE TABLE modules (
    id SERIAL PRIMARY KEY,
    course_id INT REFERENCES courses(id) ON DELETE CASCADE, 
    title VARCHAR(255) NOT NULL,
    order_num INT 
);

CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    module_id INT REFERENCES modules(id) ON DELETE CASCADE, 
    title VARCHAR(255) NOT NULL,
    content TEXT, 
    video_url VARCHAR(255), 
    order_num INT 
);


INSERT INTO modules (course_id, title, order_num) VALUES 
(1, 'Модуль 1: Основи мови Go', 1),
(1, 'Модуль 2: Робота з базами даних', 2);


INSERT INTO lessons (module_id, title, content, order_num) VALUES 
(1, 'Що таке Go і чому він такий крутий?', 'Текст про історію Go та його переваги...', 1),
(1, 'Змінні та типи даних', 'Текст про var, int, string, bool...', 2);

CREATE TABLE enrollments (
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, course_id)
);

CREATE TABLE lesson_progress (
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id INT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false, 
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    
    PRIMARY KEY (user_id, lesson_id)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS lesson_questions (
    id SERIAL PRIMARY KEY,
    lesson_id INT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    order_num INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lesson_question_options (
    id SERIAL PRIMARY KEY,
    question_id INT NOT NULL REFERENCES lesson_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    order_num INT NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS one_correct_option_per_question
ON lesson_question_options(question_id)
WHERE is_correct = true;

