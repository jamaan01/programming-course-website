# UI_STYLE_GUIDE.md

## Purpose

This file defines the visual and UX direction for the Ukrainian-language programming courses frontend.

The interface should be:

- clean;
- modern;
- calm;
- responsive;
- easy to understand;
- comfortable for learning.

---

## General style

Use a modern dark educational SaaS style inspired by Go developer ecosystem aesthetics.

The UI should feel:

- professional;
- minimalistic;
- structured;
- technical;
- trustworthy;
- spacious;
- focused on learning.

The interface should look like a polished developer education platform, not like a raw admin panel.

Avoid:

- overloaded layouts;
- random colors;
- light-theme blocks;
- unstyled default HTML;
- ugly placeholder UI;
- lorem ipsum in visible UI;
- fake marketing noise;
- excessive animations;
- too many bright accents.

---

## Visual direction

Use a Dark Go-style SaaS palette.

Tailwind color direction:

### Backgrounds

- main background: `slate-950`
- secondary background: `slate-900`
- cards/blocks: `slate-900`
- elevated cards: `slate-900` with subtle border
- overlays/modals: `slate-950/80`

### Typography

- main headings: `slate-100`
- primary text: `slate-200`
- body text: `slate-300`
- secondary text: `slate-400`
- muted text: `slate-500`

### Borders

- default borders: `slate-800`
- stronger borders: `slate-700`
- focus border: `sky-500`

### Primary accent — Go Blue

Use Go Blue `#00ADD8` as the main brand accent.

If using default Tailwind colors, use `sky-500` as the closest practical utility color.

Use it for:

- primary buttons;
- active navigation;
- active lesson;
- selected states;
- important links;
- main CTA elements.

### Additional accents

Use `cyan-400` for:

- progress bars;
- small technical details;
- subtle highlights;
- icons;
- secondary accents.

Use `emerald-500` for:

- success states;
- completed lessons;
- positive status badges.

Use `rose-500` for:

- errors;
- destructive states;
- failed requests.

### Design rules

- Keep the interface dark by default.
- Do not mix dark and light sections randomly.
- Use bright accents sparingly.
- Cards should use dark surfaces with subtle borders.
- Prefer contrast through spacing, typography and borders instead of many colors.
- The UI should feel like a modern professional SaaS product in dark theme.

---

## Layout principles

Every page should have:

- clear main heading;
- short helper text if useful;
- obvious primary action;
- grouped content sections;
- consistent max-width container;
- consistent spacing;
- desktop and mobile layout.

Avoid:

- horizontal overflow;
- cramped blocks;
- inconsistent spacing;
- random button placement;
- too many competing actions.

---

## Typography

Use:

- clear page titles;
- readable body text;
- consistent font sizes;
- strong contrast;
- short labels;
- clear button text.

Avoid:

- tiny text;
- too many font sizes;
- decorative fonts;
- long unreadable paragraphs.

---

## Components

Prefer reusable components.

Recommended shared components:

- AppLayout
- Header
- PageContainer
- CourseCard
- LessonSidebar
- ProgressBar
- EmptyState
- ErrorState
- LoadingState
- ProtectedRoute
- AuthFormLayout

Use shadcn/ui where useful.

Recommended initial shadcn/ui components:

- Button
- Input
- Label
- Card
- Badge
- Progress
- Separator
- Skeleton
- Sonner or toast
- Sheet or Dialog if needed

Do not install every shadcn/ui component at once.

Component style direction:

- cards: `bg-slate-900 border border-slate-800`
- page background: `bg-slate-950`
- primary buttons: `bg-sky-500 text-white hover:bg-sky-400`
- secondary buttons: `border border-slate-700 text-slate-200`
- inputs: `bg-slate-900 border-slate-800 text-slate-100`
- badges: dark background with accent border/text
- progress: `bg-slate-800` track with `bg-cyan-400` indicator

---

## Interactions

Add useful states:

- hover states for buttons and cards;
- focus states for inputs and links;
- active navigation states;
- disabled states;
- active lesson highlight;
- completed lesson checkmarks.

Animations should be subtle.

Allowed:

- smooth hover;
- soft fade-in;
- slight translate-up;
- smooth sidebar opening.

Avoid heavy or distracting motion.

Dark theme interaction rules:

- hover states should slightly brighten cards or borders;
- buttons can use `hover:bg-sky-400`;
- card hover can use `hover:border-sky-500/40`;
- active lesson should use a subtle `sky-500` or `cyan-400` accent;
- completed lessons should use `emerald-500`;
- focus rings should use `sky-500`.

---

## Responsive behavior

The interface must work on:

- desktop;
- tablet;
- mobile.

Mobile rules:

- course cards stack vertically;
- auth forms fit screen width;
- lesson content stays readable;
- buttons are easy to tap;
- sidebar does not break content;
- no horizontal scroll.

For the lesson page, sidebar can become collapsible on mobile.

---

## Ukrainian UI text

All user-facing text must be Ukrainian.

Examples:

- Увійти
- Зареєструватися
- Вийти
- Мої курси
- Переглянути курс
- Почати навчання
- Продовжити навчання
- Записатися на курс
- Позначити як пройдений
- Позначити як непройдений
- Попередній урок
- Наступний урок
- Прогрес курсу
- Урок завершено
- Немає доступу
- Спочатку запишіться на курс
- Спробуйте ще раз

Avoid mixed Russian/Ukrainian UI and broken backend messages.

---

## Page guidance

### Home / Courses Page

Use dark hero section with Go Blue accent elements.
Course cards should be dark, bordered and clean.

Should feel like a clean course catalog.

Needs:

- clear heading;
- short platform description;
- course grid/list;
- course cards;
- action to open course;
- login/register or profile navigation.

### Auth Pages

Login and register pages should be simple and focused.

Needs:

- centered card;
- clear title;
- email/password inputs;
- name input on register;
- helpful Ukrainian errors;
- submit button;
- link between login/register.

### Course Page

Should clearly show:

- course title;
- course description;
- modules;
- lessons;
- enroll button;
- user progress if authenticated.

States:

- guest;
- authenticated but not enrolled;
- enrolled;
- loading;
- error;
- empty syllabus.

### Lesson Page

Lesson workspace should use dark layout:

- sidebar: `bg-slate-900` with `border-slate-800`;
- active lesson: subtle `sky-500` accent;
- completed lesson: `emerald-500` checkmark;
- progress bar: `cyan-400`;
- lesson content: high contrast text on dark background.

This is the most important MVP page.

It should feel like a focused learning workspace.

Needs:

- left sidebar with modules and lessons;
- active lesson highlight;
- completed lesson checkmarks;
- progress bar;
- progress percentage;
- lesson title;
- readable lesson content;
- complete/incomplete button;
- previous lesson button;
- next lesson button.

The user should always understand:

- which course they are in;
- which lesson is active;
- which lessons are completed;
- how much of the course is completed;
- what the next action is.

### Profile Page

Should show:

- user name;
- user email;
- edit profile form;
- enrolled courses;
- continue learning links.

---

## Progress UI

Progress visual style:

- progress track: `bg-slate-800`
- progress indicator: `bg-cyan-400`
- completed lesson checkmarks: `text-emerald-500`
- active lesson indicator: `text-sky-500` or `border-sky-500`

Progress must be shown in three ways:

- completed lesson checkmarks;
- percentage;
- progress bar.

Formula:

```text
completed_lesson_ids.length / totalLessons.length * 100
```

If there are no lessons, progress is 0%.

Progress should update after marking lesson complete/incomplete without full page reload if local state can update safely.

---

## Loading, empty and error states

Dark theme state styling:

- loading skeletons: `bg-slate-800`
- empty states: `bg-slate-900 border-slate-800 text-slate-400`
- error states: use `rose-500` accents without making the whole page red
- success states: use `emerald-500`

Use loading states for API-based UI.

Required states:

- loading courses;
- loading course details;
- loading syllabus;
- loading profile;
- loading lesson;
- saving profile;
- enrolling in course;
- marking lesson complete/incomplete.

Required empty states:

- no courses;
- no enrolled courses;
- course has no modules;
- module has no lessons;
- lesson content is empty.

Error messages must be Ukrainian.

Map common errors:

- 400 — Некоректні дані
- 401 — Увійдіть в акаунт
- 403 — Немає доступу
- 404 — Не знайдено
- 409 — Конфлікт даних
- 500 — Помилка сервера

Additional messages:

- Не вдалося завантажити курси.
- Не вдалося завантажити курс.
- Не вдалося завантажити урок.
- Сесія завершилася, увійдіть знову.
- Спробуйте ще раз.

Use toast notifications for important API errors.

Do not show broken backend encoding messages directly.

---

## Accessibility basics

Respect basic accessibility:

- buttons have clear labels;
- links are understandable;
- inputs have labels;
- focus states are visible;
- text contrast is readable;
- clickable elements are large enough on mobile;
- completion is not shown only by color.

Completed lessons should use both:

- checkmark;
- color or badge.

---

## Legal/footer blocks

Legal and cookie blocks are not required for the first MVP unless explicitly requested.

If added later:

- place links in footer;
- open legal text in modal dialog;
- add background overlay;
- add close button;
- mention analytics/cookies only if actually used.
