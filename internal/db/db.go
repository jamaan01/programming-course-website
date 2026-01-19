package db

import (
	"context"
	"log/slog"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

var Pool *pgxpool.Pool

func init() {
	err := godotenv.Load("../../.env")
	if err != nil {
		slog.Error("Error loading .env file", "error", err)
		os.Exit(1)
	}

	pool, err := pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		slog.Error("No connect pgsl", "error", err)
		os.Exit(1)
	}
	Pool = pool
}

func closeBD() {
	Pool.Close()
}
