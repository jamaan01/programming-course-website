package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jamaan01/kursovaia/internal/practiceCore"
)

type PracticeHandler struct {
	service practiceCore.PracticeService
}

func NewPracticeHandler(service practiceCore.PracticeService) *PracticeHandler {
	return &PracticeHandler{service: service}
}

func (h *PracticeHandler) GetPracticeSummary(c *gin.Context) {
	lessonID, ok := getIDParam(c, "id")
	if !ok {
		return
	}

	userID, ok := getAuthenticatedUserID(c)
	if !ok {
		return
	}

	summary, err := h.service.GetPracticeSummary(c.Request.Context(), userID, lessonID, getAuthenticatedUserRole(c))
	if err != nil {
		h.writePracticeError(c, err)
		return
	}

	c.JSON(http.StatusOK, summary)
}

func (h *PracticeHandler) GetLessonPractice(c *gin.Context) {
	lessonID, ok := getIDParam(c, "id")
	if !ok {
		return
	}

	userID, ok := getAuthenticatedUserID(c)
	if !ok {
		return
	}

	practice, err := h.service.GetLessonPractice(c.Request.Context(), userID, lessonID, getAuthenticatedUserRole(c))
	if err != nil {
		h.writePracticeError(c, err)
		return
	}

	c.JSON(http.StatusOK, practice)
}

func (h *PracticeHandler) CheckPracticeTask(c *gin.Context) {
	taskID, ok := getIDParam(c, "id")
	if !ok {
		return
	}

	userID, ok := getAuthenticatedUserID(c)
	if !ok {
		return
	}

	var req practiceCore.CheckPracticeTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Невірний формат даних"})
		return
	}

	result, err := h.service.CheckPracticeTask(c.Request.Context(), userID, taskID, req, getAuthenticatedUserRole(c))
	if err != nil {
		h.writePracticeError(c, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *PracticeHandler) GetAdminPracticeTasks(c *gin.Context) {
	lessonID, ok := getIDParam(c, "id")
	if !ok {
		return
	}

	tasks, err := h.service.GetAdminPracticeTasks(c.Request.Context(), lessonID)
	if err != nil {
		h.writePracticeError(c, err)
		return
	}

	c.JSON(http.StatusOK, tasks)
}

func (h *PracticeHandler) CreatePracticeTask(c *gin.Context) {
	lessonID, ok := getIDParam(c, "id")
	if !ok {
		return
	}

	var req practiceCore.CreatePracticeTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Невірний формат даних", "details": err.Error()})
		return
	}

	task, err := h.service.CreatePracticeTask(c.Request.Context(), lessonID, req)
	if err != nil {
		h.writePracticeError(c, err)
		return
	}

	c.JSON(http.StatusCreated, task)
}

func (h *PracticeHandler) UpdatePracticeTask(c *gin.Context) {
	taskID, ok := getIDParam(c, "id")
	if !ok {
		return
	}

	var req practiceCore.UpdatePracticeTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Невірний формат даних", "details": err.Error()})
		return
	}

	task, err := h.service.UpdatePracticeTask(c.Request.Context(), taskID, req)
	if err != nil {
		h.writePracticeError(c, err)
		return
	}

	c.JSON(http.StatusOK, task)
}

func (h *PracticeHandler) writePracticeError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, practiceCore.ErrInvalidID):
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неправильний формат ID"})
	case errors.Is(err, practiceCore.ErrInvalidPracticeTask):
		c.JSON(http.StatusBadRequest, gin.H{"error": "Перевірте дані практичного завдання"})
	case errors.Is(err, practiceCore.ErrOutputTooLong):
		c.JSON(http.StatusBadRequest, gin.H{"error": "Output занадто довгий"})
	case errors.Is(err, practiceCore.ErrLessonNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": "Урок не знайдено"})
	case errors.Is(err, practiceCore.ErrPracticeTaskNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": "Практичне завдання не знайдено"})
	case errors.Is(err, practiceCore.ErrAccessDenied):
		c.JSON(http.StatusForbidden, gin.H{"error": "Немає доступу до практики цього уроку"})
	case errors.Is(err, practiceCore.ErrDuplicateOrderNum):
		c.JSON(http.StatusConflict, gin.H{"error": "Цей порядковий номер вже зайнятий"})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не вдалося виконати дію з практикою"})
	}
}
