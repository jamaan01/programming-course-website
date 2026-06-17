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

type QuestionService interface {
	CreateQuestion(ctx context.Context, lessonID int, req CreateQuestionRequest) (int, error)
	GetQuestionsByLessonID(ctx context.Context, lessonID int) ([]Question, error)
	GetStudentQuestionsByLessonID(ctx context.Context, userID int, lessonID int) (LessonQuestionsResponse, error)
	SubmitAnswer(ctx context.Context, userID int, questionID int, req SubmitAnswerRequest) (SubmitAnswerResponse, error)
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

func (s *Service) GetStudentQuestionsByLessonID(ctx context.Context, userID int, lessonID int) (LessonQuestionsResponse, error) {
	if userID <= 0 || lessonID <= 0 {
		return LessonQuestionsResponse{}, ErrInvalidID
	}

	if err := s.repo.CheckStudentLessonAccess(ctx, userID, lessonID); err != nil {
		return LessonQuestionsResponse{}, err
	}

	return s.repo.GetStudentQuestionsByLessonID(ctx, lessonID)
}

func (s *Service) SubmitAnswer(ctx context.Context, userID int, questionID int, req SubmitAnswerRequest) (SubmitAnswerResponse, error) {
	if userID <= 0 || questionID <= 0 {
		return SubmitAnswerResponse{}, ErrInvalidID
	}

	if req.OptionID <= 0 {
		return SubmitAnswerResponse{}, ErrInvalidAnswer
	}

	if err := s.repo.CheckQuestionExists(ctx, questionID); err != nil {
		return SubmitAnswerResponse{}, err
	}

	if err := s.repo.CheckStudentQuestionAccess(ctx, userID, questionID); err != nil {
		return SubmitAnswerResponse{}, err
	}

	isCorrect, err := s.repo.GetOptionCorrectness(ctx, questionID, req.OptionID)
	if err != nil {
		return SubmitAnswerResponse{}, err
	}

	correctOptionID, err := s.repo.GetCorrectOptionID(ctx, questionID)
	if err != nil {
		return SubmitAnswerResponse{}, err
	}

	return SubmitAnswerResponse{
		QuestionID:       questionID,
		SelectedOptionID: req.OptionID,
		IsCorrect:        isCorrect,
		CorrectOptionID:  &correctOptionID,
	}, nil
}
