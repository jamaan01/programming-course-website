# GoLab: запуск проєкту з нуля

Це backend навчальної платформи GoLab на Go. Backend працює на Gin, PostgreSQL та JWT-авторизації. Frontend лежить окремо у папці `front_kursovaia/kursach_front` і звертається до backend через REST API.

Цей README описує повний запуск проєкту локально: база даних, backend, frontend, тестовий адмін та перевірка.

## 1. Що потрібно встановити

Перед запуском перевір, що на комп'ютері є:

- Go
- PostgreSQL
- Git
- браузер
- бажано встановлений `psql`, щоб виконати `init.sql`

Перевірка у PowerShell:

```powershell
go version
psql --version
git --version
```

Якщо `psql` не знаходиться, PostgreSQL може бути встановлений, але його `bin` папка не додана у `PATH`.

## 2. Структура проєкту

Основні папки:

```text
C:\it\ProgrammingCoursesSite
├── programming-course-website       # Go backend
└── front_kursovaia\kursach_front    # Vanilla JS frontend
```

Backend запускати потрібно з папки:

```powershell
cd C:\it\ProgrammingCoursesSite\programming-course-website
```

Frontend запускати потрібно з папки:

```powershell
cd C:\it\ProgrammingCoursesSite\front_kursovaia\kursach_front
```

## 3. Налаштування `.env`

У backend-папці `programming-course-website` має бути файл `.env`.

Приклад:

```env
DB_URL=postgres://postgres:postgres@localhost:5432/golab?sslmode=disable
JWT_SECRET=SECKRET-KEY-FOR-MY_cite
PORT=8080
```

Що означають ці поля:

- `DB_URL` - підключення до PostgreSQL.
- `JWT_SECRET` - секретний ключ для підпису JWT-токенів.
- `PORT` - порт backend-сервера. За замовчуванням використовується `8080`.

Якщо у тебе пароль від PostgreSQL не `postgres`, зміни його у `DB_URL`.

Наприклад, якщо пароль `Mp010203`:

```env
DB_URL=postgres://postgres:Mp010203@localhost:5432/golab?sslmode=disable
```

## 4. Створення бази даних

Відкрий PowerShell і зайди у backend-папку:

```powershell
cd C:\it\ProgrammingCoursesSite\programming-course-website
```

Створи базу `golab`, якщо її ще немає:

```powershell
createdb -U postgres golab
```

Якщо команда `createdb` недоступна, можна створити базу через `psql`:

```powershell
psql -U postgres
```

Потім у PostgreSQL-консолі:

```sql
CREATE DATABASE golab;
\q
```

Якщо база вже існує, цей крок можна пропустити.

## 5. Ініціалізація таблиць

У проєкті є файл `init.sql`. Він створює таблиці:

- `users`
- `courses`
- `modules`
- `lessons`
- `enrollments`
- `lesson_progress`

Також він додає тестового адміністратора.

Важливо: `init.sql` спочатку видаляє старі таблиці. Якщо у базі вже були курси, модулі, уроки або користувачі, вони будуть видалені.

Запуск:

```powershell
psql "postgres://postgres:postgres@localhost:5432/golab?sslmode=disable" -f init.sql
```

Якщо у тебе інший пароль PostgreSQL, заміни його в команді:

```powershell
psql "postgres://postgres:Mp010203@localhost:5432/golab?sslmode=disable" -f init.sql
```

Після цього база готова.

## 6. Встановлення Go-залежностей

У backend-папці виконай:

```powershell
go mod tidy
```

Це підтягне та впорядкує залежності з `go.mod`.

## 7. Запуск backend

У backend-папці:

```powershell
go run main.go
```

Якщо все добре, сервер буде доступний тут:

```text
http://localhost:8080
```

Backend не відкриває HTML-сторінку сам по собі. Він тільки віддає API.

Швидка перевірка API:

```powershell
Invoke-WebRequest http://localhost:8080/api/courses
```

Або просто відкрий у браузері:

```text
http://localhost:8080/api/courses
```

Якщо бачиш `[]` або список курсів у JSON-форматі, backend працює.

## 8. Запуск frontend

Frontend лежить тут:

```powershell
cd C:\it\ProgrammingCoursesSite\front_kursovaia\kursach_front
```

Запусти простий локальний сервер на порту `5500`:

```powershell
python -m http.server 5500
```

Якщо Windows не знаходить команду `python`, спробуй так:

```powershell
py -m http.server 5500
```

Після цього відкрий у браузері:

```text
http://127.0.0.1:5500/index.html
```

Важливо: не відкривай frontend просто подвійним кліком по `index.html`.

Потрібно запускати саме через локальний сервер, бо backend дозволяє CORS для:

```text
http://127.0.0.1:5500
```

Якщо відкрити файл як `file://`, запити до API можуть не працювати.

## 9. Дані для входу в адмін-панель

Після виконання `init.sql` доступний тестовий адмін:

```text
Email: testadmin@golab.com
Password: 123456789
```

Адмін-панель:

```text
http://127.0.0.1:5500/admin.html
```

Спочатку потрібно увійти через:

```text
http://127.0.0.1:5500/index.html
```

Після входу токен збережеться у браузері, і адмінка зможе відправляти запити до backend.

## 10. Базовий сценарій перевірки

Після запуску backend і frontend можна перевірити основний сценарій:

1. Відкрити `http://127.0.0.1:5500/index.html`.
2. Увійти під адміном.
3. Перейти в адмін-панель.
4. Створити курс.
5. Додати модуль до створеного курсу.
6. Додати один або кілька уроків у модуль.
7. Перейти у профіль.
8. Відкрити курс.
9. Натиснути кнопку початку навчання.
10. Відкрити урок.
11. Завершити урок і перейти до наступного.

Це основний MVP-флоу проєкту.

## 11. Корисні API-ручки

Публічні ручки:

```text
POST /auth/register
POST /auth/login
GET  /api/courses
GET  /api/courses/:id
GET  /api/courses/:id/syllabus
```

Ручки для авторизованого користувача:

```text
GET  /api/profile
PUT  /api/profile
GET  /api/profile/courses
POST /api/courses/:id/enroll
GET  /api/lessons/:id
POST /api/lessons/:id/complete
GET  /api/courses/:id/progress
```

Адмінські ручки:

```text
POST   /api/admin/courses
POST   /api/admin/courses/:id/modules
POST   /api/admin/modules/:id/lessons
PUT    /api/admin/users/:id/role
DELETE /api/admin/courses/:id
DELETE /api/admin/lessons/:id
```

## 12. Запуск тестів

У backend-папці:

```powershell
go test ./...
```

Якщо Windows видає помилку доступу до Go build cache, закрий зайві процеси Go/IDE або запусти PowerShell з нормальними правами користувача.

## 13. Типові проблеми

### Backend не запускається і пише `DB_URL is not set`

Перевір, що файл `.env` лежить саме тут:

```text
C:\it\ProgrammingCoursesSite\programming-course-website\.env
```

Також перевір, що всередині є `DB_URL`.

### Backend не може підключитися до PostgreSQL

Перевір:

- чи запущений PostgreSQL;
- чи правильний пароль у `DB_URL`;
- чи існує база `golab`;
- чи порт PostgreSQL дорівнює `5432`.

### Frontend відкрився, але кнопки не працюють

Перевір, що:

- backend запущений на `http://localhost:8080`;
- frontend відкритий через `http://127.0.0.1:5500/index.html`;
- ти не відкрив HTML через `file://`;
- у браузері немає старого токена. Якщо є проблема з авторизацією, натисни `Вийти` або очисти `localStorage`.

### Адмінка не відкривається

Перевір, що ти увійшов саме під адміном:

```text
testadmin@golab.com
123456789
```

Звичайний користувач не має доступу до адмінських ручок.

## 14. Коротко: повний запуск

Backend:

```powershell
cd C:\it\ProgrammingCoursesSite\programming-course-website
go mod tidy
psql "postgres://postgres:postgres@localhost:5432/golab?sslmode=disable" -f init.sql
go run main.go
```

Frontend в іншому PowerShell-вікні:

```powershell
cd C:\it\ProgrammingCoursesSite\front_kursovaia\kursach_front
python -m http.server 5500
```

Або, якщо команда `python` не працює:

```powershell
py -m http.server 5500
```

Відкрити:

```text
http://127.0.0.1:5500/index.html
```
