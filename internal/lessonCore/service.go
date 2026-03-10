package lessonCore

import "context"

type LessonService interface {
	GetLessonByID(ctx context.Context, id int) (Lesson, error)
}

type Service struct {
	repo LessonRepository
}

func NewService(repo LessonRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetLessonByID(ctx context.Context, id int) (Lesson, error) {
	return s.repo.GetLessonByID(ctx, id)
}
