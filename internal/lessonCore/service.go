package lessonCore

import (
	"context"
	"log/slog"
)

type LessonService interface {
	GetLessonByID(ctx context.Context, lessonID int, userID int) (Lesson, error)
}

type Service struct {
	repo LessonRepository
}

func NewService(repo LessonRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetLessonByID(ctx context.Context, lessonID int, userID int) (Lesson, error) {
	err := s.repo.CheckAccess(ctx, userID, lessonID)
	if err != nil {
		slog.Error("Check access error", "error", err)
		return Lesson{}, err
	}

	return s.repo.GetLessonByID(ctx, lessonID)
}
