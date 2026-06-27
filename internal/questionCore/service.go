package questionCore

import (
	"context"
	"errors"
	"strings"
)

var ErrInvalidQuestion = errors.New("invalid question")
var ErrInvalidID = errors.New("invalid id")
var ErrInvalidAnswer = errors.New("invalid answer")
var ErrLessonNotFound = errors.New("lesson not found")
var ErrQuestionNotFound = errors.New("question not found")
var ErrOptionNotFound = errors.New("option not found")
var ErrAccessDenied = errors.New("access denied")
var ErrDuplicateOrderNum = errors.New("duplicate order num")
var ErrCannotDeleteCorrectOption = errors.New("cannot delete correct option")
var ErrCannotDeleteLastOptions = errors.New("cannot delete last options")

type QuestionService interface {
	CreateQuestion(ctx context.Context, lessonID int, req CreateQuestionRequest) (int, error)
	GetQuestionsByLessonID(ctx context.Context, lessonID int) ([]Question, error)
	UpdateQuestion(ctx context.Context, questionID int, req UpdateQuestionRequest) error
	UpdateQuestionOption(ctx context.Context, optionID int, req UpdateQuestionOptionRequest) error
	CreateQuestionOption(ctx context.Context, questionID int, req CreateQuestionOptionRequest) (Option, error)
	DeleteQuestionOption(ctx context.Context, optionID int) error
	UpdateQuestionCorrectOption(ctx context.Context, questionID int, req UpdateQuestionCorrectOptionRequest) error
	GetStudentQuestionsByLessonID(ctx context.Context, userID int, lessonID int, userRole string) (LessonQuestionsResponse, error)
	SubmitAnswer(ctx context.Context, userID int, questionID int, req SubmitAnswerRequest, userRole string) (SubmitAnswerResponse, error)
}

type Service struct {
	repo QuestionRepository
}

func NewService(repo QuestionRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) CreateQuestion(ctx context.Context, lessonID int, req CreateQuestionRequest) (int, error) {
	if strings.TrimSpace(req.QuestionText) == "" {
		return 0, ErrInvalidQuestion
	}

	if len(req.Options) < 2 {
		return 0, ErrInvalidQuestion
	}

	correctCount := 0
	optionOrders := make(map[int]bool)
	for _, option := range req.Options {
		if strings.TrimSpace(option.OptionText) == "" {
			return 0, ErrInvalidQuestion
		}

		if optionOrders[option.OrderNum] {
			return 0, ErrDuplicateOrderNum
		}
		optionOrders[option.OrderNum] = true

		if option.IsCorrect {
			correctCount++
		}
	}

	if correctCount != 1 {
		return 0, ErrInvalidQuestion
	}

	exists, err := s.repo.QuestionOrderExists(ctx, lessonID, req.OrderNum)
	if err != nil {
		return 0, err
	}

	if exists {
		return 0, ErrDuplicateOrderNum
	}

	return s.repo.CreateQuestion(ctx, lessonID, req)
}

func (s *Service) GetQuestionsByLessonID(ctx context.Context, lessonID int) ([]Question, error) {
	return s.repo.GetQuestionsByLessonID(ctx, lessonID)
}

func (s *Service) UpdateQuestion(ctx context.Context, questionID int, req UpdateQuestionRequest) error {
	questionText := strings.TrimSpace(req.QuestionText)
	if questionID <= 0 || questionText == "" {
		return ErrInvalidQuestion
	}

	return s.repo.UpdateQuestion(ctx, questionID, questionText)
}

func (s *Service) UpdateQuestionOption(ctx context.Context, optionID int, req UpdateQuestionOptionRequest) error {
	optionText := strings.TrimSpace(req.OptionText)
	if optionID <= 0 || optionText == "" {
		return ErrInvalidQuestion
	}

	return s.repo.UpdateQuestionOption(ctx, optionID, optionText)
}

func (s *Service) CreateQuestionOption(ctx context.Context, questionID int, req CreateQuestionOptionRequest) (Option, error) {
	optionText := strings.TrimSpace(req.OptionText)
	if questionID <= 0 || optionText == "" {
		return Option{}, ErrInvalidQuestion
	}

	return s.repo.CreateQuestionOption(ctx, questionID, optionText)
}

func (s *Service) DeleteQuestionOption(ctx context.Context, optionID int) error {
	if optionID <= 0 {
		return ErrInvalidID
	}

	return s.repo.DeleteQuestionOption(ctx, optionID)
}

func (s *Service) UpdateQuestionCorrectOption(ctx context.Context, questionID int, req UpdateQuestionCorrectOptionRequest) error {
	if questionID <= 0 || req.OptionID <= 0 {
		return ErrInvalidAnswer
	}

	return s.repo.UpdateQuestionCorrectOption(ctx, questionID, req.OptionID)
}

func (s *Service) GetStudentQuestionsByLessonID(ctx context.Context, userID int, lessonID int, userRole string) (LessonQuestionsResponse, error) {
	if userID <= 0 || lessonID <= 0 {
		return LessonQuestionsResponse{}, ErrInvalidID
	}

	if err := s.repo.CheckStudentLessonAccess(ctx, userID, lessonID, userRole); err != nil {
		return LessonQuestionsResponse{}, err
	}

	return s.repo.GetStudentQuestionsByLessonID(ctx, userID, lessonID)
}

func (s *Service) SubmitAnswer(ctx context.Context, userID int, questionID int, req SubmitAnswerRequest, userRole string) (SubmitAnswerResponse, error) {
	if userID <= 0 || questionID <= 0 {
		return SubmitAnswerResponse{}, ErrInvalidID
	}

	if req.OptionID <= 0 {
		return SubmitAnswerResponse{}, ErrInvalidAnswer
	}

	if err := s.repo.CheckQuestionExists(ctx, questionID); err != nil {
		return SubmitAnswerResponse{}, err
	}

	if err := s.repo.CheckStudentQuestionAccess(ctx, userID, questionID, userRole); err != nil {
		return SubmitAnswerResponse{}, err
	}

	isCorrect, err := s.repo.GetOptionCorrectness(ctx, questionID, req.OptionID)
	if err != nil {
		return SubmitAnswerResponse{}, err
	}

	savedAnswer, err := s.repo.SaveQuestionAttempt(ctx, userID, questionID, req.OptionID, isCorrect)
	if err != nil {
		return SubmitAnswerResponse{}, err
	}

	lessonID, err := s.repo.GetQuestionLessonID(ctx, questionID)
	if err != nil {
		return SubmitAnswerResponse{}, err
	}

	allQuestionsCorrect, err := s.repo.AreAllLessonQuestionsCorrect(ctx, userID, lessonID)
	if err != nil {
		return SubmitAnswerResponse{}, err
	}

	return SubmitAnswerResponse{
		QuestionID:          questionID,
		SelectedOptionID:    savedAnswer.SelectedOptionID,
		IsCorrect:           savedAnswer.IsCorrect,
		AllQuestionsCorrect: allQuestionsCorrect,
	}, nil
}
