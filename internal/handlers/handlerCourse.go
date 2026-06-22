package handlers

import (
	"errors"
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не вдалося отримати курси"})
		return
	}

	c.JSON(http.StatusOK, courses)
}

func (h *CourseHandler) GetCourseByID(c *gin.Context) {
	id, ok := getIDParam(c, "id")
	if !ok {
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
	id, ok := getIDParam(c, "id")
	if !ok {
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
	courseID, ok := getIDParam(c, "id")
	if !ok {
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

	err := h.service.EnrollUser(c.Request.Context(), userID, courseID)
	if err != nil {
		if errors.Is(err, courseCore.ErrAlreadyEnrolled) {
			c.JSON(http.StatusConflict, gin.H{"error": "Ви вже отримали доступ до цього курсу"})
			return
		}

		if errors.Is(err, courseCore.ErrCourseNotPublished) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Курс ще не опубліковано"})
			return
		}

		if errors.Is(err, courseCore.ErrCourseNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Курс не знайдено"})
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

func (h *CourseHandler) GetAllCoursesAdmin(c *gin.Context) {
	courses, err := h.service.GetAllCoursesAdmin(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не вдалося отримати курси"})
		return
	}

	c.JSON(http.StatusOK, courses)
}

func (h *CourseHandler) GetCourseByIDAdmin(c *gin.Context) {
	id, ok := getIDParam(c, "id")
	if !ok {
		return
	}

	course, err := h.service.GetCourseByIDAdmin(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Курс не знайдено"})
		return
	}

	c.JSON(http.StatusOK, course)
}

func (h *CourseHandler) GetCourseSyllabusAdmin(c *gin.Context) {
	id, ok := getIDParam(c, "id")
	if !ok {
		return
	}

	syllabus, err := h.service.GetCourseSyllabusAdmin(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Програму курсу не знайдено"})
		return
	}

	c.JSON(http.StatusOK, syllabus)
}

func (h *CourseHandler) UpdateCoursePublishStatus(c *gin.Context) {
	id, ok := getIDParam(c, "id")
	if !ok {
		return
	}

	var req courseCore.UpdateCoursePublishRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Невірний формат даних"})
		return
	}

	if req.IsPublished == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Поле is_published обов'язкове"})
		return
	}

	err := h.service.UpdateCoursePublishStatus(c.Request.Context(), id, *req.IsPublished)
	if err != nil {
		if errors.Is(err, courseCore.ErrCourseNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Курс не знайдено"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не вдалося оновити статус курсу"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Статус курсу оновлено", "is_published": *req.IsPublished})
}

func (h *CourseHandler) UpdateCourse(c *gin.Context) {
	id, ok := getIDParam(c, "id")
	if !ok {
		return
	}

	var req courseCore.UpdateCourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Невірний формат даних", "details": err.Error()})
		return
	}

	err := h.service.UpdateCourse(c.Request.Context(), id, req)
	if err != nil {
		if errors.Is(err, courseCore.ErrInvalidCourseContent) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Перевірте введені дані"})
			return
		}

		if errors.Is(err, courseCore.ErrCourseNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Курс не знайдено"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не вдалося оновити курс"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Курс оновлено"})
}

func (h *CourseHandler) UpdateModule(c *gin.Context) {
	id, ok := getIDParam(c, "id")
	if !ok {
		return
	}

	var req courseCore.UpdateModuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Невірний формат даних", "details": err.Error()})
		return
	}

	err := h.service.UpdateModule(c.Request.Context(), id, req)
	if err != nil {
		if errors.Is(err, courseCore.ErrInvalidCourseContent) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Перевірте введені дані"})
			return
		}

		if errors.Is(err, courseCore.ErrModuleNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Модуль не знайдено"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не вдалося оновити модуль"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Модуль оновлено"})
}

func (h *CourseHandler) UpdateLesson(c *gin.Context) {
	id, ok := getIDParam(c, "id")
	if !ok {
		return
	}

	var req courseCore.UpdateLessonRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Невірний формат даних", "details": err.Error()})
		return
	}

	err := h.service.UpdateLesson(c.Request.Context(), id, req)
	if err != nil {
		if errors.Is(err, courseCore.ErrInvalidCourseContent) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Перевірте введені дані"})
			return
		}

		if errors.Is(err, courseCore.ErrLessonNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Урок не знайдено"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не вдалося оновити урок"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Урок оновлено"})
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
	courseID, ok := getIDParam(c, "id")
	if !ok {
		return
	}

	var req courseCore.CreateModuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Невірний формат даних або відсутні обов'язкові поля", "details": err.Error()})
		return
	}

	newModuleID, err := h.service.CreateModule(c.Request.Context(), courseID, req)
	if err != nil {
		if errors.Is(err, courseCore.ErrDuplicateOrderNum) {
			c.JSON(http.StatusConflict, gin.H{"error": "Цей порядковий номер вже зайнятий"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не вдалося створити модуль"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Модуль успішно додано до курсу", "module_id": newModuleID})
}

func (h *CourseHandler) CreateLesson(c *gin.Context) {
	moduleID, ok := getIDParam(c, "id")
	if !ok {
		return
	}

	var req courseCore.CreateLessonRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Невірний формат даних або відсутні обов'язкові поля", "details": err.Error()})
		return
	}

	newLessonID, err := h.service.CreateLesson(c.Request.Context(), moduleID, req)
	if err != nil {
		if errors.Is(err, courseCore.ErrDuplicateOrderNum) {
			c.JSON(http.StatusConflict, gin.H{"error": "Цей порядковий номер вже зайнятий"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не вдалося створити урок"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Урок успішно додано до курсу", "lesson_id": newLessonID})
}

func getIDParam(c *gin.Context, name string) (int, bool) {
	idStr := c.Param(name)

	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неправильний формат ID"})
		return 0, false
	}

	return id, true
}
