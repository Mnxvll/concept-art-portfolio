package main

import (
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize a default Gin router
	r := gin.Default()

	// Define a basic GET route
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Hello from the Go Backend with Gin!",
		})
	})

	// Start the server on port 8080
	port := ":8080"
	log.Printf("Server starting on port %s...\n", port)
	if err := r.Run(port); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
