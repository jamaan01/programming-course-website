package models

import (
	"time"

	"github.com/jamaan01/kursovaia/internal/db"
)

type User struct {
	Name     string `json:"name" binding:"required,min=2,max=60"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6,max=72"`
}

type UserBD struct {
	ID           int       `db:"id"`
	Name         string    `db:"name"`
	Email        string    `db:"email"`
	PasswordHash string    `db:"password_hash"`
	CreateAt     time.Time `db:"created_at"`
}

func NewUser(name string, email string, password string) *UserBD {
	return &UserBD{
		Name:         name,
		Email:        email,
		PasswordHash: string(db.HashPassword(password)),
	}
}
