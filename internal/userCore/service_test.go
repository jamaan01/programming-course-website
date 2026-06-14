package userCore

import (
	"context"
	"errors"
	"testing"

	"golang.org/x/crypto/bcrypt"
)

type fakeUserRepo struct {
	userByEmail *UserDB
	userByID    *UserDB
	getEmailErr error
	getIDErr    error
	createID    int
	createErr   error
	updateErr   error
	roleErr     error

	createdUser UserDB
	updatedUser UserDB
	updatedRole string
}

func (r *fakeUserRepo) CreateUser(ctx context.Context, user UserDB) (int, error) {
	r.createdUser = user
	return r.createID, r.createErr
}

func (r *fakeUserRepo) GetUserByEmail(ctx context.Context, email string) (*UserDB, error) {
	return r.userByEmail, r.getEmailErr
}

func (r *fakeUserRepo) GetUserByID(ctx context.Context, id int) (*UserDB, error) {
	return r.userByID, r.getIDErr
}

func (r *fakeUserRepo) UpdateUser(ctx context.Context, user UserDB) error {
	r.updatedUser = user
	return r.updateErr
}

func (r *fakeUserRepo) UpdateUserRole(ctx context.Context, id int, role string) error {
	r.updatedRole = role
	return r.roleErr
}

func TestUserServiceRegisterSuccess(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")

	repo := &fakeUserRepo{
		getEmailErr: ErrUserNotFound,
		createID:    7,
	}
	service := NewUserService(repo)

	token, id, err := service.Register(context.Background(), RegisterRequest{
		Name:     "Maks",
		Email:    "maks@example.com",
		Password: "secret123",
	})
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if id != 7 {
		t.Fatalf("expected id 7, got %d", id)
	}
	if token == "" {
		t.Fatal("expected token")
	}
	if repo.createdUser.Email != "maks@example.com" {
		t.Fatalf("unexpected created email: %s", repo.createdUser.Email)
	}
	if bcrypt.CompareHashAndPassword([]byte(repo.createdUser.PasswordHash), []byte("secret123")) != nil {
		t.Fatal("password was not hashed correctly")
	}
}

func TestUserServiceRegisterEmailExists(t *testing.T) {
	repo := &fakeUserRepo{
		userByEmail: &UserDB{ID: 1, Email: "maks@example.com"},
	}
	service := NewUserService(repo)

	_, _, err := service.Register(context.Background(), RegisterRequest{
		Name:     "Maks",
		Email:    "maks@example.com",
		Password: "secret123",
	})
	if !errors.Is(err, ErrEmailExists) {
		t.Fatalf("expected ErrEmailExists, got %v", err)
	}
}

func TestUserServiceRegisterRepositoryError(t *testing.T) {
	repoErr := errors.New("db down")
	repo := &fakeUserRepo{getEmailErr: repoErr}
	service := NewUserService(repo)

	_, _, err := service.Register(context.Background(), RegisterRequest{
		Name:     "Maks",
		Email:    "maks@example.com",
		Password: "secret123",
	})
	if !errors.Is(err, repoErr) {
		t.Fatalf("expected wrapped repo error, got %v", err)
	}
}

func TestUserServiceLoginSuccess(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")

	hash, err := bcrypt.GenerateFromPassword([]byte("secret123"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatal(err)
	}

	repo := &fakeUserRepo{
		userByEmail: &UserDB{
			ID:           10,
			Email:        "admin@example.com",
			PasswordHash: string(hash),
			Role:         "admin",
		},
	}
	service := NewUserService(repo)

	token, err := service.Login(context.Background(), LoginRequest{
		Email:    "admin@example.com",
		Password: "secret123",
	})
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if token == "" {
		t.Fatal("expected token")
	}
}

func TestUserServiceLoginInvalidCredentials(t *testing.T) {
	hash, err := bcrypt.GenerateFromPassword([]byte("secret123"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatal(err)
	}

	repo := &fakeUserRepo{
		userByEmail: &UserDB{
			ID:           10,
			Email:        "admin@example.com",
			PasswordHash: string(hash),
			Role:         "admin",
		},
	}
	service := NewUserService(repo)

	_, err = service.Login(context.Background(), LoginRequest{
		Email:    "admin@example.com",
		Password: "wrong-password",
	})
	if !errors.Is(err, ErrInvalidCredentials) {
		t.Fatalf("expected ErrInvalidCredentials, got %v", err)
	}
}

func TestUserServiceUpdateProfilePassesDataToRepo(t *testing.T) {
	repo := &fakeUserRepo{}
	service := NewUserService(repo)

	err := service.UpdateProfile(context.Background(), 4, UpdateProfileRequest{
		Name:  "New Name",
		Email: "new@example.com",
	})
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if repo.updatedUser.ID != 4 || repo.updatedUser.Name != "New Name" || repo.updatedUser.Email != "new@example.com" {
		t.Fatalf("unexpected updated user: %+v", repo.updatedUser)
	}
}

func TestUserServiceUpdateUserRoleReturnsRepoError(t *testing.T) {
	repoErr := errors.New("update failed")
	repo := &fakeUserRepo{roleErr: repoErr}
	service := NewUserService(repo)

	err := service.UpdateUserRole(context.Background(), 4, UpdateUserRoleRequest{Role: "admin"})
	if !errors.Is(err, repoErr) {
		t.Fatalf("expected repo error, got %v", err)
	}
	if repo.updatedRole != "admin" {
		t.Fatalf("unexpected role: %s", repo.updatedRole)
	}
}
