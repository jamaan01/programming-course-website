package questionCore

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type QuestionRepository interface {
	CreateQuestion(ctx context.Context, lessonID int, req CreateQuestionRequest) (int, error)
	GetQuestionsByLessonID(ctx context.Context, lessonID int) ([]Question, error)
	QuestionOrderExists(ctx context.Context, lessonID int, orderNum int) (bool, error)
	CheckStudentLessonAccess(ctx context.Context, userID int, lessonID int) error
	GetStudentQuestionsByLessonID(ctx context.Context, lessonID int) (LessonQuestionsResponse, error)
	CheckQuestionExists(ctx context.Context, questionID int) error
	CheckStudentQuestionAccess(ctx context.Context, userID int, questionID int) error
	GetOptionCorrectness(ctx context.Context, questionID int, optionID int) (bool, error)
	GetCorrectOptionID(ctx context.Context, questionID int) (int, error)
}

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CreateQuestion(ctx context.Context, lessonID int, req CreateQuestionRequest) (int, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		slog.Error("CreateQuestion begin transaction error", "error", err)
		return 0, fmt.Errorf("question transaction begin error: %w", err)
	}
	defer tx.Rollback(ctx)

	if err := checkLessonExists(ctx, tx, lessonID); err != nil {
		return 0, err
	}

	var questionID int
	questionQuery := `
		INSERT INTO lesson_questions (lesson_id, question_text, order_num)
		VALUES ($1, $2, $3)
		RETURNING id
	`
	err = tx.QueryRow(ctx, questionQuery, lessonID, req.QuestionText, req.OrderNum).Scan(&questionID)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
			return 0, ErrDuplicateOrderNum
		}
		slog.Error("CreateQuestion insert question error", "error", err)
		return 0, fmt.Errorf("question create error: %w", err)
	}

	optionQuery := `
		INSERT INTO lesson_question_options (question_id, option_text, is_correct, order_num)
		VALUES ($1, $2, $3, $4)
	`
	for _, option := range req.Options {
		_, err := tx.Exec(ctx, optionQuery, questionID, option.OptionText, option.IsCorrect, option.OrderNum)
		if err != nil {
			if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
				return 0, ErrDuplicateOrderNum
			}
			slog.Error("CreateQuestion insert option error", "error", err)
			return 0, fmt.Errorf("question option create error: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		slog.Error("CreateQuestion commit error", "error", err)
		return 0, fmt.Errorf("question transaction commit error: %w", err)
	}

	return questionID, nil
}

func (r *Repository) QuestionOrderExists(ctx context.Context, lessonID int, orderNum int) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM lesson_questions WHERE lesson_id = $1 AND order_num = $2)`

	err := r.db.QueryRow(ctx, query, lessonID, orderNum).Scan(&exists)
	if err != nil {
		slog.Error("Question order check error", "error", err)
		return false, fmt.Errorf("question order check error: %w", err)
	}

	return exists, nil
}

func (r *Repository) GetQuestionsByLessonID(ctx context.Context, lessonID int) ([]Question, error) {
	if err := checkLessonExists(ctx, r.db, lessonID); err != nil {
		return nil, err
	}

	query := `
		SELECT id, lesson_id, question_text, order_num
		FROM lesson_questions
		WHERE lesson_id = $1
		ORDER BY order_num ASC, id ASC
	`
	rows, err := r.db.Query(ctx, query, lessonID)
	if err != nil {
		slog.Error("GetQuestions query error", "error", err)
		return nil, fmt.Errorf("questions query error: %w", err)
	}
	defer rows.Close()

	questions := make([]Question, 0)
	for rows.Next() {
		var question Question
		err := rows.Scan(&question.ID, &question.LessonID, &question.QuestionText, &question.OrderNum)
		if err != nil {
			slog.Error("GetQuestions scan error", "error", err)
			return nil, fmt.Errorf("question scan error: %w", err)
		}

		options, err := r.getOptionsByQuestionID(ctx, question.ID)
		if err != nil {
			return nil, err
		}

		question.Options = options
		questions = append(questions, question)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("questions rows error: %w", err)
	}

	return questions, nil
}

func (r *Repository) CheckStudentLessonAccess(ctx context.Context, userID int, lessonID int) error {
	if err := checkLessonExists(ctx, r.db, lessonID); err != nil {
		return err
	}

	var hasAccess bool
	query := `
		SELECT EXISTS (
			SELECT 1
			FROM lessons l
			JOIN modules m ON l.module_id = m.id
			JOIN courses c ON m.course_id = c.id
			JOIN enrollments e ON c.id = e.course_id
			WHERE l.id = $1 AND e.user_id = $2 AND c.is_published = true
		)
	`

	err := r.db.QueryRow(ctx, query, lessonID, userID).Scan(&hasAccess)
	if err != nil {
		slog.Error("Check student lesson access error", "error", err)
		return fmt.Errorf("student lesson access check error: %w", err)
	}

	if !hasAccess {
		return ErrAccessDenied
	}

	return nil
}

func (r *Repository) GetStudentQuestionsByLessonID(ctx context.Context, lessonID int) (LessonQuestionsResponse, error) {
	query := `
		SELECT id, lesson_id, question_text, order_num
		FROM lesson_questions
		WHERE lesson_id = $1
		ORDER BY order_num ASC, id ASC
	`
	rows, err := r.db.Query(ctx, query, lessonID)
	if err != nil {
		slog.Error("GetStudentQuestions query error", "error", err)
		return LessonQuestionsResponse{}, fmt.Errorf("student questions query error: %w", err)
	}
	defer rows.Close()

	response := LessonQuestionsResponse{
		Questions: make([]StudentQuestionResponse, 0),
	}
	for rows.Next() {
		var question StudentQuestionResponse
		err := rows.Scan(&question.ID, &question.LessonID, &question.QuestionText, &question.OrderNum)
		if err != nil {
			slog.Error("GetStudentQuestions scan error", "error", err)
			return LessonQuestionsResponse{}, fmt.Errorf("student question scan error: %w", err)
		}

		options, err := r.getStudentOptionsByQuestionID(ctx, question.ID)
		if err != nil {
			return LessonQuestionsResponse{}, err
		}

		question.Options = options
		response.Questions = append(response.Questions, question)
	}

	if err := rows.Err(); err != nil {
		return LessonQuestionsResponse{}, fmt.Errorf("student questions rows error: %w", err)
	}

	return response, nil
}

func (r *Repository) CheckQuestionExists(ctx context.Context, questionID int) error {
	var id int
	query := `SELECT id FROM lesson_questions WHERE id = $1`

	err := r.db.QueryRow(ctx, query, questionID).Scan(&id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrQuestionNotFound
		}
		slog.Error("Check question exists error", "error", err)
		return fmt.Errorf("question check error: %w", err)
	}

	return nil
}

func (r *Repository) CheckStudentQuestionAccess(ctx context.Context, userID int, questionID int) error {
	var hasAccess bool
	query := `
		SELECT EXISTS (
			SELECT 1
			FROM lesson_questions q
			JOIN lessons l ON q.lesson_id = l.id
			JOIN modules m ON l.module_id = m.id
			JOIN courses c ON m.course_id = c.id
			JOIN enrollments e ON c.id = e.course_id
			WHERE q.id = $1 AND e.user_id = $2 AND c.is_published = true
		)
	`

	err := r.db.QueryRow(ctx, query, questionID, userID).Scan(&hasAccess)
	if err != nil {
		slog.Error("Check student question access error", "error", err)
		return fmt.Errorf("student question access check error: %w", err)
	}

	if !hasAccess {
		return ErrAccessDenied
	}

	return nil
}

func (r *Repository) GetOptionCorrectness(ctx context.Context, questionID int, optionID int) (bool, error) {
	var isCorrect bool
	query := `
		SELECT is_correct
		FROM lesson_question_options
		WHERE id = $1 AND question_id = $2
	`

	err := r.db.QueryRow(ctx, query, optionID, questionID).Scan(&isCorrect)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			if exists, existsErr := r.optionExists(ctx, optionID); existsErr != nil {
				return false, existsErr
			} else if exists {
				return false, ErrInvalidAnswer
			}

			return false, ErrOptionNotFound
		}
		slog.Error("Get option correctness error", "error", err)
		return false, fmt.Errorf("option correctness query error: %w", err)
	}

	return isCorrect, nil
}

func (r *Repository) GetCorrectOptionID(ctx context.Context, questionID int) (int, error) {
	var optionID int
	query := `
		SELECT id
		FROM lesson_question_options
		WHERE question_id = $1 AND is_correct = true
	`

	err := r.db.QueryRow(ctx, query, questionID).Scan(&optionID)
	if err != nil {
		slog.Error("Get correct option ID error", "error", err)
		return 0, fmt.Errorf("correct option query error: %w", err)
	}

	return optionID, nil
}

func (r *Repository) getOptionsByQuestionID(ctx context.Context, questionID int) ([]Option, error) {
	query := `
		SELECT id, question_id, option_text, is_correct, order_num
		FROM lesson_question_options
		WHERE question_id = $1
		ORDER BY order_num ASC, id ASC
	`
	rows, err := r.db.Query(ctx, query, questionID)
	if err != nil {
		slog.Error("GetQuestionOptions query error", "error", err)
		return nil, fmt.Errorf("question options query error: %w", err)
	}
	defer rows.Close()

	options := make([]Option, 0)
	for rows.Next() {
		var option Option
		err := rows.Scan(&option.ID, &option.QuestionID, &option.OptionText, &option.IsCorrect, &option.OrderNum)
		if err != nil {
			slog.Error("GetQuestionOptions scan error", "error", err)
			return nil, fmt.Errorf("question option scan error: %w", err)
		}
		options = append(options, option)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("question options rows error: %w", err)
	}

	return options, nil
}

func (r *Repository) getStudentOptionsByQuestionID(ctx context.Context, questionID int) ([]StudentOptionResponse, error) {
	query := `
		SELECT id, question_id, option_text, order_num
		FROM lesson_question_options
		WHERE question_id = $1
		ORDER BY order_num ASC, id ASC
	`
	rows, err := r.db.Query(ctx, query, questionID)
	if err != nil {
		slog.Error("GetStudentQuestionOptions query error", "error", err)
		return nil, fmt.Errorf("student question options query error: %w", err)
	}
	defer rows.Close()

	options := make([]StudentOptionResponse, 0)
	for rows.Next() {
		var option StudentOptionResponse
		err := rows.Scan(&option.ID, &option.QuestionID, &option.OptionText, &option.OrderNum)
		if err != nil {
			slog.Error("GetStudentQuestionOptions scan error", "error", err)
			return nil, fmt.Errorf("student question option scan error: %w", err)
		}
		options = append(options, option)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("student question options rows error: %w", err)
	}

	return options, nil
}

func (r *Repository) optionExists(ctx context.Context, optionID int) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM lesson_question_options WHERE id = $1)`

	err := r.db.QueryRow(ctx, query, optionID).Scan(&exists)
	if err != nil {
		slog.Error("Check option exists error", "error", err)
		return false, fmt.Errorf("option check error: %w", err)
	}

	return exists, nil
}

type lessonChecker interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

func checkLessonExists(ctx context.Context, db lessonChecker, lessonID int) error {
	var id int

	query := `SELECT id FROM lessons WHERE id = $1`
	err := db.QueryRow(ctx, query, lessonID).Scan(&id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrLessonNotFound
		}
		slog.Error("Check lesson exists error", "error", err)
		return fmt.Errorf("lesson check error: %w", err)
	}

	return nil
}
