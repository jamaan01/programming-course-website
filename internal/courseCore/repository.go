package courseCore

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrCourseNotFound = errors.New("course not found")
var ErrCourseNotPublished = errors.New("course is not published")
var ErrAlreadyEnrolled = errors.New("user already enrolled")
var ErrDuplicateOrderNum = errors.New("duplicate order num")

type CourseRepository interface {
	GetAllCourses(ctx context.Context) ([]Course, error)
	GetCourseByID(ctx context.Context, id int) (Course, error)
	GetCourseSyllabus(ctx context.Context, id int) (Course, error)
	GetAllCoursesAdmin(ctx context.Context) ([]Course, error)
	GetCourseByIDAdmin(ctx context.Context, id int) (Course, error)
	GetCourseSyllabusAdmin(ctx context.Context, id int) (Course, error)
	UpdateCoursePublishStatus(ctx context.Context, id int, isPublished bool) error
	EnrollUser(ctx context.Context, userID int, courseID int) error
	GetCoursesByUserID(ctx context.Context, userID int) ([]Course, error)
	CreateCourse(ctx context.Context, title, description string) (int, error)
	ModuleOrderExists(ctx context.Context, courseID int, orderNum int) (bool, error)
	LessonOrderExists(ctx context.Context, moduleID int, orderNum int) (bool, error)
	CreateModule(ctx context.Context, courseID int, title string, orderNum int) (int, error)
	CreateLesson(ctx context.Context, moduleID int, title string, content string, orderNum int) (int, error)
}

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetAllCourses(ctx context.Context) ([]Course, error) {
	query := `SELECT id, title, description, is_published FROM courses WHERE is_published = true ORDER BY id`

	return r.getCourses(ctx, query)
}

func (r *Repository) GetCourseByID(ctx context.Context, id int) (Course, error) {
	query := `SELECT id, title, description, is_published FROM courses WHERE id = $1 AND is_published = true`

	return r.getCourse(ctx, query, id)
}

func (r *Repository) GetCourseSyllabus(ctx context.Context, id int) (Course, error) {
	query := `SELECT id, title, description, is_published FROM courses WHERE id = $1 AND is_published = true`

	return r.getCourseSyllabus(ctx, query, id)
}

func (r *Repository) GetAllCoursesAdmin(ctx context.Context) ([]Course, error) {
	query := `SELECT id, title, description, is_published FROM courses ORDER BY id`

	return r.getCourses(ctx, query)
}

func (r *Repository) GetCourseByIDAdmin(ctx context.Context, id int) (Course, error) {
	query := `SELECT id, title, description, is_published FROM courses WHERE id = $1`

	return r.getCourse(ctx, query, id)
}

func (r *Repository) GetCourseSyllabusAdmin(ctx context.Context, id int) (Course, error) {
	query := `SELECT id, title, description, is_published FROM courses WHERE id = $1`

	return r.getCourseSyllabus(ctx, query, id)
}

func (r *Repository) UpdateCoursePublishStatus(ctx context.Context, id int, isPublished bool) error {
	query := `UPDATE courses SET is_published = $1 WHERE id = $2`

	commandTag, err := r.db.Exec(ctx, query, isPublished, id)
	if err != nil {
		slog.Error("UpdateCoursePublishStatus error", "error", err)
		return fmt.Errorf("course publish update error: %w", err)
	}

	if commandTag.RowsAffected() == 0 {
		return ErrCourseNotFound
	}

	return nil
}

func (r *Repository) EnrollUser(ctx context.Context, userID int, courseID int) error {
	var isPublished bool

	checkQuery := `SELECT is_published FROM courses WHERE id = $1`
	err := r.db.QueryRow(ctx, checkQuery, courseID).Scan(&isPublished)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrCourseNotFound
		}
		slog.Error("Enroll course publish check error", "error", err)
		return fmt.Errorf("course publish check error: %w", err)
	}

	if !isPublished {
		return ErrCourseNotPublished
	}

	query := `INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2)`

	_, err = r.db.Exec(ctx, query, userID, courseID)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
			return ErrAlreadyEnrolled
		}
		slog.Error("EnrollUser error", "error", err)
		return fmt.Errorf("enroll course database error: %w", err)
	}

	return nil
}

func (r *Repository) GetCoursesByUserID(ctx context.Context, userID int) ([]Course, error) {
	query := `
	SELECT c.id, c.title, c.description, c.is_published
	FROM courses c
	JOIN enrollments e ON c.id = e.course_id
	WHERE e.user_id = $1 AND c.is_published = true
	ORDER BY c.id
	`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		slog.Error("GetCoursesByUserID query error", "error", err)
		return nil, fmt.Errorf("user courses query error: %w", err)
	}
	defer rows.Close()

	return scanCourses(rows)
}

func (r *Repository) CreateCourse(ctx context.Context, title, description string) (int, error) {
	var newID int
	query := `
		INSERT INTO courses (title, description, is_published)
		VALUES ($1, $2, false)
		RETURNING id
	`

	err := r.db.QueryRow(ctx, query, title, description).Scan(&newID)
	if err != nil {
		slog.Error("Failed to insert new course into DB", "error", err)
		return 0, fmt.Errorf("course create error: %w", err)
	}

	return newID, nil
}

func (r *Repository) ModuleOrderExists(ctx context.Context, courseID int, orderNum int) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM modules WHERE course_id = $1 AND order_num = $2)`

	err := r.db.QueryRow(ctx, query, courseID, orderNum).Scan(&exists)
	if err != nil {
		slog.Error("Module order check error", "error", err)
		return false, fmt.Errorf("module order check error: %w", err)
	}

	return exists, nil
}

func (r *Repository) LessonOrderExists(ctx context.Context, moduleID int, orderNum int) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM lessons WHERE module_id = $1 AND order_num = $2)`

	err := r.db.QueryRow(ctx, query, moduleID, orderNum).Scan(&exists)
	if err != nil {
		slog.Error("Lesson order check error", "error", err)
		return false, fmt.Errorf("lesson order check error: %w", err)
	}

	return exists, nil
}

func (r *Repository) CreateModule(ctx context.Context, courseID int, title string, orderNum int) (int, error) {
	var newID int
	query := `
	INSERT INTO modules(course_id, title, order_num)
	VALUES ($1, $2, $3)
	RETURNING id
	`
	err := r.db.QueryRow(ctx, query, courseID, title, orderNum).Scan(&newID)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
			return 0, ErrDuplicateOrderNum
		}
		slog.Error("Failed to insert new module into DB", "error", err)
		return 0, fmt.Errorf("module create error: %w", err)
	}

	return newID, nil
}

func (r *Repository) CreateLesson(ctx context.Context, moduleID int, title string, content string, orderNum int) (int, error) {
	var newID int
	query := `
		INSERT INTO lessons (module_id, title, content, order_num)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`

	err := r.db.QueryRow(ctx, query, moduleID, title, content, orderNum).Scan(&newID)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
			return 0, ErrDuplicateOrderNum
		}
		slog.Error("Failed to insert new lesson into DB", "error", err)
		return 0, fmt.Errorf("lesson create error: %w", err)
	}

	return newID, nil
}

func (r *Repository) getCourses(ctx context.Context, query string, args ...any) ([]Course, error) {
	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		slog.Error("Course request error", "error", err)
		return nil, fmt.Errorf("course query error: %w", err)
	}
	defer rows.Close()

	return scanCourses(rows)
}

func (r *Repository) getCourse(ctx context.Context, query string, id int) (Course, error) {
	var c Course

	err := r.db.QueryRow(ctx, query, id).Scan(&c.ID, &c.Title, &c.Description, &c.IsPublished)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Course{}, ErrCourseNotFound
		}
		slog.Error("Course by ID error", "error", err)
		return Course{}, fmt.Errorf("course by id error: %w", err)
	}
	return c, nil
}

func (r *Repository) getCourseSyllabus(ctx context.Context, query string, id int) (Course, error) {
	c, err := r.getCourse(ctx, query, id)
	if err != nil {
		return Course{}, err
	}

	queryModules := `SELECT id, course_id, title, order_num FROM modules WHERE course_id = $1 ORDER BY order_num ASC, id ASC`
	moduleRows, err := r.db.Query(ctx, queryModules, id)
	if err != nil {
		slog.Error("Modules get error", "error", err)
		return Course{}, fmt.Errorf("modules query error: %w", err)
	}
	defer moduleRows.Close()

	for moduleRows.Next() {
		var m Module

		err := moduleRows.Scan(&m.ID, &m.CourseID, &m.Title, &m.OrderNum)
		if err != nil {
			slog.Error("Module get error", "error", err)
			return Course{}, fmt.Errorf("module scan error: %w", err)
		}

		queryLessons := `SELECT id, module_id, title, order_num FROM lessons WHERE module_id = $1 ORDER BY order_num ASC, id ASC`
		lessonRows, err := r.db.Query(ctx, queryLessons, m.ID)
		if err != nil {
			slog.Error("Lessons get error", "error", err)
			return Course{}, fmt.Errorf("lessons query error: %w", err)
		}

		for lessonRows.Next() {
			var l Lesson
			err := lessonRows.Scan(&l.ID, &l.ModuleID, &l.Title, &l.OrderNum)
			if err != nil {
				lessonRows.Close()
				slog.Error("Lessons get error", "error", err)
				return Course{}, fmt.Errorf("lesson scan error: %w", err)
			}
			m.Lessons = append(m.Lessons, l)
		}
		lessonRows.Close()
		c.Modules = append(c.Modules, m)
	}
	return c, nil
}

func scanCourses(rows pgx.Rows) ([]Course, error) {
	courses := make([]Course, 0)
	for rows.Next() {
		var c Course
		err := rows.Scan(&c.ID, &c.Title, &c.Description, &c.IsPublished)
		if err != nil {
			slog.Error("Course scan error", "error", err)
			return nil, fmt.Errorf("course scan error: %w", err)
		}
		courses = append(courses, c)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("course rows error: %w", err)
	}

	return courses, nil
}
