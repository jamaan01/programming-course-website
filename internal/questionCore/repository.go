package questionCore

import (
	"context"
	"database/sql"
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
	UpdateQuestion(ctx context.Context, questionID int, questionText string) error
	UpdateQuestionOption(ctx context.Context, optionID int, optionText string) error
	CreateQuestionOption(ctx context.Context, questionID int, optionText string) (Option, error)
	DeleteQuestionOption(ctx context.Context, optionID int) error
	UpdateQuestionCorrectOption(ctx context.Context, questionID int, optionID int) error
	QuestionOrderExists(ctx context.Context, lessonID int, orderNum int) (bool, error)
	CheckStudentLessonAccess(ctx context.Context, userID int, lessonID int, userRole string) error
	GetStudentQuestionsByLessonID(ctx context.Context, userID int, lessonID int) (LessonQuestionsResponse, error)
	CheckQuestionExists(ctx context.Context, questionID int) error
	CheckStudentQuestionAccess(ctx context.Context, userID int, questionID int, userRole string) error
	GetOptionCorrectness(ctx context.Context, questionID int, optionID int) (bool, error)
	SaveQuestionAttempt(ctx context.Context, userID int, questionID int, selectedOptionID int, isCorrect bool) (QuestionUserAnswer, error)
	GetQuestionLessonID(ctx context.Context, questionID int) (int, error)
	AreAllLessonQuestionsCorrect(ctx context.Context, userID int, lessonID int) (bool, error)
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

func (r *Repository) UpdateQuestion(ctx context.Context, questionID int, questionText string) error {
	query := `UPDATE lesson_questions SET question_text = $1 WHERE id = $2`

	commandTag, err := r.db.Exec(ctx, query, questionText, questionID)
	if err != nil {
		slog.Error("UpdateQuestion error", "error", err)
		return fmt.Errorf("question update error: %w", err)
	}

	if commandTag.RowsAffected() == 0 {
		return ErrQuestionNotFound
	}

	return nil
}

func (r *Repository) UpdateQuestionOption(ctx context.Context, optionID int, optionText string) error {
	query := `UPDATE lesson_question_options SET option_text = $1 WHERE id = $2`

	commandTag, err := r.db.Exec(ctx, query, optionText, optionID)
	if err != nil {
		slog.Error("UpdateQuestionOption error", "error", err)
		return fmt.Errorf("question option update error: %w", err)
	}

	if commandTag.RowsAffected() == 0 {
		return ErrOptionNotFound
	}

	return nil
}

func (r *Repository) CreateQuestionOption(ctx context.Context, questionID int, optionText string) (Option, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		slog.Error("CreateQuestionOption begin transaction error", "error", err)
		return Option{}, fmt.Errorf("question option transaction begin error: %w", err)
	}
	defer tx.Rollback(ctx)

	if err := checkQuestionExists(ctx, tx, questionID); err != nil {
		return Option{}, err
	}

	var orderNum int
	orderQuery := `
		SELECT COALESCE(MAX(order_num), 0) + 1
		FROM lesson_question_options
		WHERE question_id = $1
	`
	if err := tx.QueryRow(ctx, orderQuery, questionID).Scan(&orderNum); err != nil {
		slog.Error("CreateQuestionOption order query error", "error", err)
		return Option{}, fmt.Errorf("question option order query error: %w", err)
	}

	var option Option
	insertQuery := `
		INSERT INTO lesson_question_options (question_id, option_text, is_correct, order_num)
		VALUES ($1, $2, false, $3)
		RETURNING id, question_id, option_text, is_correct, order_num
	`
	err = tx.QueryRow(ctx, insertQuery, questionID, optionText, orderNum).Scan(
		&option.ID,
		&option.QuestionID,
		&option.OptionText,
		&option.IsCorrect,
		&option.OrderNum,
	)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
			return Option{}, ErrDuplicateOrderNum
		}
		slog.Error("CreateQuestionOption insert error", "error", err)
		return Option{}, fmt.Errorf("question option create error: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		slog.Error("CreateQuestionOption commit error", "error", err)
		return Option{}, fmt.Errorf("question option transaction commit error: %w", err)
	}

	return option, nil
}

func (r *Repository) DeleteQuestionOption(ctx context.Context, optionID int) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		slog.Error("DeleteQuestionOption begin transaction error", "error", err)
		return fmt.Errorf("question option delete transaction begin error: %w", err)
	}
	defer tx.Rollback(ctx)

	var questionID int
	var isCorrect bool
	optionQuery := `
		SELECT question_id, is_correct
		FROM lesson_question_options
		WHERE id = $1
		FOR UPDATE
	`
	if err := tx.QueryRow(ctx, optionQuery, optionID).Scan(&questionID, &isCorrect); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrOptionNotFound
		}
		slog.Error("DeleteQuestionOption option query error", "error", err)
		return fmt.Errorf("question option delete check error: %w", err)
	}

	if isCorrect {
		return ErrCannotDeleteCorrectOption
	}

	rows, err := tx.Query(ctx, `SELECT id FROM lesson_question_options WHERE question_id = $1 FOR UPDATE`, questionID)
	if err != nil {
		slog.Error("DeleteQuestionOption option count query error", "error", err)
		return fmt.Errorf("question option count query error: %w", err)
	}

	optionCount := 0
	for rows.Next() {
		optionCount++
	}
	if rowsErr := rows.Err(); rowsErr != nil {
		rows.Close()
		return fmt.Errorf("question option count rows error: %w", rowsErr)
	}
	rows.Close()

	if optionCount <= 2 {
		return ErrCannotDeleteLastOptions
	}

	commandTag, err := tx.Exec(ctx, `DELETE FROM lesson_question_options WHERE id = $1`, optionID)
	if err != nil {
		slog.Error("DeleteQuestionOption delete error", "error", err)
		return fmt.Errorf("question option delete error: %w", err)
	}

	if commandTag.RowsAffected() == 0 {
		return ErrOptionNotFound
	}

	if err := tx.Commit(ctx); err != nil {
		slog.Error("DeleteQuestionOption commit error", "error", err)
		return fmt.Errorf("question option delete transaction commit error: %w", err)
	}

	return nil
}

func (r *Repository) UpdateQuestionCorrectOption(ctx context.Context, questionID int, optionID int) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		slog.Error("UpdateQuestionCorrectOption begin transaction error", "error", err)
		return fmt.Errorf("correct option transaction begin error: %w", err)
	}
	defer tx.Rollback(ctx)

	if err := checkQuestionExists(ctx, tx, questionID); err != nil {
		return err
	}

	var optionQuestionID int
	optionQuery := `SELECT question_id FROM lesson_question_options WHERE id = $1`
	if err := tx.QueryRow(ctx, optionQuery, optionID).Scan(&optionQuestionID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrOptionNotFound
		}
		slog.Error("UpdateQuestionCorrectOption option check error", "error", err)
		return fmt.Errorf("correct option check error: %w", err)
	}

	if optionQuestionID != questionID {
		return ErrInvalidAnswer
	}

	resetQuery := `UPDATE lesson_question_options SET is_correct = false WHERE question_id = $1`
	if _, err := tx.Exec(ctx, resetQuery, questionID); err != nil {
		slog.Error("UpdateQuestionCorrectOption reset error", "error", err)
		return fmt.Errorf("correct option reset error: %w", err)
	}

	setQuery := `UPDATE lesson_question_options SET is_correct = true WHERE id = $1 AND question_id = $2`
	commandTag, err := tx.Exec(ctx, setQuery, optionID, questionID)
	if err != nil {
		slog.Error("UpdateQuestionCorrectOption set error", "error", err)
		return fmt.Errorf("correct option set error: %w", err)
	}

	if commandTag.RowsAffected() == 0 {
		return ErrOptionNotFound
	}

	if err := tx.Commit(ctx); err != nil {
		slog.Error("UpdateQuestionCorrectOption commit error", "error", err)
		return fmt.Errorf("correct option transaction commit error: %w", err)
	}

	return nil
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
		slog.Error("Check student lesson access error", "error", err)
		return fmt.Errorf("student lesson access check error: %w", err)
	}

	if !hasAccess {
		return ErrAccessDenied
	}

	return nil
}

func (r *Repository) GetStudentQuestionsByLessonID(ctx context.Context, userID int, lessonID int) (LessonQuestionsResponse, error) {
	query := `
		SELECT q.id, q.lesson_id, q.question_text, q.order_num, a.selected_option_id, a.is_correct
		FROM lesson_questions q
		LEFT JOIN lesson_question_attempts a ON a.question_id = q.id AND a.user_id = $2
		WHERE q.lesson_id = $1
		ORDER BY q.order_num ASC, q.id ASC
	`
	rows, err := r.db.Query(ctx, query, lessonID, userID)
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
		var selectedOptionID sql.NullInt64
		var isCorrect sql.NullBool

		err := rows.Scan(
			&question.ID,
			&question.LessonID,
			&question.QuestionText,
			&question.OrderNum,
			&selectedOptionID,
			&isCorrect,
		)
		if err != nil {
			slog.Error("GetStudentQuestions scan error", "error", err)
			return LessonQuestionsResponse{}, fmt.Errorf("student question scan error: %w", err)
		}

		if selectedOptionID.Valid && isCorrect.Valid {
			question.UserAnswer = &QuestionUserAnswer{
				SelectedOptionID: int(selectedOptionID.Int64),
				IsCorrect:        isCorrect.Bool,
			}
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

	allQuestionsCorrect, err := r.AreAllLessonQuestionsCorrect(ctx, userID, lessonID)
	if err != nil {
		return LessonQuestionsResponse{}, err
	}
	response.AllQuestionsCorrect = allQuestionsCorrect

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

func (r *Repository) CheckStudentQuestionAccess(ctx context.Context, userID int, questionID int, userRole string) error {
	if userRole == "admin" {
		return nil
	}

	var hasAccess bool
	query := `
		SELECT EXISTS (
			SELECT 1
			FROM lesson_questions q
			JOIN lessons l ON q.lesson_id = l.id
			JOIN modules m ON l.module_id = m.id
			JOIN courses c ON m.course_id = c.id
			JOIN course_access ca ON c.id = ca.course_id
			WHERE q.id = $1
				AND ca.user_id = $2
				AND ca.is_active = true
				AND c.is_published = true
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

func (r *Repository) SaveQuestionAttempt(ctx context.Context, userID int, questionID int, selectedOptionID int, isCorrect bool) (QuestionUserAnswer, error) {
	var savedAnswer QuestionUserAnswer
	query := `
		INSERT INTO lesson_question_attempts (
			user_id,
			question_id,
			selected_option_id,
			is_correct,
			answered_at
		)
		VALUES ($1, $2, $3, $4, NOW())
		ON CONFLICT (user_id, question_id)
		DO UPDATE SET
			selected_option_id = CASE
				WHEN lesson_question_attempts.is_correct = true
				THEN lesson_question_attempts.selected_option_id
				ELSE EXCLUDED.selected_option_id
			END,
			is_correct = lesson_question_attempts.is_correct OR EXCLUDED.is_correct,
			answered_at = CASE
				WHEN lesson_question_attempts.is_correct = true
				THEN lesson_question_attempts.answered_at
				ELSE EXCLUDED.answered_at
			END
		RETURNING selected_option_id, is_correct
	`

	err := r.db.QueryRow(ctx, query, userID, questionID, selectedOptionID, isCorrect).Scan(
		&savedAnswer.SelectedOptionID,
		&savedAnswer.IsCorrect,
	)
	if err != nil {
		slog.Error("Save question attempt error", "error", err)
		return QuestionUserAnswer{}, fmt.Errorf("question attempt save error: %w", err)
	}

	return savedAnswer, nil
}

func (r *Repository) GetQuestionLessonID(ctx context.Context, questionID int) (int, error) {
	var lessonID int
	query := `SELECT lesson_id FROM lesson_questions WHERE id = $1`

	err := r.db.QueryRow(ctx, query, questionID).Scan(&lessonID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, ErrQuestionNotFound
		}
		slog.Error("Get question lesson ID error", "error", err)
		return 0, fmt.Errorf("question lesson query error: %w", err)
	}

	return lessonID, nil
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
		slog.Error("Check all lesson questions correct error", "error", err)
		return false, fmt.Errorf("lesson questions correctness check error: %w", err)
	}

	return allQuestionsCorrect, nil
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

type questionChecker interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

func checkQuestionExists(ctx context.Context, db questionChecker, questionID int) error {
	var id int

	query := `SELECT id FROM lesson_questions WHERE id = $1`
	err := db.QueryRow(ctx, query, questionID).Scan(&id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrQuestionNotFound
		}
		slog.Error("Check question exists error", "error", err)
		return fmt.Errorf("question check error: %w", err)
	}

	return nil
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
