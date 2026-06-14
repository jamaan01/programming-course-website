package handlers

import (
	"bytes"
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/jamaan01/kursovaia/internal/lessonCore"
)

type fakeLessonService struct {
	lesson    lessonCore.Lesson
	err       error
	completed []int

	userID      int
	lessonID    int
	courseID    int
	isCompleted bool
}

func (s *fakeLessonService) GetLessonByID(ctx context.Context, lessonID int, userID int) (lessonCore.Lesson, error) {
	s.lessonID = lessonID
	s.userID = userID
	return s.lesson, s.err
}

func (s *fakeLessonService) UpdateLessonProgress(ctx context.Context, userID int, lessonID int, isCompleted bool) error {
	s.userID = userID
	s.lessonID = lessonID
	s.isCompleted = isCompleted
	return s.err
}

func (s *fakeLessonService) GetCompleteLesson(ctx context.Context, userID int, courseID int) ([]int, error) {
	s.userID = userID
	s.courseID = courseID
	return s.completed, s.err
}

func TestLessonHandlerGetLessonByIDSuccess(t *testing.T) {
	service := &fakeLessonService{
		lesson: lessonCore.Lesson{ID: 3, Title: "Intro"},
	}
	handler := NewLessonHandler(service)
	r := newTestRouter()
	r.GET("/api/lessons/:id", func(c *gin.Context) {
		c.Set("userID", 9)
		handler.GetLessonByID(c)
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/lessons/3", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", w.Code, w.Body.String())
	}
	if service.lessonID != 3 || service.userID != 9 {
		t.Fatalf("unexpected ids: lesson=%d user=%d", service.lessonID, service.userID)
	}
}

func TestLessonHandlerGetLessonByIDRequiresAuthContext(t *testing.T) {
	handler := NewLessonHandler(&fakeLessonService{})
	r := newTestRouter()
	r.GET("/api/lessons/:id", handler.GetLessonByID)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/lessons/3", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", w.Code)
	}
}

func TestLessonHandlerGetLessonByIDBadID(t *testing.T) {
	handler := NewLessonHandler(&fakeLessonService{})
	r := newTestRouter()
	r.GET("/api/lessons/:id", handler.GetLessonByID)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/lessons/bad", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", w.Code)
	}
}

func TestLessonHandlerGetLessonByIDForbidden(t *testing.T) {
	service := &fakeLessonService{err: errors.New("доступ заборонено")}
	handler := NewLessonHandler(service)
	r := newTestRouter()
	r.GET("/api/lessons/:id", func(c *gin.Context) {
		c.Set("userID", 9)
		handler.GetLessonByID(c)
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/lessons/3", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected status 403, got %d", w.Code)
	}
}

func TestLessonHandlerCompleteLessonSuccess(t *testing.T) {
	service := &fakeLessonService{}
	handler := NewLessonHandler(service)
	r := newTestRouter()
	r.POST("/api/lessons/:id/complete", func(c *gin.Context) {
		c.Set("userID", 9)
		handler.CompleteLesson(c)
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/lessons/3/complete", bytes.NewBufferString(`{"completed":true}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", w.Code, w.Body.String())
	}
	if service.lessonID != 3 || service.userID != 9 || !service.isCompleted {
		t.Fatalf("unexpected progress data: %+v", service)
	}
}

func TestLessonHandlerCompleteLessonBadJSON(t *testing.T) {
	handler := NewLessonHandler(&fakeLessonService{})
	r := newTestRouter()
	r.POST("/api/lessons/:id/complete", func(c *gin.Context) {
		c.Set("userID", 9)
		handler.CompleteLesson(c)
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/lessons/3/complete", bytes.NewBufferString(`{"completed":`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", w.Code)
	}
}

func TestLessonHandlerCompleteLessonServiceError(t *testing.T) {
	service := &fakeLessonService{err: errors.New("db down")}
	handler := NewLessonHandler(service)
	r := newTestRouter()
	r.POST("/api/lessons/:id/complete", func(c *gin.Context) {
		c.Set("userID", 9)
		handler.CompleteLesson(c)
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/lessons/3/complete", bytes.NewBufferString(`{"completed":true}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d", w.Code)
	}
}

func TestLessonHandlerGetLessonProgressSuccess(t *testing.T) {
	service := &fakeLessonService{completed: []int{3, 4}}
	handler := NewLessonHandler(service)
	r := newTestRouter()
	r.GET("/api/courses/:id/progress", func(c *gin.Context) {
		c.Set("userID", 9)
		handler.GetLessonProgress(c)
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/courses/7/progress", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", w.Code, w.Body.String())
	}
	if service.userID != 9 || service.courseID != 7 {
		t.Fatalf("unexpected ids: user=%d course=%d", service.userID, service.courseID)
	}
	if !bytes.Contains(w.Body.Bytes(), []byte(`"completed_lesson_ids":[3,4]`)) {
		t.Fatalf("unexpected body: %s", w.Body.String())
	}
}
