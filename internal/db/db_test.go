package db

import (
	"context"
	"log/slog"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func InitBdTest() error {
	err := godotenv.Load("../../.env")
	if err != nil {
		slog.Error("Error loading .env file", "error", err)
		return err
	}

	pool, err := pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		slog.Error("No connect pgsl", "error", err)
		return err
	}
	Pool = pool
	return nil
}
func TestInitBdTest(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://postgres:Mp010203@localhost:5432/postgres")
	err := InitBdTest()
	if err != nil {
		t.Fatalf("initBdTest() вернула ошибку: %v", err)
	}

	if Pool == nil {
		t.Fatal("Pool == nil, ожидалось подключение к базе данных")
	}

	// Проверим, что реально есть соединение
	if err := Pool.Ping(context.Background()); err != nil {
		t.Fatalf("Ping() вернул ошибку: %v", err)
	}

	// Закрываем пул после теста
	Pool.Close()
}
