package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jamaan01/kursovaia/internal/questionCore"
)

type QuestionHandler struct {
	service questionCore.QuestionService
}

func NewQuestionHandler(service questionCore.QuestionService) *QuestionHandler {
	return &QuestionHandler{service: service}
}

func (h *QuestionHandler) CreateQuestion(c *gin.Context) {
	lessonID, ok := getIDParam(c, "id")
	if !ok {
		return
	}

	var req questionCore.CreateQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Невірний формат даних", "details": err.Error()})
		return
	}

	questionID, err := h.service.CreateQuestion(c.Request.Context(), lessonID, req)
	if err != nil {
		if errors.Is(err, questionCore.ErrInvalidQuestion) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Питання має містити текст, мінімум 2 варіанти і рівно одну правильну відповідь"})
			return
		}

		if errors.Is(err, questionCore.ErrLessonNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Урок не знайдено"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не вдалося створити питання"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Питання успішно створено", "question_id": questionID})
}

func (h *QuestionHandler) GetQuestionsByLessonID(c *gin.Context) {
	lessonID, ok := getIDParam(c, "id")
	if !ok {
		return
	}

	questions, err := h.service.GetQuestionsByLessonID(c.Request.Context(), lessonID)
	if err != nil {
		if errors.Is(err, questionCore.ErrLessonNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Урок не знайдено"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не вдалося отримати питання"})
		return
	}

	c.JSON(http.StatusOK, questions)
}
