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
		apiGroup.POST("/lessons/:id/complete", lessonHandler.CompleteLesson)
		apiGroup.GET("/courses/:id/progress", lessonHandler.GetLessonProgress)
		apiGroup.GET("/lessons/:id/questions", questionHandler.GetStudentQuestionsByLessonID)
		apiGroup.POST("/questions/:id/answer", questionHandler.SubmitAnswer)

		adminGroup := apiGroup.Group("/admin")
		adminGroup.Use(middlewear.AdminMiddle())
		{
			adminGroup.GET("/courses", courseHandler.GetAllCoursesAdmin)
			adminGroup.POST("/courses", courseHandler.CreateCourse)
			adminGroup.GET("/courses/:id", courseHandler.GetCourseByIDAdmin)
			adminGroup.GET("/courses/:id/syllabus", courseHandler.GetCourseSyllabusAdmin)
			adminGroup.PATCH("/courses/:id/publish", courseHandler.UpdateCoursePublishStatus)
			adminGroup.POST("/courses/:id/modules", courseHandler.CreateModule)
			adminGroup.POST("/modules/:id/lessons", courseHandler.CreateLesson)
			adminGroup.POST("/lessons/:id/questions", questionHandler.CreateQuestion)
			adminGroup.GET("/lessons/:id/questions", questionHandler.GetQuestionsByLessonID)
		}
	}
	err := r.Run(":8080")
	if err != nil {
		slog.Error("Server startup failed", "error", err)
		os.Exit(1)
	}
}
