package userCore

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepository interface {
	CreateUser(ctx context.Context, user UserDB) (int, error)
	GetUserByEmail(ctx context.Context, email string) (*UserDB, error)
	GetUserByID(ctx context.Context, id int) (*UserDB, error)
	UpdateUser(ctx context.Context, user UserDB) error
}

type userRepo struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) UserRepository {
	return &userRepo{db: db}
}

func (r *userRepo) CreateUser(сtx context.Context, user UserDB) (int, error) {

}
