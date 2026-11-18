package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"library-management-system/internal/models"
	"library-management-system/internal/repositories"
	"library-management-system/internal/services"
)

type BookHandler struct {
	Service *services.BookService
}

func NewBookHandler(service *services.BookService) *BookHandler {
	return &BookHandler{Service: service}
}

func writeBookError(w http.ResponseWriter, message string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	json.NewEncoder(w).Encode(map[string]string{
		"error": message,
	})
}

func handleBookError(w http.ResponseWriter, err error) {
	if errors.Is(err, repositories.ErrDuplicateISBN) {
		writeBookError(
			w,
			"A book with this ISBN already exists",
			http.StatusConflict,
		)
		return
	}

	writeBookError(w, err.Error(), http.StatusBadRequest)
}

// GET /api/books
func (h *BookHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	books, err := h.Service.GetAll(r.Context())
	if err != nil {
		writeBookError(w, "Failed to retrieve books", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(books)
}

// GET /api/books/{id}
func (h *BookHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		writeBookError(w, "Invalid book ID", http.StatusBadRequest)
		return
	}

	book, err := h.Service.GetByID(r.Context(), id)
	if err != nil {
		writeBookError(w, "Book not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(book)
}

// POST /api/books
func (h *BookHandler) Create(w http.ResponseWriter, r *http.Request) {
	var book models.Book

	if err := json.NewDecoder(r.Body).Decode(&book); err != nil {
		writeBookError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.Service.Create(r.Context(), &book); err != nil {
		handleBookError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(book)
}

// PUT /api/books/{id}
func (h *BookHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		writeBookError(w, "Invalid book ID", http.StatusBadRequest)
		return
	}

	var book models.Book

	if err := json.NewDecoder(r.Body).Decode(&book); err != nil {
		writeBookError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	book.ID = id

	if err := h.Service.Update(r.Context(), &book); err != nil {
		handleBookError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(book)
}

// DELETE /api/books/{id}
func (h *BookHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		writeBookError(w, "Invalid book ID", http.StatusBadRequest)
		return
	}

	if err := h.Service.Delete(r.Context(), id); err != nil {
		handleBookError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
