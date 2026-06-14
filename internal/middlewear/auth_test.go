package middlewear

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/jamaan01/kursovaia/internal/utils"
)

func setupMiddlewearRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	return r
}

func TestAuthMiddleMissingHeader(t *testing.T) {
	r := setupMiddlewearRouter()
	r.GET("/private", AuthMiddle(), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/private", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", w.Code)
	}
}

func TestAuthMiddleInvalidToken(t *testing.T) {
	r := setupMiddlewearRouter()
	r.GET("/private", AuthMiddle(), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/private", nil)
	req.Header.Set("Authorization", "Bearer wrong-token")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", w.Code)
	}
}

func TestAuthMiddleValidTokenSetsContext(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")

	token, err := utils.GenerateToken(25, "admin")
	if err != nil {
		t.Fatal(err)
	}

	r := setupMiddlewearRouter()
	r.GET("/private", AuthMiddle(), func(c *gin.Context) {
		userID, _ := c.Get("userID")
		role, _ := c.Get("userRole")
		c.JSON(http.StatusOK, gin.H{
			"user_id": userID,
			"role":    role,
		})
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/private", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}
	if w.Body.String() != `{"role":"admin","user_id":25}` {
		t.Fatalf("unexpected body: %s", w.Body.String())
	}
}

func TestAdminMiddleForbidsUserRole(t *testing.T) {
	r := setupMiddlewearRouter()
	r.GET("/admin", func(c *gin.Context) {
		c.Set("userRole", "user")
	}, AdminMiddle(), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/admin", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected status 403, got %d", w.Code)
	}
}

func TestAdminMiddleAllowsAdminRole(t *testing.T) {
	r := setupMiddlewearRouter()
	r.GET("/admin", func(c *gin.Context) {
		c.Set("userRole", "admin")
	}, AdminMiddle(), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/admin", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}
}

func TestSetupCORSAllowsFrontendOrigin(t *testing.T) {
	r := setupMiddlewearRouter()
	r.Use(SetupCORS())
	r.OPTIONS("/api/courses", func(c *gin.Context) {
		c.Status(http.StatusNoContent)
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodOptions, "/api/courses", nil)
	req.Header.Set("Origin", "http://127.0.0.1:5500")
	req.Header.Set("Access-Control-Request-Method", http.MethodGet)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Fatalf("expected status 204, got %d", w.Code)
	}
	if w.Header().Get("Access-Control-Allow-Origin") != "http://127.0.0.1:5500" {
		t.Fatalf("unexpected allow origin: %s", w.Header().Get("Access-Control-Allow-Origin"))
	}
}
