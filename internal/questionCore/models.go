package questionCore

type Question struct {
	ID           int      `json:"id"`
	LessonID     int      `json:"lesson_id"`
	QuestionText string   `json:"question_text"`
	OrderNum     int      `json:"order_num"`
	Options      []Option `json:"options"`
}

type Option struct {
	ID         int    `json:"id"`
	QuestionID int    `json:"question_id"`
	OptionText string `json:"option_text"`
	IsCorrect  bool   `json:"is_correct"`
	OrderNum   int    `json:"order_num"`
}

type CreateQuestionRequest struct {
	QuestionText string                `json:"question_text" binding:"required"`
	OrderNum     int                   `json:"order_num"`
	Options      []CreateOptionRequest `json:"options" binding:"required"`
}

type CreateOptionRequest struct {
	OptionText string `json:"option_text" binding:"required"`
	IsCorrect  bool   `json:"is_correct"`
	OrderNum   int    `json:"order_num"`
}

type UpdateQuestionRequest struct {
	QuestionText string `json:"question_text" binding:"required"`
}

type UpdateQuestionOptionRequest struct {
	OptionText string `json:"option_text" binding:"required"`
}

type CreateQuestionOptionRequest struct {
	OptionText string `json:"option_text" binding:"required"`
}

type UpdateQuestionCorrectOptionRequest struct {
	OptionID int `json:"option_id" binding:"required"`
}

type StudentQuestionResponse struct {
	ID           int                     `json:"id"`
	LessonID     int                     `json:"lesson_id"`
	QuestionText string                  `json:"question_text"`
	OrderNum     int                     `json:"order_num"`
	Options      []StudentOptionResponse `json:"options"`
	UserAnswer   *QuestionUserAnswer     `json:"user_answer"`
}

type StudentOptionResponse struct {
	ID         int    `json:"id"`
	QuestionID int    `json:"question_id"`
	OptionText string `json:"option_text"`
	OrderNum   int    `json:"order_num"`
}

type LessonQuestionsResponse struct {
	Questions           []StudentQuestionResponse `json:"questions"`
	AllQuestionsCorrect bool                      `json:"all_questions_correct"`
}

type QuestionUserAnswer struct {
	SelectedOptionID int  `json:"selected_option_id"`
	IsCorrect        bool `json:"is_correct"`
}

type SubmitAnswerRequest struct {
	OptionID int `json:"option_id" binding:"required"`
}

type SubmitAnswerResponse struct {
	QuestionID          int  `json:"question_id"`
	SelectedOptionID    int  `json:"selected_option_id"`
	IsCorrect           bool `json:"is_correct"`
	AllQuestionsCorrect bool `json:"all_questions_correct"`
}
