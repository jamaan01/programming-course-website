package courseCore

import "context"

type CourseService interface {
	GetAllCourses(ctx context.Context) ([]Course, error)
	GetCourseByID(ctx context.Context, id int) (Course, error)
	GetCourseSyllabus(ctx context.Context, id int) (Course, error)
	EnrollUser(ctx context.Context, userID int, courseID int) error
}

type Service struct {
	repo CourseRepository
}

func NewService(repo CourseRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetAllCourses(ctx context.Context) ([]Course, error) {
	return s.repo.GetAllCourses(ctx)
}

func (s *Service) GetCourseByID(ctx context.Context, id int) (Course, error) {
	return s.repo.GetCourseByID(ctx, id)
}

func (s *Service) GetCourseSyllabus(ctx context.Context, id int) (Course, error) {
	return s.repo.GetCourseSyllabus(ctx, id)
}

func (s *Service) EnrollUser(ctx context.Context, userID int, courseID int) error {
	return s.repo.EnrollUser(ctx, userID, courseID)
}
