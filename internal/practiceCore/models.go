package practiceCore

import "time"

type PracticeTask struct {
	ID             int       `json:"id"`
	LessonID       int       `json:"lessonId"`
	Title          string    `json:"title"`
	Description    string    `json:"description"`
	StarterCode    string    `json:"starterCode"`
	ExpectedOutput string    `json:"expectedOutput"`
	OrderNum       int       `json:"orderNum"`
	IsActive       bool      `json:"isActive"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

type StudentPracticeTask struct {
	ID          int    `json:"id"`
	LessonID    int    `json:"lessonId"`
	Title       string `json:"title"`
	Description string `json:"description"`
	StarterCode string `json:"starterCode"`
	OrderNum    int    `json:"orderNum"`
	IsCompleted bool   `json:"isCompleted"`
}

type PracticeSummary struct {
	ActiveTaskCount    int  `json:"activeTaskCount"`
	CompletedTaskCount int  `json:"completedTaskCount"`
	IsCompleted        bool `json:"isCompleted"`
}

type LessonPracticeResponse struct {
	LessonID           int                   `json:"lessonId"`
	Tasks              []StudentPracticeTask `json:"tasks"`
	CompletedTaskIDs   []int                 `json:"completedTaskIds"`
	ActiveTaskCount    int                   `json:"activeTaskCount"`
	CompletedTaskCount int                   `json:"completedTaskCount"`
	IsCompleted        bool                  `json:"isCompleted"`
}

type CheckPracticeTaskRequest struct {
	Output string `json:"output"`
}

type CheckPracticeTaskResponse struct {
	TaskID                  int    `json:"taskId"`
	IsCorrect               bool   `json:"isCorrect"`
	Message                 string `json:"message"`
	CompletedTaskIDs        []int  `json:"completedTaskIds"`
	LessonPracticeCompleted bool   `json:"lessonPracticeCompleted"`
}

type CreatePracticeTaskRequest struct {
	Title          string `json:"title" binding:"required"`
	Description    string `json:"description" binding:"required"`
	StarterCode    string `json:"starterCode"`
	ExpectedOutput string `json:"expectedOutput" binding:"required"`
	OrderNum       int    `json:"orderNum"`
	IsActive       bool   `json:"isActive"`
}

type UpdatePracticeTaskRequest struct {
	Title          *string `json:"title"`
	Description    *string `json:"description"`
	StarterCode    *string `json:"starterCode"`
	ExpectedOutput *string `json:"expectedOutput"`
	OrderNum       *int    `json:"orderNum"`
	IsActive       *bool   `json:"isActive"`
}
