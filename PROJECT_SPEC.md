# PROJECT_SPEC.md

## Product

Programming courses platform MVP.

The project already has a Go backend. The goal is to build a clean Ukrainian-language frontend for users.

## Main Goal

Users should be able to:

- register;
- log in;
- browse courses;
- open course pages;
- enroll in courses;
- view course syllabus;
- open lessons;
- mark lessons complete/incomplete;
- see course progress;
- view and edit profile;
- view enrolled courses.

Admin UI is not part of the first MVP phase.

## Frontend Stack

Frontend is created inside `frontend/`.

Use:

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Zustand
- Axios
- shadcn/ui

## Backend Rules

The Go backend is the source of truth.

Do not:

- rewrite backend;
- invent fake endpoints;
- modify auth/JWT/middleware;
- modify backend handlers;
- modify backend models/entities;
- modify database config;
- modify database schema;
- modify `.env`;
- modify `database.sql`;
- modify CORS;
- connect `content/*.md`;
- create admin role management.

## Language

All user-facing frontend text must be Ukrainian.

Examples:

- Увійти
- Зареєструватися
- Мої курси
- Переглянути курс
- Записатися на курс
- Почати навчання
- Продовжити навчання
- Позначити як пройдений
- Позначити як непройдений
- Прогрес курсу
- Немає доступу

## API Reference

### Public

| Method | Endpoint                          | Frontend usage              |
| ------ | --------------------------------- | --------------------------- |
| POST   | `/auth/register`                  | register page               |
| POST   | `/auth/login`                     | login page                  |
| GET    | `/api/courses`                    | courses list                |
| GET    | `/api/courses/:courseId`          | course page                 |
| GET    | `/api/courses/:courseId/syllabus` | course page, lesson sidebar |

### Auth Required

| Method | Endpoint                          | Frontend usage                  |
| ------ | --------------------------------- | ------------------------------- |
| GET    | `/api/profile`                    | profile, auth state             |
| PUT    | `/api/profile`                    | edit profile                    |
| POST   | `/api/courses/:courseId/enroll`   | enroll button                   |
| GET    | `/api/profile/courses`            | my courses                      |
| GET    | `/api/lessons/:lessonId`          | lesson page                     |
| POST   | `/api/lessons/:lessonId/complete` | mark lesson complete/incomplete |
| GET    | `/api/courses/:courseId/progress` | progress bar, checkmarks        |

### Admin Existing, But Not Used In First MVP

| Method | Endpoint                         |
| ------ | -------------------------------- |
| POST   | `/api/admin/courses`             |
| POST   | `/api/admin/courses/:id/modules` |
| POST   | `/api/admin/modules/:id/lessons` |

Admin UI is not implemented in the first phase.

## API Data Notes

### Auth

`POST /auth/register` accepts:

- name
- email
- password

Returns user data and JWT.

`POST /auth/login` accepts:

- email
- password

Returns JWT.

Frontend must save JWT and attach it to protected requests as:

`Authorization: Bearer <token>`

### Courses

Courses contain:

- id
- title
- description

Syllabus contains:

- course data
- modules
- lessons without full lesson content

Full lesson content comes only from:

`GET /api/lessons/:lessonId`

### Progress

Backend returns:

- `completed_lesson_ids`

Frontend calculates progress:

`completed_lesson_ids.length / totalLessons.length * 100`

If there are no lessons, progress is `0%`.

Progress must be shown as:

- checkmarks near completed lessons;
- percentage;
- progress bar.

## Pages

### Home / Courses Page

Route:

`/`

Uses:

- `GET /api/courses`

Needs:

- header;
- course list/grid;
- course cards;
- login/register links for guests;
- profile/my courses link for authenticated users;
- loading state;
- empty state;
- error state.

### Register Page

Route:

`/register`

Uses:

- `POST /auth/register`

Needs:

- name input;
- email input;
- password input;
- Ukrainian validation/errors;
- save JWT after success;
- redirect after success;
- link to login.

### Login Page

Route:

`/login`

Uses:

- `POST /auth/login`

Needs:

- email input;
- password input;
- Ukrainian validation/errors;
- save JWT after success;
- redirect after success;
- link to register.

### Course Page

Route:

`/courses/:courseId`

Uses:

- `GET /api/courses/:courseId`
- `GET /api/courses/:courseId/syllabus`
- `GET /api/courses/:courseId/progress` if authenticated
- `POST /api/courses/:courseId/enroll`

Needs:

- course title;
- course description;
- modules;
- lessons;
- enroll button;
- completed lesson marks;
- progress percentage;
- progress bar.

Guests can view course and syllabus.

Authenticated users can enroll and see progress.

### Lesson Page

Route:

`/courses/:courseId/lessons/:lessonId`

Uses:

- `GET /api/lessons/:lessonId`
- `POST /api/lessons/:lessonId/complete`
- `GET /api/courses/:courseId/syllabus`
- `GET /api/courses/:courseId/progress`

Important:

The frontend route includes both `courseId` and `lessonId`, but backend endpoints do not change.

Frontend reads `courseId` and `lessonId` from React Router params.

Then frontend loads:

- lesson content from `GET /api/lessons/:lessonId`;
- sidebar data from `GET /api/courses/:courseId/syllabus`;
- progress data from `GET /api/courses/:courseId/progress`.

Needs:

- left sidebar with modules and lessons;
- active lesson highlight;
- completed lesson checkmarks;
- lesson title;
- lesson content;
- progress bar;
- progress percentage;
- previous lesson button;
- next lesson button;
- complete/incomplete button;
- 403 no access state;
- loading/error states.

This is the most important MVP page.

### Profile Page

Route:

`/profile`

Uses:

- `GET /api/profile`
- `PUT /api/profile`
- `GET /api/profile/courses`

Needs:

- user name;
- user email;
- edit profile form;
- enrolled courses;
- continue learning links.

## Auth Behavior

Frontend logout is local only:

- remove JWT;
- clear Zustand auth state;
- redirect user.

There is no backend logout endpoint. Do not invent it.

Protected pages must redirect unauthenticated users to login.

## Error Handling

Do not show broken backend encoding messages directly.

Map errors to Ukrainian messages:

- 400 — Некоректні дані
- 401 — Увійдіть в акаунт
- 403 — Немає доступу
- 404 — Не знайдено
- 409 — Конфлікт даних
- 500 — Помилка сервера

Use toast notifications for important API errors.

## First MVP Non-goals

Do not implement:

- admin UI;
- admin role management;
- payments;
- certificates;
- comments;
- ratings;
- refresh token;
- forgot password;
- markdown content integration;
- backend rewrite;
- database changes;
- CORS changes.

## Success Criteria

The first MVP is ready when:

- frontend starts from `frontend/`;
- courses load from real backend;
- registration works;
- login works;
- JWT is attached to protected requests;
- profile loads;
- course page loads;
- enroll works;
- lesson page loads for enrolled users;
- lesson complete/incomplete works;
- progress checkmarks update;
- progress percentage updates;
- progress bar updates;
- UI is Ukrainian;
- UI is responsive;
- backend dangerous files are untouched.
