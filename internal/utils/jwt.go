package utils

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jamaan01/kursovaia/internal/config"
)

func GenerateToken(userID int, role string) (string, error) {
	secretKey := []byte(config.JWTSecret())

	claim := jwt.MapClaims{
		"user_id": userID,
		"role":    role,
		"exp":     time.Now().Add(time.Hour * 24 * 30).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claim)
	return token.SignedString(secretKey)
}
