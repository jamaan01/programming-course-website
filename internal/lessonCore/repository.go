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
