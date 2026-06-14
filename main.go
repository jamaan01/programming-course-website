package main

import (
	"log/slog"
	"os"

	"github.com/jamaan01/kursovaia/internal/app"
)

func main() {
	if err := app.Run(); err != nil {
		slog.Error("Server startup failed", "error", err)
		os.Exit(1)
	}
}
