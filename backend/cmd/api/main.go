package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"library-management-system/internal/database"
	"library-management-system/internal/handlers"
)

func main() {
	db, err := database.Connect()
	if err != nil {
		log.Fatal("Database connection failed:", err)
	}
	defer db.Close()

	log.Println("Successfully connected to Shelfwise PostgreSQL database!")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	router := handlers.NewRouter(db)

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("Shelfwise API server is running on http://localhost:%s", port)

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal("API server failed:", err)
	}
}
