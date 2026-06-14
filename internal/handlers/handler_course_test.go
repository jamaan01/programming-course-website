package handlers

import (
	"bytes"
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/jamaan01/kursovaia/internal/courseCore"
)

type fakeCourseService struct {
	courses []courseCore.Course
	course  courseCore.Course
	err     error

	createCourseID int
	createModuleID int
	createLessonID int

	userID   int
	courseID int
	moduleID int

	createCourseReq courseCore.CreateCourseRequest
	createModuleReq courseCore.CreateModuleRequest
	createLessonReq courseCore.CreateLessonRequest
}

func (s *fakeCourseService) GetAllCourses(ctx context.Context) ([]courseCore.Course, error) {
	return s.courses, s.err
}

func (s *fakeCourseService) GetCourseByID(ctx context.Context, id int) (courseCore.Course, error) {
	s.courseID = id
	return s.course, s.err
}

func (s *fakeCourseService) GetCourseSyllabus(ctx context.Context, id int) (courseCore.Course, error) {
	s.courseID = id
	return s.course, s.err
}

func (s *fakeCourseService) EnrollUser(ctx context.Context, userID int, courseID int) error {
	s.userID = userID
	s.courseID = courseID
	return s.err
}

func (s *fakeCourseService) GetCoursesByUserID(ctx context.Context, userID int) ([]courseCore.Course, error) {
	s.userID = userID
	return s.courses, s.err
}

func (s *fakeCourseService) CreateCourse(ctx context.Context, req courseCore.CreateCourseRequest) (int, error) {
	s.createCourseReq = req
	return s.createCourseID, s.err
}

func (s *fakeCourseService) CreateModule(ctx context.Context, courseID int, req courseCore.CreateModuleRequest) (int, error) {
	s.courseID = courseID
	s.createModuleReq = req
	return s.createModuleID, s.err
}

func (s *fakeCourseService) CreateLesson(ctx context.Context, moduleID int, req courseCore.CreateLessonRequest) (int, error) {
	s.moduleID = moduleID
	s.createLessonReq = req
	return s.createLessonID, s.err
}

func (s *fakeCourseService) DeleteCourse(ctx context.Context, id int) error {
	s.courseID = id
	return s.err
}

func (s *fakeCourseService) DeleteLesson(ctx context.Context, id int) error {
	s.moduleID = id
	return s.err
}

func TestCourseHandlerGetAllCoursesSuccess(t *testing.T) {
	handler := NewCourseHandler(&fakeCourseService{
		courses: []courseCore.Course{{ID: 1, Title: "Go"}},
	})
	r := newTestRouter()
	r.GET("/api/courses", handler.GetAllCourses)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/courses", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}
	if !bytes.Contains(w.Body.Bytes(), []byte(`"title":"Go"`)) {
		t.Fatalf("unexpected body: %s", w.Body.String())
	}
}

func TestCourseHandlerGetAllCoursesServiceError(t *testing.T) {
	handler := NewCourseHandler(&fakeCourseService{err: errors.New("db down")})
	r := newTestRouter()
	r.GET("/api/courses", handler.GetAllCourses)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/courses", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d", w.Code)
	}
}

func TestCourseHandlerGetCourseByIDBadID(t *testing.T) {
	handler := NewCourseHandler(&fakeCourseService{})
	r := newTestRouter()
	r.GET("/api/courses/:id", handler.GetCourseByID)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/courses/bad", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", w.Code)
	}
}

func TestCourseHandlerCreateCourseSuccess(t *testing.T) {
	service := &fakeCourseService{createCourseID: 5}
	handler := NewCourseHandler(service)
	r := newTestRouter()
	r.POST("/api/admin/courses", handler.CreateCourse)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/admin/courses", bytes.NewBufferString(`{"title":"Go","description":"Basic"}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d: %s", w.Code, w.Body.String())
	}
	if service.createCourseReq.Title != "Go" {
		t.Fatalf("unexpected create request: %+v", service.createCourseReq)
	}
	if !bytes.Contains(w.Body.Bytes(), []byte(`"course_id":5`)) {
		t.Fatalf("unexpected body: %s", w.Body.String())
	}
}

func TestCourseHandlerCreateCourseBadBody(t *testing.T) {
	handler := NewCourseHandler(&fakeCourseService{})
	r := newTestRouter()
	r.POST("/api/admin/courses", handler.CreateCourse)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/admin/courses", bytes.NewBufferString(`{"title":""}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", w.Code)
	}
}

func TestCourseHandlerCreateModuleSuccess(t *testing.T) {
	service := &fakeCourseService{createModuleID: 6}
	handler := NewCourseHandler(service)
	r := newTestRouter()
	r.POST("/api/admin/courses/:id/modules", handler.CreateModule)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/admin/courses/5/modules", bytes.NewBufferString(`{"title":"Intro","order_num":1}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d: %s", w.Code, w.Body.String())
	}
	if service.courseID != 5 || service.createModuleReq.Title != "Intro" {
		t.Fatalf("unexpected module data: %+v", service)
	}
}

func TestCourseHandlerEnrollUserRequiresAuthContext(t *testing.T) {
	handler := NewCourseHandler(&fakeCourseService{})
	r := newTestRouter()
	r.POST("/api/courses/:id/enroll", handler.EnrollUser)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/courses/5/enroll", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", w.Code)
	}
}

func TestCourseHandlerEnrollUserConflict(t *testing.T) {
	service := &fakeCourseService{err: errors.New("ви вже отримали доступ")}
	handler := NewCourseHandler(service)
	r := newTestRouter()
	r.POST("/api/courses/:id/enroll", func(c *gin.Context) {
		c.Set("userID", 9)
		handler.EnrollUser(c)
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/courses/5/enroll", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusConflict {
		t.Fatalf("expected status 409, got %d", w.Code)
	}
}

func TestCourseHandlerGetMyCourseSuccess(t *testing.T) {
	service := &fakeCourseService{courses: []courseCore.Course{{ID: 1, Title: "Go"}}}
	handler := NewCourseHandler(service)
	r := newTestRouter()
	r.GET("/api/profile/courses", func(c *gin.Context) {
		c.Set("userID", 9)
		handler.GetMyCourse(c)
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/profile/courses", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}
	if service.userID != 9 {
		t.Fatalf("unexpected user id: %d", service.userID)
	}
}
