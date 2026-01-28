package handlers

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jamaan01/kursovaia/internal/userCore"
)

type AuthHandler struct {
	service userCore.UserService
}

func NewAuthHandler(service userCore.UserService) *AuthHandler {
	return &AuthHandler{service: service}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req userCore.RegisterRequest

	err := c.ShouldBindJSON(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Невірний формат даних. Перевірте правильність введених полів."})
		return
	}

	id, err := h.service.Register(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, userCore.ErrEmailExists) {
			c.JSON(http.StatusConflict, gin.H{"error": "Email вже зайнятий"})
			return
		}
		slog.Error("Failed to register user", "user", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Помилка сервера"})
		return
	}

	user := userCore.UserResponse{
		ID:    id,
		Name:  req.Name,
		Email: req.Email,
	}
	c.JSON(http.StatusCreated, user)
}
