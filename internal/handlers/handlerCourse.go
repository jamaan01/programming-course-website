package handlers

import (
	"net/http"
	"strconv"

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

func (h *CourseHandler) GetCourseByID(c *gin.Context) {
	idStr := c.Param("id")

	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неправильний формат ID"})
		return
	}

	course, err := h.service.GetCourseByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Курс не знайдено"})
		return
	}

	c.JSON(http.StatusOK, course)
}

func (h *CourseHandler) GetCourseSyllabus(c *gin.Context) {
	idStr := c.Param("id")

	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неправильний формат ID"})
		return
	}

	syllabus, err := h.service.GetCourseSyllabus(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Програму курсу не знайдено"})
		return
	}

	c.JSON(http.StatusOK, syllabus)
}
