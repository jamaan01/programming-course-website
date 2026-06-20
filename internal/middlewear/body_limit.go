package middlewear

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

const maxRequestBodyBytes int64 = 1 << 20

func BodySizeLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Body == nil {
			c.Next()
			return
		}

		if c.Request.ContentLength > maxRequestBodyBytes {
			c.AbortWithStatusJSON(http.StatusRequestEntityTooLarge, gin.H{"error": "Request body too large"})
			return
		}

		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxRequestBodyBytes)
		c.Next()
	}
}
