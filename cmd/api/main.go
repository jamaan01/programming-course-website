package main

import (
	"log/slog"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/jamaan01/kursovaia/internal/db"
	"github.com/jamaan01/kursovaia/internal/handlers"
	"github.com/jamaan01/kursovaia/internal/userCore"
)

func main() {
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, nil)))

	userRepo := userCore.NewUserRepository(db.Pool)
	userService := userCore.NewUserService(userRepo)
	userHandler := handlers.NewAuthHandler(userService)

	r := gin.Default()

	authGroup := r.Group("/auth")
	{
		authGroup.POST("/register", userHandler.Register)
	}
	err := r.Run(":8080")
	if err != nil {
		slog.Error("Server startup failed", "error", err)
		os.Exit(1)
	}
}
