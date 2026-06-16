package questionCore

import (
	"context"
	"errors"
	"strings"
)

var ErrInvalidQuestion = errors.New("invalid question")
var ErrLessonNotFound = errors.New("lesson not found")

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
	for _, option := range req.Options {
		if strings.TrimSpace(option.OptionText) == "" {
			return 0, ErrInvalidQuestion
		}

		if option.IsCorrect {
			correctCount++
		}
	}

	if correctCount != 1 {
		return 0, ErrInvalidQuestion
	}

	return s.repo.CreateQuestion(ctx, lessonID, req)
}

func (s *Service) GetQuestionsByLessonID(ctx context.Context, lessonID int) ([]Question, error) {
	return s.repo.GetQuestionsByLessonID(ctx, lessonID)
}
