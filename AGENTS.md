# AGENTS.md

## Project

This is an existing Go backend MVP for a programming courses platform.

The backend is already implemented and must not be rewritten.

## Backend stack

- Go
- Gin
- PostgreSQL
- pgxpool
- JWT
- bcrypt
- godotenv

## Frontend stack

Frontend will be created inside `frontend/` using:

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Zustand
- Axios
- shadcn/ui

## Main goal

Build a clean Ukrainian-language MVP frontend connected to the existing Go backend API.

## Critical rules

- Do not rewrite backend architecture.
- Do not change auth logic without explicit approval.
- Do not change JWT logic without explicit approval.
- Do not change middleware without explicit approval.
- Do not change database config without explicit approval.
- Do not change database schema without explicit approval.
- Do not run `database.sql` without explicit approval.
- Do not modify `database.sql` without a separate plan.
- Do not touch `.env` values or expose secrets.
- Do not create fake APIs if real backend endpoints exist.
- Do not use mock data when a real endpoint is available.
- Do not add admin role management endpoints.
- Do not connect `content/*.md` for now.
- Do not modify backend for CORS. The user handles CORS manually.
- Work in small phases.
- First analyze, then plan, then implement.

## Frontend role

When working on frontend tasks, act as an experienced frontend developer, UI/UX designer and product-minded engineer.

Your goal is not only to make the page technically work, but also to make it clear, clean, modern, responsive and pleasant to use.

## Design responsibility

For frontend tasks, always consider:

- visual hierarchy
- spacing and layout balance
- readable typography
- clean component structure
- mobile responsiveness
- hover/focus states
- loading states
- empty states
- error states
- accessibility basics
- Ukrainian user-facing text

## UI quality rules

- Do not create ugly placeholder UI.
- Do not create random layouts.
- Do not use lorem ipsum in final visible UI.
- Do not use mock data when real backend endpoints exist.
- Do not invent endpoints.
- Do not make static HTML pages.
- Build reusable React components.
- Use shadcn/ui components where appropriate.
- Use Tailwind CSS for layout and visual styling.
- Keep the interface minimal, calm and clean.
- Add subtle animations only where they improve UX.
- Avoid excessive animation, visual noise and heavy effects.

## Required frontend documents

Before implementing frontend, read:

- PROJECT_SPEC.md
- FRONTEND_PLAN.md
- UI_STYLE_GUIDE.md

For non-trivial frontend tasks, first create a plan and wait for confirmation.

## Technical frontend rules

### TypeScript API types

- Always check Go structs in internal/ before creating TypeScript interfaces.
- Keep shared API response/request types in frontend/src/types/api.ts.
- Do not invent frontend types if the backend structs already define the shape.
- If backend response shape is unclear, inspect handlers and repositories before implementing UI.

### API layer

- Use Axios for HTTP requests.
- Configure a single Axios client in frontend/src/services/apiClient.ts.
- Use baseURL from Vite env variable.
- Use Axios request interceptors to attach JWT token:
  Authorization: Bearer <token>.
- Do not write raw fetch calls inside React components.
- Keep API calls in a dedicated frontend/src/services/ layer.

Suggested service files:

- frontend/src/services/authService.ts
- frontend/src/services/courseService.ts
- frontend/src/services/lessonService.ts
- frontend/src/services/profileService.ts

### Zustand state management

- Use Zustand for global auth state.
- Store authentication state and user profile in Zustand, not in local component state.
- Keep local UI-only state inside components.
- Do not put every API response into Zustand by default.
- Use Zustand mainly for:
  - JWT token
  - current user/profile
  - auth status
  - lesson progress if shared across pages

Suggested store files:

- frontend/src/store/authStore.ts
- frontend/src/store/progressStore.ts if needed

### Error handling

- Map backend HTTP errors to user-friendly Ukrainian messages.
- Do not show broken backend encoding messages directly.
- Handle at least:
  - 400: Некоректні дані
  - 401: Увійдіть в акаунт
  - 403: Немає доступу
  - 404: Не знайдено
  - 409: Конфлікт даних
  - 500: Помилка сервера
- Use toast notifications for important API errors.
- Prefer sonner or shadcn-compatible toast if toast UI is needed.

### Folder structure

Use a clean frontend structure:

```text
frontend/src/
├─ components/
├─ hooks/
├─ pages/
├─ services/
├─ store/
├─ types/
├─ lib/
└─ app/
```

### Imports

- Prefer absolute imports like `@/components/...` if alias is configured.
- If using `@/...`, configure it correctly in:
  - `vite.config.ts`
  - `tsconfig.json`
- Do not use absolute imports unless the alias actually works.

## Existing backend API

Public:

- POST /auth/register
- POST /auth/login
- GET /api/courses
- GET /api/courses/:id
- GET /api/courses/:id/syllabus

Auth:

- GET /api/profile
- PUT /api/profile
- GET /api/lessons/:id
- POST /api/courses/:id/enroll
- GET /api/profile/courses
- POST /api/lessons/:id/complete
- GET /api/courses/:id/progress

Admin:

- POST /api/admin/courses
- POST /api/admin/courses/:id/modules
- POST /api/admin/modules/:id/lessons

## Frontend MVP scope

Implement only the user-facing MVP:

- home / courses list
- registration
- login
- profile
- my courses
- course page
- lesson page
- left sidebar with modules and lessons
- completed lesson states
- progress percentage
- progress bar
- mark lesson complete/incomplete
- enroll in course

Admin UI is not part of the first phase.

## Dangerous files and areas

Do not modify without explicit approval:

- `database.sql`
- `.env`
- `internal/db/db.go`
- `internal/middlewear/auth.go`
- `internal/utils/jwt.go`
- `internal/handlers/*`
- `internal/*Core/*`
- `cmd/api/main.go`
