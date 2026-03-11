package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jamaan01/kursovaia/internal/lessonCore"
)

type LessonHandler struct {
	service lessonCore.LessonService
}

func NewLessonHandler(service lessonCore.LessonService) *LessonHandler {
	return &LessonHandler{service: service}
}

func (h *LessonHandler) GetLessonByID(c *gin.Context) {
	idStr := c.Param("id")

	lessonID, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неправильний формат ID"})
		return
	}

	userIDcontext, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Не авторизовано"})
		return
	}

	userID := userIDcontext.(int)

	lesson, err := h.service.GetLessonByID(c.Request.Context(), lessonID, userID)
	if err != nil {
		if strings.Contains(err.Error(), "доступ заборонено") {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}

		if strings.Contains(err.Error(), "не знайдено") {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Внутрішня помилка сервера"})
		return
	}

	c.JSON(http.StatusOK, lesson)
}
