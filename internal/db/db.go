package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jamaan01/kursovaia/internal/config"
	"github.com/joho/godotenv"
)

func Connect(ctx context.Context) (*pgxpool.Pool, error) {
	_ = godotenv.Load()

	databaseURL := config.DatabaseURL()
	if databaseURL == "" {
		return nil, fmt.Errorf("DB_URL is not set")
	}

	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to postgres: %w", err)
	}

	return pool, nil
}
