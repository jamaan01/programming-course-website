package courseCore

import (
	"context"
	"fmt"
	"log/slog"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

type CourseRepository interface {
	GetAllCourses(ctx context.Context) ([]Course, error)
	GetCourseByID(ctx context.Context, id int) (Course, error)
	GetCourseSyllabus(ctx context.Context, id int) (Course, error)
	EnrollUser(ctx context.Context, userID int, courseID int) error
	GetCoursesByUserID(ctx context.Context, userID int) ([]Course, error)
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

func (r *Repository) GetCourseByID(ctx context.Context, id int) (Course, error) {
	var c Course

	query := `SELECT id, title, description FROM courses WHERE id = $1`

	err := r.db.QueryRow(ctx, query, id).Scan(&c.ID, &c.Title, &c.Description)
	if err != nil {
		slog.Error("Course by ID error", "error", err)
		return Course{}, fmt.Errorf("курс не знайдено: %w", err)
	}
	return c, nil
}

func (r *Repository) GetCourseSyllabus(ctx context.Context, id int) (Course, error) {
	var c Course
	queryCourse := `SELECT id, title, description FROM courses WHERE id = $1`
	err := r.db.QueryRow(ctx, queryCourse, id).Scan(&c.ID, &c.Title, &c.Description)
	if err != nil {
		slog.Error("Course syllabus error", "error", err)
		return Course{}, fmt.Errorf("курс не знайдено: %w", err)
	}

	queryModules := `SELECT id, course_id, title, order_num FROM modules WHERE course_id = $1 ORDER BY order_num ASC`
	moduleRows, err := r.db.Query(ctx, queryModules, id)
	if err != nil {
		slog.Error("Modules get error", "error", err)
		return Course{}, fmt.Errorf("помилка отримання модулів: %w", err)
	}
	defer moduleRows.Close()

	for moduleRows.Next() {
		var m Module

		err := moduleRows.Scan(&m.ID, &m.CourseID, &m.Title, &m.OrderNum)
		if err != nil {
			slog.Error("Module get error", "error", err)
			return Course{}, fmt.Errorf("помилка отримання модулів: %w", err)
		}

		queryLessons := `SELECT id, module_id, title, order_num FROM lessons WHERE module_id = $1 ORDER BY order_num ASC`
		lessonRows, err := r.db.Query(ctx, queryLessons, m.ID)
		if err != nil {
			slog.Error("Lessons get error", "error", err)
			return Course{}, fmt.Errorf("помилка отримання уроків: %w", err)
		}

		for lessonRows.Next() {
			var l Lesson
			err := lessonRows.Scan(&l.ID, &l.ModuleID, &l.Title, &l.OrderNum)
			if err != nil {
				lessonRows.Close()
				slog.Error("Lessons get error", "error", err)
				return Course{}, fmt.Errorf("помилка отримання уроків: %w", err)
			}
			m.Lessons = append(m.Lessons, l)
		}
		lessonRows.Close()
		c.Modules = append(c.Modules, m)
	}
	return c, nil
}

func (r *Repository) EnrollUser(ctx context.Context, userID int, courseID int) error {
	query := `INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2)`

	_, err := r.db.Exec(ctx, query, userID, courseID)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
			return fmt.Errorf("ви вже отримали доступ до цього курсу")
		}
		slog.Error("EnrollUser error", "error", err)
		return fmt.Errorf("помилка бази даних при записі на курс: %w", err)
	}

	return nil
}

func (r *Repository) GetCoursesByUserID(ctx context.Context, userID int) ([]Course, error) {
	query := `
	SELECT c.id, c.title, c.description
	FROM courses c
	JOIN enrollments e ON c.id = e.course_id
	WHERE e.user_id = $1
	`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		slog.Error("GetCoursesByUserID query error", "error", err)
		return nil, fmt.Errorf("помилка бази даних при отриманні курсів: %w", err)
	}
	defer rows.Close()

	var courses []Course

	for rows.Next() {
		var course Course

		err := rows.Scan(&course.ID, &course.Title, &course.Description)
		if err != nil {
			slog.Error("GetCoursesByUserID scan error", "error", err)
			return nil, fmt.Errorf("помилка при читанні даних курсу: %w", err)
		}

		courses = append(courses, course)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("помилка при обробці списку курсів: %w", err)
	}

	return courses, nil
}
