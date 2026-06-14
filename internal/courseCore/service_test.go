package courseCore

import (
	"context"
	"errors"
	"testing"
)

type fakeCourseRepo struct {
	courses []Course
	course  Course
	err     error

	createCourseID int
	createModuleID int
	createLessonID int

	title       string
	description string
	courseID    int
	moduleID    int
	content     string
	orderNum    int
	userID      int
}

func (r *fakeCourseRepo) GetAllCourses(ctx context.Context) ([]Course, error) {
	return r.courses, r.err
}

func (r *fakeCourseRepo) GetCourseByID(ctx context.Context, id int) (Course, error) {
	r.courseID = id
	return r.course, r.err
}

func (r *fakeCourseRepo) GetCourseSyllabus(ctx context.Context, id int) (Course, error) {
	r.courseID = id
	return r.course, r.err
}

func (r *fakeCourseRepo) EnrollUser(ctx context.Context, userID int, courseID int) error {
	r.userID = userID
	r.courseID = courseID
	return r.err
}

func (r *fakeCourseRepo) GetCoursesByUserID(ctx context.Context, userID int) ([]Course, error) {
	r.userID = userID
	return r.courses, r.err
}

func (r *fakeCourseRepo) CreateCourse(ctx context.Context, title, description string) (int, error) {
	r.title = title
	r.description = description
	return r.createCourseID, r.err
}

func (r *fakeCourseRepo) CreateModule(ctx context.Context, courseID int, title string, orderNum int) (int, error) {
	r.courseID = courseID
	r.title = title
	r.orderNum = orderNum
	return r.createModuleID, r.err
}

func (r *fakeCourseRepo) CreateLesson(ctx context.Context, moduleID int, title string, content string, orderNum int) (int, error) {
	r.moduleID = moduleID
	r.title = title
	r.content = content
	r.orderNum = orderNum
	return r.createLessonID, r.err
}

func (r *fakeCourseRepo) DeleteCourse(ctx context.Context, id int) error {
	r.courseID = id
	return r.err
}

func (r *fakeCourseRepo) DeleteLesson(ctx context.Context, id int) error {
	r.moduleID = id
	return r.err
}

func TestCourseServiceGetAllCourses(t *testing.T) {
	repo := &fakeCourseRepo{
		courses: []Course{{ID: 1, Title: "Go"}},
	}
	service := NewService(repo)

	courses, err := service.GetAllCourses(context.Background())
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if len(courses) != 1 || courses[0].Title != "Go" {
		t.Fatalf("unexpected courses: %+v", courses)
	}
}

func TestCourseServiceReturnsRepositoryError(t *testing.T) {
	repoErr := errors.New("repo error")
	repo := &fakeCourseRepo{err: repoErr}
	service := NewService(repo)

	_, err := service.GetCourseByID(context.Background(), 5)
	if !errors.Is(err, repoErr) {
		t.Fatalf("expected repo error, got %v", err)
	}
}

func TestCourseServiceCreateCoursePassesDataToRepo(t *testing.T) {
	repo := &fakeCourseRepo{createCourseID: 11}
	service := NewService(repo)

	id, err := service.CreateCourse(context.Background(), CreateCourseRequest{
		Title:       "Go Basic",
		Description: "Start course",
	})
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if id != 11 {
		t.Fatalf("expected id 11, got %d", id)
	}
	if repo.title != "Go Basic" || repo.description != "Start course" {
		t.Fatalf("unexpected repo data: %s %s", repo.title, repo.description)
	}
}

func TestCourseServiceCreateModulePassesDataToRepo(t *testing.T) {
	repo := &fakeCourseRepo{createModuleID: 12}
	service := NewService(repo)

	id, err := service.CreateModule(context.Background(), 3, CreateModuleRequest{
		Title:    "Intro",
		OrderNum: 2,
	})
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if id != 12 || repo.courseID != 3 || repo.title != "Intro" || repo.orderNum != 2 {
		t.Fatalf("unexpected module data: id=%d repo=%+v", id, repo)
	}
}

func TestCourseServiceCreateLessonPassesDataToRepo(t *testing.T) {
	repo := &fakeCourseRepo{createLessonID: 13}
	service := NewService(repo)

	id, err := service.CreateLesson(context.Background(), 4, CreateLessonRequest{
		Title:    "Syntax",
		Content:  "package main",
		OrderNum: 1,
	})
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if id != 13 || repo.moduleID != 4 || repo.title != "Syntax" || repo.content != "package main" {
		t.Fatalf("unexpected lesson data: id=%d repo=%+v", id, repo)
	}
}

func TestCourseServiceEnrollUserPassesIDsToRepo(t *testing.T) {
	repo := &fakeCourseRepo{}
	service := NewService(repo)

	err := service.EnrollUser(context.Background(), 2, 9)
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if repo.userID != 2 || repo.courseID != 9 {
		t.Fatalf("unexpected ids: user=%d course=%d", repo.userID, repo.courseID)
	}
}
