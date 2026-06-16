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
