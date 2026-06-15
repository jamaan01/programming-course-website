package handlers

import (
	"errors"
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
		if errors.Is(err, lessonCore.ErrAccessDenied) || strings.Contains(err.Error(), "доступ заборонено") {
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

type ProgressInput struct {
	Completed bool `json:"completed"`
}

func (h *LessonHandler) CompleteLesson(c *gin.Context) {
	idStr := c.Param("id")
	lessonID, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неправильний формат ID уроку"})
		return
	}

	userIDcontext, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Не авторизовано"})
		return
	}

	userID, ok := userIDcontext.(int)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Помилка сервера: невірний тип ID"})
		return
	}

	var input ProgressInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Невірний формат даних. Очікується {'completed': true/false}"})
		return
	}

	err = h.service.UpdateLessonProgress(c.Request.Context(), userID, lessonID, input.Completed)
	if err != nil {
		if errors.Is(err, lessonCore.ErrAccessDenied) || strings.Contains(err.Error(), "доступ заборонено") {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не вдалося зберегти прогрес"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Статус уроку оновлено",
		"is_completed": input.Completed,
	})
}

func (h *LessonHandler) GetLessonProgress(c *gin.Context) {
	idStr := c.Param("id")
	courseID, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неправильний формат ID курсу"})
		return
	}

	userIDcontext, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Не авторизовано"})
		return
	}

	userID, ok := userIDcontext.(int)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Помилка сервера: невірний тип ID"})
		return
	}

	completedIDs, err := h.service.GetCompleteLesson(c.Request.Context(), userID, courseID)
	if err != nil {
		if errors.Is(err, lessonCore.ErrAccessDenied) || strings.Contains(err.Error(), "доступ заборонено") {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не вдалося отримати прогрес"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"completed_lesson_ids": completedIDs})
}
