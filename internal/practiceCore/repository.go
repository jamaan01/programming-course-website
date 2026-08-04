package practiceCore

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PracticeRepository interface {
	CheckStudentLessonAccess(ctx context.Context, userID int, lessonID int, userRole string) error
	GetPracticeSummary(ctx context.Context, userID int, lessonID int) (PracticeSummary, error)
	GetStudentPracticeTasks(ctx context.Context, userID int, lessonID int) ([]StudentPracticeTask, error)
	GetCompletedTaskIDs(ctx context.Context, userID int, lessonID int) ([]int, error)
	GetPracticeTaskForCheck(ctx context.Context, taskID int) (PracticeTask, error)
	SaveTaskProgress(ctx context.Context, userID int, taskID int) error
	GetAdminPracticeTasks(ctx context.Context, lessonID int) ([]PracticeTask, error)
	GetAdminPracticeTaskByID(ctx context.Context, taskID int) (PracticeTask, error)
	CreatePracticeTask(ctx context.Context, lessonID int, req CreatePracticeTaskRequest) (PracticeTask, error)
	UpdatePracticeTask(ctx context.Context, taskID int, req UpdatePracticeTaskRequest) (PracticeTask, error)
	PracticeTaskOrderExists(ctx context.Context, lessonID int, orderNum int, excludeTaskID int) (bool, error)
}

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CheckStudentLessonAccess(ctx context.Context, userID int, lessonID int, userRole string) error {
	if err := checkLessonExists(ctx, r.db, lessonID); err != nil {
		return err
	}

	if userRole == "admin" {
		return nil
	}

	var hasAccess bool
	query := `
		SELECT EXISTS (
			SELECT 1
			FROM lessons l
			JOIN modules m ON l.module_id = m.id
			JOIN courses c ON m.course_id = c.id
			JOIN course_access ca ON c.id = ca.course_id
			WHERE l.id = $1
				AND ca.user_id = $2
				AND ca.is_active = true
				AND c.is_published = true
		)
	`

	err := r.db.QueryRow(ctx, query, lessonID, userID).Scan(&hasAccess)
	if err != nil {
		slog.Error("Check practice lesson access error", "error", err)
		return fmt.Errorf("practice lesson access check error: %w", err)
	}

	if !hasAccess {
		return ErrAccessDenied
	}

	return nil
}

func (r *Repository) GetPracticeSummary(ctx context.Context, userID int, lessonID int) (PracticeSummary, error) {
	var activeTaskCount int
	var completedTaskCount int
	query := `
		SELECT
			COUNT(t.id),
			COUNT(p.task_id)
		FROM lesson_practice_tasks t
		LEFT JOIN lesson_practice_task_progress p
			ON p.task_id = t.id
			AND p.user_id = $2
			AND p.is_completed = true
		WHERE t.lesson_id = $1
			AND t.is_active = true
	`

	err := r.db.QueryRow(ctx, query, lessonID, userID).Scan(&activeTaskCount, &completedTaskCount)
	if err != nil {
		slog.Error("Get practice summary error", "error", err)
		return PracticeSummary{}, fmt.Errorf("practice summary query error: %w", err)
	}

	return makePracticeSummary(activeTaskCount, completedTaskCount), nil
}

func (r *Repository) GetStudentPracticeTasks(ctx context.Context, userID int, lessonID int) ([]StudentPracticeTask, error) {
	query := `
		SELECT
			t.id,
			t.lesson_id,
			t.title,
			t.description,
			t.starter_code,
			t.order_num,
			COALESCE(p.is_completed, false)
		FROM lesson_practice_tasks t
		LEFT JOIN lesson_practice_task_progress p
			ON p.task_id = t.id
			AND p.user_id = $2
			AND p.is_completed = true
		WHERE t.lesson_id = $1
			AND t.is_active = true
		ORDER BY t.order_num ASC, t.id ASC
	`

	rows, err := r.db.Query(ctx, query, lessonID, userID)
	if err != nil {
		slog.Error("Get student practice tasks error", "error", err)
		return nil, fmt.Errorf("student practice tasks query error: %w", err)
	}
	defer rows.Close()

	tasks := make([]StudentPracticeTask, 0)
	for rows.Next() {
		var task StudentPracticeTask
		err := rows.Scan(
			&task.ID,
			&task.LessonID,
			&task.Title,
			&task.Description,
			&task.StarterCode,
			&task.OrderNum,
			&task.IsCompleted,
		)
		if err != nil {
			slog.Error("Get student practice task scan error", "error", err)
			return nil, fmt.Errorf("student practice task scan error: %w", err)
		}

		tasks = append(tasks, task)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("student practice tasks rows error: %w", err)
	}

	return tasks, nil
}

func (r *Repository) GetCompletedTaskIDs(ctx context.Context, userID int, lessonID int) ([]int, error) {
	query := `
		SELECT p.task_id
		FROM lesson_practice_task_progress p
		JOIN lesson_practice_tasks t ON p.task_id = t.id
		WHERE p.user_id = $1
			AND p.is_completed = true
			AND t.lesson_id = $2
			AND t.is_active = true
		ORDER BY t.order_num ASC, t.id ASC
	`

	rows, err := r.db.Query(ctx, query, userID, lessonID)
	if err != nil {
		slog.Error("Get completed practice tasks error", "error", err)
		return nil, fmt.Errorf("completed practice tasks query error: %w", err)
	}
	defer rows.Close()

	completedTaskIDs := make([]int, 0)
	for rows.Next() {
		var taskID int
		if err := rows.Scan(&taskID); err != nil {
			slog.Error("Get completed practice task scan error", "error", err)
			return nil, fmt.Errorf("completed practice task scan error: %w", err)
		}

		completedTaskIDs = append(completedTaskIDs, taskID)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("completed practice tasks rows error: %w", err)
	}

	return completedTaskIDs, nil
}

func (r *Repository) GetPracticeTaskForCheck(ctx context.Context, taskID int) (PracticeTask, error) {
	query := `
		SELECT id, lesson_id, title, description, starter_code, expected_output, order_num, is_active, created_at, updated_at
		FROM lesson_practice_tasks
		WHERE id = $1
	`

	return r.scanPracticeTask(ctx, query, taskID)
}

func (r *Repository) SaveTaskProgress(ctx context.Context, userID int, taskID int) error {
	query := `
		INSERT INTO lesson_practice_task_progress (
			user_id,
			task_id,
			is_completed,
			completed_at,
			updated_at
		)
		VALUES ($1, $2, true, NOW(), NOW())
		ON CONFLICT (user_id, task_id)
		DO UPDATE SET
			is_completed = true,
			completed_at = COALESCE(lesson_practice_task_progress.completed_at, EXCLUDED.completed_at),
			updated_at = NOW()
	`

	_, err := r.db.Exec(ctx, query, userID, taskID)
	if err != nil {
		slog.Error("Save practice task progress error", "error", err)
		return fmt.Errorf("practice task progress save error: %w", err)
	}

	return nil
}

func (r *Repository) GetAdminPracticeTasks(ctx context.Context, lessonID int) ([]PracticeTask, error) {
	if err := checkLessonExists(ctx, r.db, lessonID); err != nil {
		return nil, err
	}

	query := `
		SELECT id, lesson_id, title, description, starter_code, expected_output, order_num, is_active, created_at, updated_at
		FROM lesson_practice_tasks
		WHERE lesson_id = $1
		ORDER BY order_num ASC, id ASC
	`

	rows, err := r.db.Query(ctx, query, lessonID)
	if err != nil {
		slog.Error("Get admin practice tasks error", "error", err)
		return nil, fmt.Errorf("admin practice tasks query error: %w", err)
	}
	defer rows.Close()

	tasks := make([]PracticeTask, 0)
	for rows.Next() {
		task, err := scanPracticeTaskRow(rows)
		if err != nil {
			slog.Error("Get admin practice task scan error", "error", err)
			return nil, err
		}

		tasks = append(tasks, task)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("admin practice tasks rows error: %w", err)
	}

	return tasks, nil
}

func (r *Repository) GetAdminPracticeTaskByID(ctx context.Context, taskID int) (PracticeTask, error) {
	query := `
		SELECT id, lesson_id, title, description, starter_code, expected_output, order_num, is_active, created_at, updated_at
		FROM lesson_practice_tasks
		WHERE id = $1
	`

	return r.scanPracticeTask(ctx, query, taskID)
}

func (r *Repository) CreatePracticeTask(ctx context.Context, lessonID int, req CreatePracticeTaskRequest) (PracticeTask, error) {
	query := `
		INSERT INTO lesson_practice_tasks (
			lesson_id,
			title,
			description,
			starter_code,
			expected_output,
			order_num,
			is_active,
			updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
		RETURNING id, lesson_id, title, description, starter_code, expected_output, order_num, is_active, created_at, updated_at
	`

	task, err := scanPracticeTask(r.db.QueryRow(
		ctx,
		query,
		lessonID,
		req.Title,
		req.Description,
		req.StarterCode,
		req.ExpectedOutput,
		req.OrderNum,
		req.IsActive,
	))
	if err != nil {
		if isUniqueViolation(err) {
			return PracticeTask{}, ErrDuplicateOrderNum
		}

		if isForeignKeyViolation(err) {
			return PracticeTask{}, ErrLessonNotFound
		}

		slog.Error("Create practice task error", "error", err)
		return PracticeTask{}, fmt.Errorf("practice task create error: %w", err)
	}

	return task, nil
}

func (r *Repository) UpdatePracticeTask(ctx context.Context, taskID int, req UpdatePracticeTaskRequest) (PracticeTask, error) {
	var title any
	var description any
	var starterCode any
	var expectedOutput any
	var orderNum any
	var isActive any

	if req.Title != nil {
		title = *req.Title
	}
	if req.Description != nil {
		description = *req.Description
	}
	if req.StarterCode != nil {
		starterCode = *req.StarterCode
	}
	if req.ExpectedOutput != nil {
		expectedOutput = *req.ExpectedOutput
	}
	if req.OrderNum != nil {
		orderNum = *req.OrderNum
	}
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	query := `
		UPDATE lesson_practice_tasks
		SET
			title = COALESCE($2, title),
			description = COALESCE($3, description),
			starter_code = COALESCE($4, starter_code),
			expected_output = COALESCE($5, expected_output),
			order_num = COALESCE($6, order_num),
			is_active = COALESCE($7, is_active),
			updated_at = NOW()
		WHERE id = $1
		RETURNING id, lesson_id, title, description, starter_code, expected_output, order_num, is_active, created_at, updated_at
	`

	task, err := scanPracticeTask(r.db.QueryRow(
		ctx,
		query,
		taskID,
		title,
		description,
		starterCode,
		expectedOutput,
		orderNum,
		isActive,
	))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PracticeTask{}, ErrPracticeTaskNotFound
		}

		if isUniqueViolation(err) {
			return PracticeTask{}, ErrDuplicateOrderNum
		}

		slog.Error("Update practice task error", "error", err)
		return PracticeTask{}, fmt.Errorf("practice task update error: %w", err)
	}

	return task, nil
}

func (r *Repository) PracticeTaskOrderExists(ctx context.Context, lessonID int, orderNum int, excludeTaskID int) (bool, error) {
	var exists bool
	query := `
		SELECT EXISTS (
			SELECT 1
			FROM lesson_practice_tasks
			WHERE lesson_id = $1
				AND order_num = $2
				AND is_active = true
				AND id <> $3
		)
	`

	err := r.db.QueryRow(ctx, query, lessonID, orderNum, excludeTaskID).Scan(&exists)
	if err != nil {
		slog.Error("Practice task order check error", "error", err)
		return false, fmt.Errorf("practice task order check error: %w", err)
	}

	return exists, nil
}

func (r *Repository) scanPracticeTask(ctx context.Context, query string, args ...any) (PracticeTask, error) {
	task, err := scanPracticeTask(r.db.QueryRow(ctx, query, args...))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PracticeTask{}, ErrPracticeTaskNotFound
		}

		slog.Error("Scan practice task error", "error", err)
		return PracticeTask{}, fmt.Errorf("practice task query error: %w", err)
	}

	return task, nil
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanPracticeTask(row rowScanner) (PracticeTask, error) {
	var task PracticeTask
	err := row.Scan(
		&task.ID,
		&task.LessonID,
		&task.Title,
		&task.Description,
		&task.StarterCode,
		&task.ExpectedOutput,
		&task.OrderNum,
		&task.IsActive,
		&task.CreatedAt,
		&task.UpdatedAt,
	)
	return task, err
}

func scanPracticeTaskRow(row rowScanner) (PracticeTask, error) {
	task, err := scanPracticeTask(row)
	if err != nil {
		return PracticeTask{}, fmt.Errorf("practice task scan error: %w", err)
	}

	return task, nil
}

type lessonChecker interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

func checkLessonExists(ctx context.Context, db lessonChecker, lessonID int) error {
	var id int
	err := db.QueryRow(ctx, `SELECT id FROM lessons WHERE id = $1`, lessonID).Scan(&id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrLessonNotFound
		}

		return fmt.Errorf("lesson check error: %w", err)
	}

	return nil
}

func isUniqueViolation(err error) bool {
	return strings.Contains(err.Error(), "23505") || strings.Contains(err.Error(), "duplicate key")
}

func isForeignKeyViolation(err error) bool {
	return strings.Contains(err.Error(), "23503") || strings.Contains(err.Error(), "foreign key")
}
