package lessonCore

import (
	"context"
	"errors"
	"testing"
)

type fakeLessonRepo struct {
	lesson      Lesson
	lessonErr   error
	accessErr   error
	progressErr error
	completed   []int

	userID      int
	lessonID    int
	courseID    int
	isCompleted bool
}

func (r *fakeLessonRepo) GetLessonByID(ctx context.Context, id int) (Lesson, error) {
	r.lessonID = id
	return r.lesson, r.lessonErr
}

func (r *fakeLessonRepo) CheckAccess(ctx context.Context, userID int, lessonID int) error {
	r.userID = userID
	r.lessonID = lessonID
	return r.accessErr
}

func (r *fakeLessonRepo) UpdateLessonProgress(ctx context.Context, userID int, lessonID int, isCompleted bool) error {
	r.userID = userID
	r.lessonID = lessonID
	r.isCompleted = isCompleted
	return r.progressErr
}

func (r *fakeLessonRepo) GetCompletedLesson(ctx context.Context, userID int, courseID int) ([]int, error) {
	r.userID = userID
	r.courseID = courseID
	return r.completed, r.progressErr
}

func TestLessonServiceGetLessonByIDSuccess(t *testing.T) {
	repo := &fakeLessonRepo{
		lesson: Lesson{ID: 3, Title: "Intro"},
	}
	service := NewService(repo)

	lesson, err := service.GetLessonByID(context.Background(), 3, 7)
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if lesson.ID != 3 || repo.userID != 7 || repo.lessonID != 3 {
		t.Fatalf("unexpected lesson or ids: lesson=%+v repo=%+v", lesson, repo)
	}
}

func TestLessonServiceGetLessonByIDStopsOnAccessError(t *testing.T) {
	accessErr := errors.New("access denied")
	repo := &fakeLessonRepo{
		lesson:    Lesson{ID: 3, Title: "Intro"},
		accessErr: accessErr,
	}
	service := NewService(repo)

	_, err := service.GetLessonByID(context.Background(), 3, 7)
	if !errors.Is(err, accessErr) {
		t.Fatalf("expected access error, got %v", err)
	}
}

func TestLessonServiceUpdateLessonProgress(t *testing.T) {
	repo := &fakeLessonRepo{}
	service := NewService(repo)

	err := service.UpdateLessonProgress(context.Background(), 7, 3, true)
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if repo.userID != 7 || repo.lessonID != 3 || !repo.isCompleted {
		t.Fatalf("unexpected progress data: %+v", repo)
	}
}

func TestLessonServiceGetCompleteLesson(t *testing.T) {
	repo := &fakeLessonRepo{completed: []int{1, 2, 3}}
	service := NewService(repo)

	completed, err := service.GetCompleteLesson(context.Background(), 7, 4)
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if len(completed) != 3 || repo.userID != 7 || repo.courseID != 4 {
		t.Fatalf("unexpected completed lessons: %+v repo=%+v", completed, repo)
	}
}
