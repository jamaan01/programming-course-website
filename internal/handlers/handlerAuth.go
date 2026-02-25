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

	token, id, err := h.service.Register(c.Request.Context(), req)
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
		Token: token,
	}
	c.JSON(http.StatusCreated, user)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req userCore.LoginRequest

	err := c.ShouldBindJSON(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Невірний формат даних. Перевірте правильність введених полів."})
		return
	}

	tk, err := h.service.Login(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, userCore.ErrInvalidCredentials) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Невірний email або пароль"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Помилка сервера"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"JWT": tk})
}

func (h *AuthHandler) GetProfile(c *gin.Context) {
	userIDcontext, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Не авторизовано"})
		return
	}

	userID, ok := userIDcontext.(int)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Помилка читання ID"})
		return
	}

	user, err := h.service.GetProfile(c.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, userCore.ErrUserNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Користувача не знайдено"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Помилка бази даних"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":         user.ID,
		"name":       user.Name,
		"email":      user.Email,
		"created_at": user.CreatedAt,
	})
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userIDcontext, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Не авторизовано"})
		return
	}
	userID := userIDcontext.(int)

	var req userCore.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Невірний формат даних"})
		return
	}

	err := h.service.UpdateProfile(c.Request.Context(), userID, req)
	if err != nil {
		if errors.Is(err, userCore.ErrUserNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Користувача не знайдено"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Помилка оновлення профілю"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Профіль успішно оновлено!"})
}
