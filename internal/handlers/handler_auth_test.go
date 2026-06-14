package handlers

import (
	"bytes"
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/jamaan01/kursovaia/internal/userCore"
)

type fakeUserService struct {
	registerToken string
	registerID    int
	registerErr   error
	loginToken    string
	loginErr      error
	profile       *userCore.UserDB
	profileErr    error
	updateErr     error
	roleErr       error

	registerReq userCore.RegisterRequest
	loginReq    userCore.LoginRequest
	updateReq   userCore.UpdateProfileRequest
	roleReq     userCore.UpdateUserRoleRequest
	userID      int
}

func (s *fakeUserService) Register(ctx context.Context, req userCore.RegisterRequest) (string, int, error) {
	s.registerReq = req
	return s.registerToken, s.registerID, s.registerErr
}

func (s *fakeUserService) Login(ctx context.Context, req userCore.LoginRequest) (string, error) {
	s.loginReq = req
	return s.loginToken, s.loginErr
}

func (s *fakeUserService) GetProfile(ctx context.Context, id int) (*userCore.UserDB, error) {
	s.userID = id
	return s.profile, s.profileErr
}

func (s *fakeUserService) UpdateProfile(ctx context.Context, id int, req userCore.UpdateProfileRequest) error {
	s.userID = id
	s.updateReq = req
	return s.updateErr
}

func (s *fakeUserService) UpdateUserRole(ctx context.Context, id int, req userCore.UpdateUserRoleRequest) error {
	s.userID = id
	s.roleReq = req
	return s.roleErr
}

func newTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	return gin.New()
}

func TestAuthHandlerRegisterSuccess(t *testing.T) {
	service := &fakeUserService{registerToken: "token", registerID: 3}
	handler := NewAuthHandler(service)
	r := newTestRouter()
	r.POST("/auth/register", handler.Register)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewBufferString(`{"name":"Maks","email":"maks@example.com","password":"secret123"}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d: %s", w.Code, w.Body.String())
	}
	if service.registerReq.Email != "maks@example.com" {
		t.Fatalf("unexpected register request: %+v", service.registerReq)
	}
	if !bytes.Contains(w.Body.Bytes(), []byte(`"jwt":"token"`)) {
		t.Fatalf("expected token in body, got %s", w.Body.String())
	}
}

func TestAuthHandlerRegisterBadJSON(t *testing.T) {
	handler := NewAuthHandler(&fakeUserService{})
	r := newTestRouter()
	r.POST("/auth/register", handler.Register)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewBufferString(`{"email":`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", w.Code)
	}
}

func TestAuthHandlerRegisterEmailExists(t *testing.T) {
	handler := NewAuthHandler(&fakeUserService{registerErr: userCore.ErrEmailExists})
	r := newTestRouter()
	r.POST("/auth/register", handler.Register)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewBufferString(`{"name":"Maks","email":"maks@example.com","password":"secret123"}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusConflict {
		t.Fatalf("expected status 409, got %d", w.Code)
	}
}

func TestAuthHandlerLoginSuccess(t *testing.T) {
	service := &fakeUserService{loginToken: "token"}
	handler := NewAuthHandler(service)
	r := newTestRouter()
	r.POST("/auth/login", handler.Login)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewBufferString(`{"email":"maks@example.com","password":"secret123"}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", w.Code, w.Body.String())
	}
	if service.loginReq.Email != "maks@example.com" {
		t.Fatalf("unexpected login request: %+v", service.loginReq)
	}
	if w.Body.String() != `{"token":"token"}` {
		t.Fatalf("unexpected body: %s", w.Body.String())
	}
}

func TestAuthHandlerLoginInvalidCredentials(t *testing.T) {
	handler := NewAuthHandler(&fakeUserService{loginErr: userCore.ErrInvalidCredentials})
	r := newTestRouter()
	r.POST("/auth/login", handler.Login)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewBufferString(`{"email":"maks@example.com","password":"bad"}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", w.Code)
	}
}

func TestAuthHandlerLoginServiceError(t *testing.T) {
	handler := NewAuthHandler(&fakeUserService{loginErr: errors.New("db down")})
	r := newTestRouter()
	r.POST("/auth/login", handler.Login)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewBufferString(`{"email":"maks@example.com","password":"secret123"}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d", w.Code)
	}
}

func TestAuthHandlerGetProfileRequiresUserID(t *testing.T) {
	handler := NewAuthHandler(&fakeUserService{})
	r := newTestRouter()
	r.GET("/api/profile", handler.GetProfile)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/profile", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", w.Code)
	}
}

func TestAuthHandlerUpdateProfileSuccess(t *testing.T) {
	service := &fakeUserService{}
	handler := NewAuthHandler(service)
	r := newTestRouter()
	r.PUT("/api/profile", func(c *gin.Context) {
		c.Set("userID", 8)
		handler.UpdateProfile(c)
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPut, "/api/profile", bytes.NewBufferString(`{"name":"New","email":"new@example.com"}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", w.Code, w.Body.String())
	}
	if service.userID != 8 || service.updateReq.Email != "new@example.com" {
		t.Fatalf("unexpected update data: id=%d req=%+v", service.userID, service.updateReq)
	}
}

func TestAuthHandlerUpdateUserRoleBadID(t *testing.T) {
	handler := NewAuthHandler(&fakeUserService{})
	r := newTestRouter()
	r.PUT("/api/admin/users/:id/role", handler.UpdateUserRole)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPut, "/api/admin/users/bad/role", bytes.NewBufferString(`{"role":"admin"}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", w.Code)
	}
}
