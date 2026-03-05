package courseCore

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5/pgxpool"
)

type CourseRepository interface {
	GetAllCourses(ctx context.Context) ([]Course, error)
}

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetAllCourses(ctx context.Context) ([]Course, error) {
	query := `SELECT id, title, description FROM courses ORDER by id`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		slog.Error("Course request error", "error", err)
		return nil, fmt.Errorf("помилка запиту курсів: %w", err)
	}
	defer rows.Close()

	courses := make([]Course, 0)
	for rows.Next() {
		var c Course
		err := rows.Scan(&c.ID, &c.Title, &c.Description)
		if err != nil {
			slog.Error("Course scan error", "error", err)
			return nil, fmt.Errorf("помилка сканування курсу: %w", err)
		}
		courses = append(courses, c)
	}

	return courses, nil
}
