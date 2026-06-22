package courseCore

import (
	"context"
	"strings"
)

type CourseService interface {
	GetAllCourses(ctx context.Context) ([]Course, error)
	GetCourseByID(ctx context.Context, id int) (Course, error)
	GetCourseSyllabus(ctx context.Context, id int) (Course, error)
	GetAllCoursesAdmin(ctx context.Context) ([]Course, error)
	GetCourseByIDAdmin(ctx context.Context, id int) (Course, error)
	GetCourseSyllabusAdmin(ctx context.Context, id int) (Course, error)
	UpdateCoursePublishStatus(ctx context.Context, id int, isPublished bool) error
	UpdateCourse(ctx context.Context, id int, req UpdateCourseRequest) error
	UpdateModule(ctx context.Context, id int, req UpdateModuleRequest) error
	UpdateLesson(ctx context.Context, id int, req UpdateLessonRequest) error
	EnrollUser(ctx context.Context, userID int, courseID int) error
	GetCoursesByUserID(ctx context.Context, userID int) ([]Course, error)
	CreateCourse(ctx context.Context, req CreateCourseRequest) (int, error)
	CreateModule(ctx context.Context, courseID int, req CreateModuleRequest) (int, error)
	CreateLesson(ctx context.Context, moduleID int, req CreateLessonRequest) (int, error)
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

func (s *Service) GetAllCoursesAdmin(ctx context.Context) ([]Course, error) {
	return s.repo.GetAllCoursesAdmin(ctx)
}

func (s *Service) GetCourseByIDAdmin(ctx context.Context, id int) (Course, error) {
	return s.repo.GetCourseByIDAdmin(ctx, id)
}

func (s *Service) GetCourseSyllabusAdmin(ctx context.Context, id int) (Course, error) {
	return s.repo.GetCourseSyllabusAdmin(ctx, id)
}

func (s *Service) UpdateCoursePublishStatus(ctx context.Context, id int, isPublished bool) error {
	return s.repo.UpdateCoursePublishStatus(ctx, id, isPublished)
}

func (s *Service) UpdateCourse(ctx context.Context, id int, req UpdateCourseRequest) error {
	title := strings.TrimSpace(req.Title)
	description := strings.TrimSpace(req.Description)
	if title == "" || description == "" {
		return ErrInvalidCourseContent
	}

	return s.repo.UpdateCourse(ctx, id, title, description)
}

func (s *Service) UpdateModule(ctx context.Context, id int, req UpdateModuleRequest) error {
	title := strings.TrimSpace(req.Title)
	if title == "" {
		return ErrInvalidCourseContent
	}

	return s.repo.UpdateModule(ctx, id, title)
}

func (s *Service) UpdateLesson(ctx context.Context, id int, req UpdateLessonRequest) error {
	title := strings.TrimSpace(req.Title)
	content := strings.TrimSpace(req.Content)
	if title == "" || content == "" {
		return ErrInvalidCourseContent
	}

	return s.repo.UpdateLesson(ctx, id, title, content)
}

func (s *Service) EnrollUser(ctx context.Context, userID int, courseID int) error {
	return s.repo.EnrollUser(ctx, userID, courseID)
}

func (s *Service) GetCoursesByUserID(ctx context.Context, userID int) ([]Course, error) {
	return s.repo.GetCoursesByUserID(ctx, userID)
}

func (s *Service) CreateCourse(ctx context.Context, req CreateCourseRequest) (int, error) {
	return s.repo.CreateCourse(ctx, req.Title, req.Description)
}

func (s *Service) CreateModule(ctx context.Context, courseID int, req CreateModuleRequest) (int, error) {
	exists, err := s.repo.ModuleOrderExists(ctx, courseID, req.OrderNum)
	if err != nil {
		return 0, err
	}

	if exists {
		return 0, ErrDuplicateOrderNum
	}

	return s.repo.CreateModule(ctx, courseID, req.Title, req.OrderNum)
}

func (s *Service) CreateLesson(ctx context.Context, moduleID int, req CreateLessonRequest) (int, error) {
	exists, err := s.repo.LessonOrderExists(ctx, moduleID, req.OrderNum)
	if err != nil {
		return 0, err
	}

	if exists {
		return 0, ErrDuplicateOrderNum
	}

	return s.repo.CreateLesson(ctx, moduleID, req.Title, req.Content, req.OrderNum)
}
