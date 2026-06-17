package questionCore

import (
	"context"
	"errors"
	"strings"
)

var ErrInvalidQuestion = errors.New("invalid question")
var ErrLessonNotFound = errors.New("lesson not found")
var ErrDuplicateOrderNum = errors.New("duplicate order num")

type QuestionService interface {
	CreateQuestion(ctx context.Context, lessonID int, req CreateQuestionRequest) (int, error)
	GetQuestionsByLessonID(ctx context.Context, lessonID int) ([]Question, error)
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
