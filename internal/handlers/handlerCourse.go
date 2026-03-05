package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jamaan01/kursovaia/internal/courseCore"
)

type CourseHandler struct {
	service courseCore.CourseService
}

func NewCourseHandler(service courseCore.CourseService) *CourseHandler {
	return &CourseHandler{service: service}
}

func (h *CourseHandler) GetAllCourses(c *gin.Context) {
	courses, err := h.service.GetAllCourses(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Помилка сервера при отриманні курсів"})
		return
	}

	c.JSON(http.StatusOK, courses)
}
