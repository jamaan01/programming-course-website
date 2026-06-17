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

		if errors.Is(err, questionCore.ErrDuplicateOrderNum) {
			c.JSON(http.StatusConflict, gin.H{"error": "Цей порядковий номер вже зайнятий"})
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

func (h *QuestionHandler) GetStudentQuestionsByLessonID(c *gin.Context) {
	lessonID, ok := getIDParam(c, "id")
	if !ok {
		return
	}

	userID, ok := getQuestionUserID(c)
	if !ok {
		return
	}

	questions, err := h.service.GetStudentQuestionsByLessonID(c.Request.Context(), userID, lessonID)
	if err != nil {
		if errors.Is(err, questionCore.ErrInvalidID) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "РќРµРїСЂР°РІРёР»СЊРЅРёР№ С„РѕСЂРјР°С‚ ID"})
			return
		}

		if errors.Is(err, questionCore.ErrLessonNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "РЈСЂРѕРє РЅРµ Р·РЅР°Р№РґРµРЅРѕ"})
			return
		}

		if errors.Is(err, questionCore.ErrAccessDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "РќРµРјР°С” РґРѕСЃС‚СѓРїСѓ РґРѕ РїРёС‚Р°РЅСЊ СѓСЂРѕРєСѓ"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "РќРµ РІРґР°Р»РѕСЃСЏ РѕС‚СЂРёРјР°С‚Рё РїРёС‚Р°РЅРЅСЏ"})
		return
	}

	c.JSON(http.StatusOK, questions)
}

func (h *QuestionHandler) SubmitAnswer(c *gin.Context) {
	questionID, ok := getIDParam(c, "id")
	if !ok {
		return
	}

	userID, ok := getQuestionUserID(c)
	if !ok {
		return
	}

	var req questionCore.SubmitAnswerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "РќРµРІС–СЂРЅРёР№ С„РѕСЂРјР°С‚ РґР°РЅРёС…", "details": err.Error()})
		return
	}

	result, err := h.service.SubmitAnswer(c.Request.Context(), userID, questionID, req)
	if err != nil {
		if errors.Is(err, questionCore.ErrInvalidID) || errors.Is(err, questionCore.ErrInvalidAnswer) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "РќРµРєРѕСЂРµРєС‚РЅС– РґР°РЅС– РІС–РґРїРѕРІС–РґС–"})
			return
		}

		if errors.Is(err, questionCore.ErrQuestionNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "РџРёС‚Р°РЅРЅСЏ РЅРµ Р·РЅР°Р№РґРµРЅРѕ"})
			return
		}

		if errors.Is(err, questionCore.ErrOptionNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Р’Р°СЂС–Р°РЅС‚ РІС–РґРїРѕРІС–РґС– РЅРµ Р·РЅР°Р№РґРµРЅРѕ"})
			return
		}

		if errors.Is(err, questionCore.ErrAccessDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "РќРµРјР°С” РґРѕСЃС‚СѓРїСѓ РґРѕ РїРёС‚Р°РЅРЅСЏ"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "РќРµ РІРґР°Р»РѕСЃСЏ РїРµСЂРµРІС–СЂРёС‚Рё РІС–РґРїРѕРІС–РґСЊ"})
		return
	}

	c.JSON(http.StatusOK, result)
}

func getQuestionUserID(c *gin.Context) (int, bool) {
	userIDcontext, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "РќРµ Р°РІС‚РѕСЂРёР·РѕРІР°РЅРѕ"})
		return 0, false
	}

	userID, ok := userIDcontext.(int)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "РџРѕРјРёР»РєР° СЃРµСЂРІРµСЂР°: РЅРµРІС–СЂРЅРёР№ С‚РёРї ID"})
		return 0, false
	}

	return userID, true
}
