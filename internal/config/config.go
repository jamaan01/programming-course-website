package config

import (
	"os"
	"strings"
)

func DatabaseURL() string {
	return firstEnv("DB_URL", "DATABASE_URL")
}

func JWTSecret() string {
	return firstEnv("JWT_SECRET", "SEKRETKEY_JWT")
}

func ServerAddr() string {
	port := firstEnv("PORT")
	if port == "" {
		port = "8080"
	}
	if strings.HasPrefix(port, ":") {
		return port
	}
	return ":" + port
}

func firstEnv(keys ...string) string {
	for _, key := range keys {
		if value := strings.TrimSpace(os.Getenv(key)); value != "" {
			return value
		}
	}
	return ""
}
