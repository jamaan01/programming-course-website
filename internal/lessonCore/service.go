package lessonCore

import (
	"context"
	"log/slog"
)

type LessonService interface {
	GetLessonByID(ctx context.Context, lessonID int, userID int) (Lesson, error)
	UpdateLessonProgress(ctx context.Context, userID int, lessonID int, isCompleted bool) error
	GetCompleteLesson(ctx context.Context, userID int, courseID int) ([]int, error)
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

func (s *Service) UpdateLessonProgress(ctx context.Context, userID int, lessonID int, isCompleted bool) error {
	err := s.repo.CheckAccess(ctx, userID, lessonID)
	if err != nil {
		slog.Error("Check access error", "error", err)
		return err
	}

	if isCompleted {
		allQuestionsCorrect, err := s.repo.AreAllLessonQuestionsCorrect(ctx, userID, lessonID)
		if err != nil {
			return err
		}

		if !allQuestionsCorrect {
			return ErrQuizNotComplete
		}
	}

	return s.repo.UpdateLessonProgress(ctx, userID, lessonID, isCompleted)
}

func (s *Service) GetCompleteLesson(ctx context.Context, userID int, courseID int) ([]int, error) {
	return s.repo.GetCompletedLesson(ctx, userID, courseID)
}
