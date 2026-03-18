package lessonCore

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5/pgxpool"
)

type LessonRepository interface {
	GetLessonByID(ctx context.Context, id int) (Lesson, error)
	CheckAccess(ctx context.Context, userID int, lessonID int) error
	UpdateLessonProgress(ctx context.Context, userID int, lessonID int, isCompleted bool) error
}

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetLessonByID(ctx context.Context, id int) (Lesson, error) {
	var l Lesson

	query := `SELECT id, module_id, title, content, order_num FROM lessons WHERE id = $1`
	err := r.db.QueryRow(ctx, query, id).Scan(&l.ID, &l.ModuleID, &l.Title, &l.Content, &l.OrderNum)
	if err != nil {
		slog.Error("Lesson by ID error", "error", err)
		return Lesson{}, fmt.Errorf("урок не знайдено: %w", err)
	}

	return l, nil
}

func (r *Repository) CheckAccess(ctx context.Context, userID int, lessonID int) error {
	var hasAccess bool

	query := `
	SELECT EXISTS (
	SELECT 1
	FROM lessons l
	JOIN modules m ON l.module_id = m.id
	JOIN enrollments e ON m.course_id = e.course_id
	WHERE l.id = $1 AND e.user_id = $2
	)
	`

	err := r.db.QueryRow(ctx, query, lessonID, userID).Scan(&hasAccess)
	if err != nil {
		slog.Error("Check access error", "error", err)
		return fmt.Errorf("помилка бази даних при перевірці доступу: %w", err)
	}

	if !hasAccess {
		return fmt.Errorf("доступ заборонено: ви не придбали цей курс")
	}

	return nil
}

func (r *Repository) UpdateLessonProgress(ctx context.Context, userID int, lessonID int, isCompleted bool) error {
	query := `
		INSERT INTO lesson_progress (user_id, lesson_id, is_completed)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, lesson_id)
		DO UPDATE SET
			is_completed = EXCLUDED.is_completed, 
			completed_at = CURRENT_TIMESTAMP
	`

	_, err := r.db.Exec(ctx, query, userID, lessonID, isCompleted)
	if err != nil {
		slog.Error("UpdateLessonProgress error", "error", err)
		return fmt.Errorf("помилка бази даних при збереженні прогресу: %w", err)
	}

	return nil
}
