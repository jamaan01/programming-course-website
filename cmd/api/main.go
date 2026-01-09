package main

import (
	"log/slog"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/jamaan01/kursovaia/internal/handlers"
)

func main() {
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, nil)))
	r := gin.Default()

	r.POST("/register", handlers.RegisterUserHandler)

	r.Run(":8080")
}
