package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize a default Gin router
	r := gin.Default()

	// Serves the entire frontend folder at the root path "/"
	// Gin will automatically look for index.html
	r.StaticFS("/", http.Dir("../frontend"))

	// Start the server on port 8080
	port := ":8080"
	log.Printf("Server starting on port %s...\n", port)
	if err := r.Run(port); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
