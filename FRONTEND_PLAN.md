# FRONTEND_PLAN.md

## Purpose

This file describes the implementation plan for the frontend MVP.

Frontend must be created inside:

`frontend/`

Backend already exists and must remain the source of truth.

Frontend stack:

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Zustand
- Axios
- shadcn/ui

Admin UI is not part of the first MVP phase.

---

## Core rules

Before implementation:

- read `AGENTS.md`;
- read `PROJECT_SPEC.md`;
- read `UI_STYLE_GUIDE.md`;
- do not rewrite backend;
- do not modify auth/JWT/middleware;
- do not modify database config or schema;
- do not run or edit `database.sql`;
- do not touch `.env`;
- do not change CORS;
- do not invent fake endpoints;
- do not use mock data when a real endpoint exists.

---

## Phase 1 — Create frontend app

Create a new Vite React TypeScript app inside:

`frontend/`

Expected setup:

- Vite React TypeScript
- React Router
- Zustand
- Axios
- Tailwind CSS
- shadcn/ui

Expected result:

- `frontend/` exists;
- app starts with `npm run dev`;
- backend files are untouched.

---

## Phase 2 — Configure UI foundation

Configure:

- Tailwind CSS
- shadcn/ui
- base global styles
- optional `@/` alias if configured correctly in Vite and TypeScript

Add only needed shadcn/ui components.

Recommended initial components:

- Button
- Input
- Label
- Card
- Badge
- Progress
- Separator
- Skeleton
- Sonner or toast if needed

Do not install all components at once.

---

## Phase 3 — Create frontend structure

Use this structure:

- `frontend/src/app/`
- `frontend/src/components/`
- `frontend/src/hooks/`
- `frontend/src/pages/`
- `frontend/src/services/`
- `frontend/src/store/`
- `frontend/src/types/`
- `frontend/src/lib/`

Purpose:

- `app/` — routes and providers
- `components/` — reusable UI
- `pages/` — route pages
- `services/` — API layer
- `store/` — Zustand stores
- `types/` — TypeScript API types
- `lib/` — helpers

---

## Phase 4 — Create API types and services

Create:

- `frontend/src/types/api.ts`
- `frontend/src/services/apiClient.ts`
- `frontend/src/services/authService.ts`
- `frontend/src/services/courseService.ts`
- `frontend/src/services/lessonService.ts`
- `frontend/src/services/profileService.ts`

Rules:

- check Go structs and handlers before creating TypeScript types;
- use Axios;
- use base URL from Vite env variable;
- attach JWT with Axios interceptor;
- do not use raw `fetch` inside React components.

Suggested env variable:

`VITE_API_BASE_URL=http://localhost:8080`

Services must cover:

- auth register/login;
- courses;
- syllabus;
- profile;
- enroll;
- lessons;
- lesson completion;
- course progress.

Admin endpoints are not used in first MVP.

---

## Phase 5 — Create Zustand stores

Create:

- `frontend/src/store/authStore.ts`

Auth store should manage:

- JWT token;
- auth status;
- current user/profile;
- login;
- register;
- logout;
- load profile;
- clearing auth state on 401.

Auth store should include an `init` or `checkAuth` method.

On app start:

- check token in `localStorage`;
- if token exists, call `GET /api/profile`;
- if token is valid, restore user/profile in Zustand;
- if token is invalid or expired, remove token and clear auth state;
- if no token exists, keep user unauthenticated.

Frontend logout should:

- remove JWT from storage;
- clear Zustand auth state;
- redirect user to login or home.

Do not invent backend logout endpoint.

Optional:

- `frontend/src/store/progressStore.ts`

Use progress store only if progress state is shared between course page and lesson page.

Do not put every API response into Zustand.

Use local component state for:

- form fields;
- local loading states;
- modal/sidebar open states;
- page-only data.

---

## Phase 6 — Create routing and layout

Use React Router.

Required routes:

- `/` — courses/home page
- `/login` — login page
- `/register` — register page
- `/profile` — profile page
- `/courses/:id` — course page
- `/courses/:courseId/lessons/:lessonId` — lesson page with course context

Do not use `/lessons/:id` as the main frontend route.

Reason:

The backend endpoint stays `GET /api/lessons/:id`, but the browser route should include both `courseId` and `lessonId`.

This allows the frontend, even after page reload, to read both IDs from the URL and load:

- `GET /api/lessons/:lessonId` for lesson content;
- `GET /api/courses/:courseId/syllabus` for lesson sidebar;
- `GET /api/courses/:courseId/progress` for progress state.

Do not change backend endpoints for this.

Create layout components:

- AppLayout
- Header
- PageContainer
- ProtectedRoute
- LoadingState
- ErrorState
- EmptyState

Guests can access:

- home
- courses list
- course page
- login
- register

Authenticated users can access:

- profile
- enrolled courses
- lesson page
- progress

Protected routes should redirect unauthenticated users to login.

Header behavior:

For guests:

- Courses
- Login
- Register

For authenticated users:

- Courses
- Profile / My Courses
- Logout

---

## Phase 7 — Build auth pages

Create:

- Login page
- Register page

Requirements:

- Ukrainian UI text;
- clean centered card;
- required field validation;
- loading state;
- error state;
- save JWT after success;
- redirect after success;
- link between login/register.

API:

- `POST /auth/login`
- `POST /auth/register`

---

## Phase 8 — Build courses and course page

Create:

- Home / courses page
- Course detail page

Home uses:

- `GET /api/courses`

Course page uses:

- `GET /api/courses/:id`
- `GET /api/courses/:id/syllabus`
- `GET /api/courses/:id/progress` for authenticated users
- `POST /api/courses/:id/enroll`

Requirements:

- course cards;
- course title and description;
- modules and lessons;
- enroll button;
- guest state;
- not-enrolled state;
- completed lesson checkmarks;
- progress percentage;
- progress bar;
- loading, empty and error states.

---

## Phase 9 — Build lesson page

Create focused lesson page.

Frontend route:

- `/courses/:courseId/lessons/:lessonId`

Backend API used by this page:

- `GET /api/lessons/:lessonId`
- `POST /api/lessons/:lessonId/complete`
- `GET /api/courses/:courseId/syllabus`
- `GET /api/courses/:courseId/progress`

The Go backend endpoints must not be changed.

Page loading logic:

- read `courseId` and `lessonId` from React Router params;
- load lesson content using `GET /api/lessons/:lessonId`;
- load syllabus using `GET /api/courses/:courseId/syllabus`;
- load progress using `GET /api/courses/:courseId/progress`;
- use syllabus for sidebar and previous/next lesson navigation;
- use progress for checkmarks, percentage and progress bar.

Requirements:

- left sidebar with modules and lessons;
- active lesson highlight;
- completed lesson checkmarks;
- lesson title;
- lesson content;
- complete/incomplete button;
- progress percentage;
- progress bar;
- previous lesson button;
- next lesson button;
- loading state;
- 403 no access state;
- 404 not found state.

Previous/next lesson navigation:

- flatten lessons from syllabus into one ordered list;
- find current `lessonId`;
- calculate previous and next lesson IDs;
- previous button navigates to `/courses/:courseId/lessons/:previousLessonId`;
- next button navigates to `/courses/:courseId/lessons/:nextLessonId`;
- disable previous button if current lesson is first;
- disable next button if current lesson is last.

Complete/incomplete behavior:

- call `POST /api/lessons/:lessonId/complete`;
- update completed lesson checkmark;
- update progress percentage;
- update progress bar;
- do not reload the whole app if local state can be updated safely.

This is the most important MVP page.

It should feel like a focused learning workspace.

---

## Phase 10 — Build profile page

Create profile page.

Uses:

- `GET /api/profile`
- `PUT /api/profile`
- `GET /api/profile/courses`

Requirements:

- user name;
- user email;
- edit profile form;
- enrolled courses;
- continue learning links;
- loading state;
- empty state;
- error state.

---

## Phase 11 — Progress and errors

Progress source:

- `GET /api/courses/:courseId/progress`

Backend returns:

- `completed_lesson_ids`

Frontend calculates:

`completed_lesson_ids.length / totalLessons.length * 100`

Progress must update after:

- `POST /api/lessons/:lessonId/complete`

Progress UI:

- checkmarks;
- percentage;
- progress bar.

Error messages must be Ukrainian:

- 400 — Некоректні дані
- 401 — Увійдіть в акаунт
- 403 — Немає доступу
- 404 — Не знайдено
- 409 — Конфлікт даних
- 500 — Помилка сервера

Do not show broken backend messages directly.

Use toast notifications for important API errors.

---

## Phase 12 — UI polish and final review

Follow `UI_STYLE_GUIDE.md`.

Check:

- spacing;
- typography;
- hover/focus states;
- mobile layout;
- course cards;
- auth forms;
- lesson sidebar;
- progress bar;
- loading states;
- empty states;
- error states;
- Ukrainian text.

Final MVP is ready when:

- frontend starts from `frontend/`;
- courses load from real backend;
- registration works;
- login works;
- JWT attaches to protected requests;
- profile loads;
- course page loads;
- enroll works;
- lesson page works for enrolled users;
- complete/incomplete works;
- progress checkmarks update;
- progress percentage updates;
- progress bar updates;
- UI is responsive;
- backend dangerous files are untouched;
- no fake endpoints were invented;
- no mock data is used where real endpoint exists.
