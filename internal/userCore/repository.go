package userCore

import (
	"context"
	"errors"
	"log/slog"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrUserNotFound = errors.New("user not found")

type UserRepository interface {
	CreateUser(ctx context.Context, user UserDB) (int, error)
	GetUserByEmail(ctx context.Context, email string) (*UserDB, error)
	GetUserByID(ctx context.Context, id int) (*UserDB, error)
	UpdateUser(ctx context.Context, user UserDB) error
	UpdateUserRole(ctx context.Context, id int, role string) error
}

type userRepo struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) UserRepository {
	return &userRepo{db: db}
}

func (r *userRepo) CreateUser(ctx context.Context, user UserDB) (int, error) {
	var id int
	query := `
		INSERT INTO users (name, email, password_hash)
		VALUES ($1, $2, $3)
		RETURNING id
		`

	err := r.db.QueryRow(ctx, query, user.Name, user.Email, user.PasswordHash).Scan(&id)
	if err != nil {
		slog.Error("Failed create user", "error", err)
		return 0, err
	}

	return id, nil
}

func (r *userRepo) GetUserByEmail(ctx context.Context, email string) (*UserDB, error) {
	var user UserDB
	query := `
		SELECT id, name, email, password_hash, role, created_at
    FROM users
    WHERE email = $1
	`
	err := r.db.QueryRow(ctx, query, email).Scan(&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.Role, &user.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		slog.Error("Database error", "error", err)
		return nil, err
	}
	return &user, nil
}

func (r *userRepo) GetUserByID(ctx context.Context, id int) (*UserDB, error) {
	var user UserDB
	query := `
		SELECT id, name, email, password_hash, role, created_at
		FROM users
		WHERE id = $1
	`
	err := r.db.QueryRow(ctx, query, id).Scan(&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.Role, &user.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		slog.Error("Database error", "error", err)
		return nil, err
	}
	return &user, nil
}

func (r *userRepo) UpdateUser(ctx context.Context, user UserDB) error {
	query := `
	UPDATE users
	SET name = $1, email = $2
	WHERE id = $3
	`

	commandTag, err := r.db.Exec(ctx, query, user.Name, user.Email, user.ID)
	if err != nil {
		slog.Error("Failed to update user", "error", err)
		return err
	}

	if commandTag.RowsAffected() == 0 {
		return ErrUserNotFound
	}
	return nil
}

func (r *userRepo) UpdateUserRole(ctx context.Context, id int, role string) error {
	query := `
	UPDATE users
	SET role = $1
	WHERE id = $2
	`

	commandTag, err := r.db.Exec(ctx, query, role, id)
	if err != nil {
		slog.Error("Failed to update user role", "error", err)
		return err
	}

	if commandTag.RowsAffected() == 0 {
		return ErrUserNotFound
	}
	return nil
}
