package main

import (
	"log/slog"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/jamaan01/kursovaia/internal/courseCore"
	"github.com/jamaan01/kursovaia/internal/db"
	"github.com/jamaan01/kursovaia/internal/handlers"
	"github.com/jamaan01/kursovaia/internal/lessonCore"
	"github.com/jamaan01/kursovaia/internal/middlewear"
	"github.com/jamaan01/kursovaia/internal/practiceCore"
	"github.com/jamaan01/kursovaia/internal/questionCore"
	"github.com/jamaan01/kursovaia/internal/userCore"
)

func main() {
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, nil)))

	userRepo := userCore.NewUserRepository(db.Pool)
	userService := userCore.NewUserService(userRepo)
	userHandler := handlers.NewAuthHandler(userService)

	courseRepo := courseCore.NewRepository(db.Pool)
	courseService := courseCore.NewService(courseRepo)
	courseHandler := handlers.NewCourseHandler(courseService)

	lessonRepo := lessonCore.NewRepository(db.Pool)
	lessonService := lessonCore.NewService(lessonRepo)
	lessonHandler := handlers.NewLessonHandler(lessonService)

	questionRepo := questionCore.NewRepository(db.Pool)
	questionService := questionCore.NewService(questionRepo)
	questionHandler := handlers.NewQuestionHandler(questionService)

	practiceRepo := practiceCore.NewRepository(db.Pool)
	practiceService := practiceCore.NewService(practiceRepo)
	practiceHandler := handlers.NewPracticeHandler(practiceService)

	r := gin.Default()

	r.Use(middlewear.BodySizeLimit())
	r.Use(middlewear.SetupCORS())

	authGroup := r.Group("/auth")
	{
		authGroup.POST("/register", userHandler.Register)
		authGroup.POST("/login", userHandler.Login)
	}

	publicApiGroup := r.Group("/api")
	{
		publicApiGroup.GET("/courses", courseHandler.GetAllCourses)
		publicApiGroup.GET("/courses/:id", courseHandler.GetCourseByID)
		publicApiGroup.GET("/courses/:id/syllabus", courseHandler.GetCourseSyllabus)
	}

	apiGroup := r.Group("/api")
	apiGroup.Use(middlewear.AuthMiddle())
	{
		apiGroup.GET("/profile", userHandler.GetProfile)
		apiGroup.PUT("/profile", userHandler.UpdateProfile)
		apiGroup.GET("/lessons/:id", lessonHandler.GetLessonByID)
		apiGroup.POST("/courses/:id/enroll", courseHandler.EnrollUser)
		apiGroup.GET("/profile/courses", courseHandler.GetMyCourse)
		apiGroup.GET("/courses/:id/access", courseHandler.GetCourseAccess)
		apiGroup.POST("/lessons/:id/complete", lessonHandler.CompleteLesson)
		apiGroup.GET("/courses/:id/progress", lessonHandler.GetLessonProgress)
		apiGroup.GET("/lessons/:id/questions", questionHandler.GetStudentQuestionsByLessonID)
		apiGroup.POST("/questions/:id/answer", questionHandler.SubmitAnswer)
		apiGroup.GET("/lessons/:id/practice/summary", practiceHandler.GetPracticeSummary)
		apiGroup.GET("/lessons/:id/practice", practiceHandler.GetLessonPractice)
		apiGroup.POST("/practice-tasks/:id/check", practiceHandler.CheckPracticeTask)

		adminGroup := apiGroup.Group("/admin")
		adminGroup.Use(middlewear.AdminMiddle())
		{
			adminGroup.GET("/users", userHandler.GetAllUsersAdmin)
			adminGroup.GET("/course-access", courseHandler.GetCourseAccessListAdmin)
			adminGroup.POST("/course-access", courseHandler.GrantCourseAccessAdmin)
			adminGroup.PATCH("/course-access/:id/revoke", courseHandler.RevokeCourseAccessAdmin)
			adminGroup.GET("/courses", courseHandler.GetAllCoursesAdmin)
			adminGroup.POST("/courses", courseHandler.CreateCourse)
			adminGroup.GET("/courses/:id", courseHandler.GetCourseByIDAdmin)
			adminGroup.GET("/courses/:id/syllabus", courseHandler.GetCourseSyllabusAdmin)
			adminGroup.PATCH("/courses/:id", courseHandler.UpdateCourse)
			adminGroup.PATCH("/courses/:id/publish", courseHandler.UpdateCoursePublishStatus)
			adminGroup.POST("/courses/:id/modules", courseHandler.CreateModule)
			adminGroup.PATCH("/modules/:id", courseHandler.UpdateModule)
			adminGroup.POST("/modules/:id/lessons", courseHandler.CreateLesson)
			adminGroup.PATCH("/lessons/:id", courseHandler.UpdateLesson)
			adminGroup.POST("/lessons/:id/questions", questionHandler.CreateQuestion)
			adminGroup.GET("/lessons/:id/questions", questionHandler.GetQuestionsByLessonID)
			adminGroup.PATCH("/questions/:id", questionHandler.UpdateQuestion)
			adminGroup.POST("/questions/:id/options", questionHandler.CreateQuestionOption)
			adminGroup.PATCH("/questions/:id/correct-option", questionHandler.UpdateQuestionCorrectOption)
			adminGroup.PATCH("/question-options/:id", questionHandler.UpdateQuestionOption)
			adminGroup.DELETE("/question-options/:id", questionHandler.DeleteQuestionOption)
			adminGroup.GET("/lessons/:id/practice-tasks", practiceHandler.GetAdminPracticeTasks)
			adminGroup.POST("/lessons/:id/practice-tasks", practiceHandler.CreatePracticeTask)
			adminGroup.PATCH("/practice-tasks/:id", practiceHandler.UpdatePracticeTask)
		}
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	if err := r.Run(":" + port); err != nil {
		slog.Error("Server startup failed", "error", err)
		os.Exit(1)
	}
}
