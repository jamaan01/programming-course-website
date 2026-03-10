package lessonCore

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5/pgxpool"
)

type LessonRepository interface {
	GetLessonByID(ctx context.Context, id int) (Lesson, error)
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
