package practiceCore

import (
	"context"
	"errors"
	"strings"
)

const MaxSubmittedOutputLength = 20000

var ErrInvalidID = errors.New("invalid id")
var ErrInvalidPracticeTask = errors.New("invalid practice task")
var ErrPracticeTaskNotFound = errors.New("practice task not found")
var ErrLessonNotFound = errors.New("lesson not found")
var ErrAccessDenied = errors.New("access denied")
var ErrDuplicateOrderNum = errors.New("duplicate order num")
var ErrOutputTooLong = errors.New("output too long")

type PracticeService interface {
	GetPracticeSummary(ctx context.Context, userID int, lessonID int, userRole string) (PracticeSummary, error)
	GetLessonPractice(ctx context.Context, userID int, lessonID int, userRole string) (LessonPracticeResponse, error)
	CheckPracticeTask(ctx context.Context, userID int, taskID int, req CheckPracticeTaskRequest, userRole string) (CheckPracticeTaskResponse, error)
	GetAdminPracticeTasks(ctx context.Context, lessonID int) ([]PracticeTask, error)
	CreatePracticeTask(ctx context.Context, lessonID int, req CreatePracticeTaskRequest) (PracticeTask, error)
	UpdatePracticeTask(ctx context.Context, taskID int, req UpdatePracticeTaskRequest) (PracticeTask, error)
}

type Service struct {
	repo PracticeRepository
}

func NewService(repo PracticeRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetPracticeSummary(ctx context.Context, userID int, lessonID int, userRole string) (PracticeSummary, error) {
	if userID <= 0 || lessonID <= 0 {
		return PracticeSummary{}, ErrInvalidID
	}

	if err := s.repo.CheckStudentLessonAccess(ctx, userID, lessonID, userRole); err != nil {
		return PracticeSummary{}, err
	}

	return s.repo.GetPracticeSummary(ctx, userID, lessonID)
}

func (s *Service) GetLessonPractice(ctx context.Context, userID int, lessonID int, userRole string) (LessonPracticeResponse, error) {
	if userID <= 0 || lessonID <= 0 {
		return LessonPracticeResponse{}, ErrInvalidID
	}

	if err := s.repo.CheckStudentLessonAccess(ctx, userID, lessonID, userRole); err != nil {
		return LessonPracticeResponse{}, err
	}

	tasks, err := s.repo.GetStudentPracticeTasks(ctx, userID, lessonID)
	if err != nil {
		return LessonPracticeResponse{}, err
	}

	completedTaskIDs, err := s.repo.GetCompletedTaskIDs(ctx, userID, lessonID)
	if err != nil {
		return LessonPracticeResponse{}, err
	}

	summary := makePracticeSummary(len(tasks), len(completedTaskIDs))

	return LessonPracticeResponse{
		LessonID:           lessonID,
		Tasks:              tasks,
		CompletedTaskIDs:   completedTaskIDs,
		ActiveTaskCount:    summary.ActiveTaskCount,
		CompletedTaskCount: summary.CompletedTaskCount,
		IsCompleted:        summary.IsCompleted,
	}, nil
}

func (s *Service) CheckPracticeTask(ctx context.Context, userID int, taskID int, req CheckPracticeTaskRequest, userRole string) (CheckPracticeTaskResponse, error) {
	if userID <= 0 || taskID <= 0 {
		return CheckPracticeTaskResponse{}, ErrInvalidID
	}

	if len(req.Output) > MaxSubmittedOutputLength {
		return CheckPracticeTaskResponse{}, ErrOutputTooLong
	}

	task, err := s.repo.GetPracticeTaskForCheck(ctx, taskID)
	if err != nil {
		return CheckPracticeTaskResponse{}, err
	}

	if !task.IsActive {
		return CheckPracticeTaskResponse{}, ErrPracticeTaskNotFound
	}

	if err := s.repo.CheckStudentLessonAccess(ctx, userID, task.LessonID, userRole); err != nil {
		return CheckPracticeTaskResponse{}, err
	}

	isCorrect := normalizeOutput(req.Output) == normalizeOutput(task.ExpectedOutput)

	if isCorrect {
		if err := s.repo.SaveTaskProgress(ctx, userID, taskID); err != nil {
			return CheckPracticeTaskResponse{}, err
		}
	}

	completedTaskIDs, err := s.repo.GetCompletedTaskIDs(ctx, userID, task.LessonID)
	if err != nil {
		return CheckPracticeTaskResponse{}, err
	}

	summary, err := s.repo.GetPracticeSummary(ctx, userID, task.LessonID)
	if err != nil {
		return CheckPracticeTaskResponse{}, err
	}

	message := "Спробуйте ще раз"
	if isCorrect {
		message = "Правильно"
	}

	return CheckPracticeTaskResponse{
		TaskID:                  taskID,
		IsCorrect:               isCorrect,
		Message:                 message,
		CompletedTaskIDs:        completedTaskIDs,
		LessonPracticeCompleted: summary.IsCompleted,
	}, nil
}

func (s *Service) GetAdminPracticeTasks(ctx context.Context, lessonID int) ([]PracticeTask, error) {
	if lessonID <= 0 {
		return nil, ErrInvalidID
	}

	return s.repo.GetAdminPracticeTasks(ctx, lessonID)
}

func (s *Service) CreatePracticeTask(ctx context.Context, lessonID int, req CreatePracticeTaskRequest) (PracticeTask, error) {
	if lessonID <= 0 {
		return PracticeTask{}, ErrInvalidID
	}

	title := strings.TrimSpace(req.Title)
	description := strings.TrimSpace(req.Description)

	if title == "" || description == "" || strings.TrimSpace(req.ExpectedOutput) == "" || req.OrderNum <= 0 {
		return PracticeTask{}, ErrInvalidPracticeTask
	}

	exists, err := s.repo.PracticeTaskOrderExists(ctx, lessonID, req.OrderNum, 0)
	if err != nil {
		return PracticeTask{}, err
	}

	if req.IsActive && exists {
		return PracticeTask{}, ErrDuplicateOrderNum
	}

	req.Title = title
	req.Description = description

	return s.repo.CreatePracticeTask(ctx, lessonID, req)
}

func (s *Service) UpdatePracticeTask(ctx context.Context, taskID int, req UpdatePracticeTaskRequest) (PracticeTask, error) {
	if taskID <= 0 {
		return PracticeTask{}, ErrInvalidID
	}

	currentTask, err := s.repo.GetAdminPracticeTaskByID(ctx, taskID)
	if err != nil {
		return PracticeTask{}, err
	}

	if req.Title != nil {
		title := strings.TrimSpace(*req.Title)
		if title == "" {
			return PracticeTask{}, ErrInvalidPracticeTask
		}
		req.Title = &title
	}

	if req.Description != nil {
		description := strings.TrimSpace(*req.Description)
		if description == "" {
			return PracticeTask{}, ErrInvalidPracticeTask
		}
		req.Description = &description
	}

	if req.ExpectedOutput != nil {
		if strings.TrimSpace(*req.ExpectedOutput) == "" {
			return PracticeTask{}, ErrInvalidPracticeTask
		}
	}

	targetOrderNum := currentTask.OrderNum
	if req.OrderNum != nil {
		if *req.OrderNum <= 0 {
			return PracticeTask{}, ErrInvalidPracticeTask
		}
		targetOrderNum = *req.OrderNum
	}

	targetIsActive := currentTask.IsActive
	if req.IsActive != nil {
		targetIsActive = *req.IsActive
	}

	if targetIsActive {
		exists, err := s.repo.PracticeTaskOrderExists(ctx, currentTask.LessonID, targetOrderNum, taskID)
		if err != nil {
			return PracticeTask{}, err
		}

		if exists {
			return PracticeTask{}, ErrDuplicateOrderNum
		}
	}

	return s.repo.UpdatePracticeTask(ctx, taskID, req)
}

func makePracticeSummary(activeTaskCount int, completedTaskCount int) PracticeSummary {
	return PracticeSummary{
		ActiveTaskCount:    activeTaskCount,
		CompletedTaskCount: completedTaskCount,
		IsCompleted:        activeTaskCount > 0 && activeTaskCount == completedTaskCount,
	}
}

func normalizeOutput(output string) string {
	output = strings.ReplaceAll(output, "\r\n", "\n")
	output = strings.ReplaceAll(output, "\r", "\n")

	lines := strings.Split(output, "\n")
	for index, line := range lines {
		lines[index] = strings.TrimRight(line, " \t")
	}

	return strings.TrimRight(strings.Join(lines, "\n"), "\n")
}
