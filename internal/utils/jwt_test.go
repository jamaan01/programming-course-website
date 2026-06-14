package utils

import (
	"testing"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jamaan01/kursovaia/internal/config"
	"golang.org/x/crypto/bcrypt"
)

func TestGenerateTokenCreatesValidToken(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")

	tokenString, err := GenerateToken(15, "admin")
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if tokenString == "" {
		t.Fatal("expected token")
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.JWTSecret()), nil
	})
	if err != nil {
		t.Fatalf("expected valid token, got %v", err)
	}
	if !token.Valid {
		t.Fatal("token is not valid")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		t.Fatal("expected map claims")
	}
	if int(claims["user_id"].(float64)) != 15 {
		t.Fatalf("unexpected user_id: %v", claims["user_id"])
	}
	if claims["role"] != "admin" {
		t.Fatalf("unexpected role: %v", claims["role"])
	}
}

func TestHashPassword(t *testing.T) {
	hash := HashPassword("secret123")
	if hash == "" {
		t.Fatal("expected hash")
	}
	if hash == "secret123" {
		t.Fatal("password should not be stored as plain text")
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte("secret123")) != nil {
		t.Fatal("hash does not match original password")
	}
}
