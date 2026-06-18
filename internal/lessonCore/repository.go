package lessonCore

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrAccessDenied = errors.New("access denied")
var ErrQuizNotComplete = errors.New("lesson quiz not complete")

type LessonRepository interface {
	GetLessonByID(ctx context.Context, id int) (Lesson, error)
	CheckAccess(ctx context.Context, userID int, lessonID int) error
	AreAllLessonQuestionsCorrect(ctx context.Context, userID int, lessonID int) (bool, error)
	UpdateLessonProgress(ctx context.Context, userID int, lessonID int, isCompleted bool) error
	GetCompletedLesson(ctx context.Context, userID int, courseID int) ([]int, error)
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
		return fmt.Errorf("%w: доступ заборонено: ви не придбали цей курс", ErrAccessDenied)
	}

	return nil
}

func (r *Repository) checkCourseEnrollment(ctx context.Context, userID int, courseID int) error {
	var isEnrolled bool

	query := `
	SELECT EXISTS (
		SELECT 1
		FROM enrollments
		WHERE user_id = $1 AND course_id = $2
	)
	`

	err := r.db.QueryRow(ctx, query, userID, courseID).Scan(&isEnrolled)
	if err != nil {
		slog.Error("Check course enrollment error", "error", err)
		return fmt.Errorf("помилка бази даних при перевірці запису на курс: %w", err)
	}

	if !isEnrolled {
		return fmt.Errorf("%w: доступ заборонено: ви не придбали цей курс", ErrAccessDenied)
	}

	return nil
}

func (r *Repository) AreAllLessonQuestionsCorrect(ctx context.Context, userID int, lessonID int) (bool, error) {
	var allQuestionsCorrect bool
	query := `
		SELECT
			(
				SELECT COUNT(*)
				FROM lesson_questions
				WHERE lesson_id = $1
			)
			=
			(
				SELECT COUNT(*)
				FROM lesson_question_attempts qa
				JOIN lesson_questions q ON qa.question_id = q.id
				WHERE q.lesson_id = $1
					AND qa.user_id = $2
					AND qa.is_correct = true
			) AS all_questions_correct
	`

	err := r.db.QueryRow(ctx, query, lessonID, userID).Scan(&allQuestionsCorrect)
	if err != nil {
		slog.Error("Check lesson quiz completion error", "error", err)
		return false, fmt.Errorf("lesson quiz completion check error: %w", err)
	}

	return allQuestionsCorrect, nil
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

func (r *Repository) GetCompletedLesson(ctx context.Context, userID int, courseID int) ([]int, error) {
	if err := r.checkCourseEnrollment(ctx, userID, courseID); err != nil {
		return nil, err
	}

	query := `
		SELECT lp.lesson_id
		FROM lesson_progress lp
		JOIN lessons l ON lp.lesson_id = l.id
		JOIN modules m ON l.module_id = m.id
		WHERE lp.user_id = $1 AND m.course_id = $2 AND lp.is_completed = true
	`

	rows, err := r.db.Query(ctx, query, userID, courseID)
	if err != nil {
		slog.Error("GetCompletedLessons query error", "error", err)
		return nil, fmt.Errorf("помилка отримання прогресу: %w", err)
	}
	defer rows.Close()

	var completedIDs []int
	for rows.Next() {
		var lessonID int
		if err := rows.Scan(&lessonID); err != nil {
			slog.Error("GetCompletedLessons scan error", "error", err)
			return nil, fmt.Errorf("помилка читання прогресу: %w", err)
		}
		completedIDs = append(completedIDs, lessonID)
	}

	if completedIDs == nil {
		completedIDs = []int{}
	}
	return completedIDs, nil
}
