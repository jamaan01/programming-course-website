package userCore

import (
	"context"
	"errors"
	"fmt"

	"github.com/jamaan01/kursovaia/internal/utils"
)

type UserService interface {
	Register(ctx context.Context, req RegisterRequest) (int, error)
}

type userService struct {
	repo UserRepository
}

var ErrEmailExists = errors.New("email already exists")

func NewUserService(repo UserRepository) UserService {
	return &userService{repo: repo}
}

func (s *userService) Register(ctx context.Context, req RegisterRequest) (int, error) {
	_, err := s.repo.GetUserByEmail(ctx, req.Email)

	if err == nil {
		return 0, ErrEmailExists
	}

	if !errors.Is(err, ErrUserNotFound) {
		return 0, fmt.Errorf("failed to check email: %w", err)
	}

	hash := utils.HashPassword(req.Password)

	newUser := UserDB{
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: hash,
	}

	id, err := s.repo.CreateUser(ctx, newUser)
	if err != nil {
		return 0, fmt.Errorf("failed to create user: %w", err)
	}

	return id, nil
}
