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
    description TEXT NOT NULL
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