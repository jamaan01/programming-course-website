package handlers

import (
	"net/http"
	"strconv"
	"strings"

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

func (h *CourseHandler) EnrollUser(c *gin.Context) {
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

	err = h.service.EnrollUser(c.Request.Context(), userID, courseID)
	if err != nil {
		if strings.Contains(err.Error(), "вже отримали") {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Внутрішня помилка сервера"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Курс успішно додано!"})
}

func (h *CourseHandler) GetMyCourse(c *gin.Context) {
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

	courses, err := h.service.GetCoursesByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Помилка при отриманні списку курсів"})
		return
	}

	c.JSON(http.StatusOK, courses)
}

func (h *CourseHandler) CreateCourse(c *gin.Context) {
	var req courseCore.CreateCourseRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Невірний формат даних або відсутні обов'язкові поля",
			"details": err.Error(),
		})
		return
	}

	newID, err := h.service.CreateCourse(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не вдалося створити курс"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Курс успішно створено",
		"course_id": newID,
	})
}

func (h *CourseHandler) CreateModule(c *gin.Context) {
	courseIDStr := c.Param("id")
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Невалідний ID курсу"})
		return
	}

	var req courseCore.CreateModuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Невірний формат даних або відсутні обов'язкові поля", "details": err.Error()})
		return
	}

	newModuleID, err := h.service.CreateModule(c.Request.Context(), courseID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не вдалося створити модуль"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Модуль успішно додано до курсу", "module_id": newModuleID})
}

func (h *CourseHandler) CreateLesson(c *gin.Context) {
	moduleIDStr := c.Param("id")
	moduleID, err := strconv.Atoi(moduleIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Невалідний ID модуля"})
		return
	}

	var req courseCore.CreateLessonRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Невірний формат даних або відсутні обов'язкові поля", "details": err.Error()})
		return
	}

	newLessonID, err := h.service.CreateLesson(c.Request.Context(), moduleID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не вдалося створити урок"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Урок успішно додано до курсу", "lesson_id": newLessonID})
}

func (h *CourseHandler) DeleteCourse(c *gin.Context) {
	idStr := c.Param("id")

	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неправильний формат ID"})
		return
	}

	err = h.service.DeleteCourse(c.Request.Context(), id)
	if err != nil {
		if strings.Contains(err.Error(), "не знайдено") {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не вдалося видалити курс"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Курс успішно видалено"})
}

func (h *CourseHandler) DeleteLesson(c *gin.Context) {
	idStr := c.Param("id")

	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неправильний формат ID"})
		return
	}

	err = h.service.DeleteLesson(c.Request.Context(), id)
	if err != nil {
		if strings.Contains(err.Error(), "не знайдено") {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не вдалося видалити урок"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Урок успішно видалено"})
}
