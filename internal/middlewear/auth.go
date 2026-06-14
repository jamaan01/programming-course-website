package middlewear

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jamaan01/kursovaia/internal/config"
)

func AuthMiddle() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Відсутній заголовок авторизації"})
			return
		}

		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Невірний формат токена"})
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("неочікуваний метод підпису")
			}

			return []byte(config.JWTSecret()), nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Недійсний або прострочений токен"})
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			if FloatID, ok := claims["user_id"].(float64); ok {
				userID := int(FloatID)

				c.Set("userID", userID)

				if role, ok := claims["role"].(string); ok {
					c.Set("userRole", role)
				} else {
					c.Set("userRole", "user")
				}

				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Помилка читання даних токена"})

	}
}

func AdminMiddle() gin.HandlerFunc {
	return func(c *gin.Context) {
		roleContext, exists := c.Get("userRole")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Не знайдено роль користувача"})
			return
		}

		role, ok := roleContext.(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Помилка сервера: невірний формат ролі"})
			return
		}

		if role != "admin" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Доступ заборонено: тільки для адміністраторів"})
			return
		}

		c.Next()
	}
}
