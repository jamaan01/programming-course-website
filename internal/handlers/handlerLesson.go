package handlers

import (
	"net/http"
	"strconv"

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

	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неправильний формат ID"})
		return
	}

	lesson, err := h.service.GetLessonByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Урок не знайдено"})
		return
	}

	c.JSON(http.StatusOK, lesson)
}
