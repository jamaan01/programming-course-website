# GoLab / Course Platform MVP

GoLab is a Go backend plus React frontend educational platform MVP.
It supports courses, lessons, enrollment, progress tracking, admin content management, publishing, and lesson quizzes.

## Tech Stack

- Go
- PostgreSQL
- React
- Vite
- TypeScript
- Tailwind CSS
- Zustand
- Axios
- shadcn/ui

## Requirements

- Go 1.25.0, from `go.mod`
- Node.js 20 recommended
- PostgreSQL

## Backend Setup

1. Create a PostgreSQL database:

```sql
CREATE DATABASE kursovaia;
```

2. Apply the schema:

```powershell
psql -d kursovaia -f database.sql
```

3. Copy the backend environment example:

```powershell
Copy-Item .env.example .env
```

4. Fill `.env` with local values:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/kursovaia?sslmode=disable
SEKRETKEY_JWT=change-me
```

Do not commit the real `.env`.

5. Download Go dependencies:

```powershell
go mod download
```

6. Start the backend from `cmd/api`.

The current backend loads `.env` with `../../.env`, so use this command:

```powershell
cd cmd/api
go run .
```

Backend URL:

```text
http://localhost:8080
```

## Frontend Setup

1. Open the frontend directory:

```powershell
cd frontend
```

2. Install dependencies:

```powershell
npm install
```

3. Check `frontend/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Create `frontend/.env.local` with the same value only if you need a local override.

4. Start the frontend:

```powershell
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

Use `http://localhost:5173`, not `http://127.0.0.1:5173`, because local CORS is configured for `localhost`.

## Production Build Check

```powershell
cd frontend
npm run build
npm run preview
```

After `npm run preview`, manually click through the main pages. A successful build does not guarantee runtime routing, auth state, or API calls.

## Make User Admin

Register a user first, then run:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

After changing the role, log out and log in again so the JWT and profile state are refreshed.

## Demo Flow

1. Register admin user.
2. Make user admin via SQL.
3. Login as admin.
4. Open `/admin`.
5. Create course.
6. Create module.
7. Create lesson.
8. Create question with exactly one correct option.
9. Publish course.
10. Register or login student.
11. Open catalog.
12. Enroll in course.
13. Open lesson.
14. Answer quiz wrong once and verify the correct answer is not leaked.
15. Answer quiz correctly.
16. Complete lesson.
17. Check progress update.

## Final Verification Commands

Backend:

```powershell
go mod tidy
git diff -- go.mod go.sum
go test ./...
cd cmd/api
go run .
```

Frontend:

```powershell
cd frontend
npm run build
npm run lint
npm run preview
```

`go mod tidy` can modify `go.mod` and `go.sum`. If those files change, review the diff before commit.

## Troubleshooting

### CORS Error

- Open `http://localhost:5173`, not `http://127.0.0.1:5173`.
- Check `VITE_API_BASE_URL`.
- The default API URL is `http://localhost:8080`.

### Backend Cannot Connect To DB

- Check `DATABASE_URL`.
- Check that PostgreSQL is running.
- Check that the `kursovaia` database exists.
- Apply `database.sql`.

### 401 Or 403

- Log in again.
- For admin access, check `users.role = 'admin'`.
- Log out and log in again after changing the role.

### Quiz Completion Blocked

- Answer all lesson questions correctly before completing the lesson.

### Port Already In Use

- If backend port `8080` is busy, check that another backend or project is not already running.
- If frontend port `5173` is busy, stop the old Vite or Node process.
- On Windows, use Task Manager if needed.
- Alternatively close old terminals that may still run `go run` or `npm run dev`.
- Do not randomly change ports in code before checking running processes.

### Windows Firewall Prompt

- The Go backend may trigger a firewall prompt for `api.exe`.
- For local development, allow private network only if needed.

## Future Work

- edit/delete admin content
- reorder/move up/down
- compiler/code runner
- markdown editor
- file upload
- certificates
- analytics
- deployment polish
- attempt history/statistics
