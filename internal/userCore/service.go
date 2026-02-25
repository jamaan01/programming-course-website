package userCore

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"github.com/jamaan01/kursovaia/internal/utils"
	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	Register(ctx context.Context, req RegisterRequest) (string, int, error)
	Login(ctx context.Context, req LoginRequest) (string, error)
	GetProfile(ctx context.Context, id int) (*UserDB, error)
	UpdateProfile(ctx context.Context, id int, req UpdateProfileRequest) error
}

type userService struct {
	repo UserRepository
}

var ErrEmailExists = errors.New("email already exists")
var ErrInvalidCredentials = errors.New("невірний email або пароль")

func NewUserService(repo UserRepository) UserService {
	return &userService{repo: repo}
}

func (s *userService) Register(ctx context.Context, req RegisterRequest) (string, int, error) {
	_, err := s.repo.GetUserByEmail(ctx, req.Email)

	if err == nil {
		return "", 0, ErrEmailExists
	}

	if !errors.Is(err, ErrUserNotFound) {
		return "", 0, fmt.Errorf("failed to check email: %w", err)
	}

	hash := utils.HashPassword(req.Password)

	newUser := UserDB{
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: hash,
	}

	id, err := s.repo.CreateUser(ctx, newUser)
	if err != nil {
		return "", 0, fmt.Errorf("failed to create user: %w", err)
	}

	token, err := utils.GenerateToken(id)
	if err != nil {
		slog.Error("Failed to generate token", "error", err)
		return "", 0, fmt.Errorf("помилка створення токена")
	}

	return token, id, nil
}

func (s *userService) Login(ctx context.Context, req LoginRequest) (string, error) {
	user, err := s.repo.GetUserByEmail(ctx, req.Email)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return "", ErrInvalidCredentials
		}
		slog.Error("Database error", "error", err)
		return "", err
	}

	errPasword := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if errPasword != nil {
		return "", ErrInvalidCredentials
	}

	token, err := utils.GenerateToken(user.ID)
	if err != nil {
		slog.Error("Failed to generate token", "error", err)
		return "", fmt.Errorf("помилка створення токена")
	}

	return token, nil
}

func (s *userService) GetProfile(ctx context.Context, id int) (*UserDB, error) {
	return s.repo.GetUserByID(ctx, id)
}

func (s *userService) UpdateProfile(ctx context.Context, id int, req UpdateProfileRequest) error {
	userToUpdate := UserDB{
		ID:    id,
		Name:  req.Name,
		Email: req.Email,
	}

	return s.repo.UpdateUser(ctx, userToUpdate)
}
