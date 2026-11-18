package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"library-management-system/internal/repositories"
	"library-management-system/internal/services"
)

type LoanHandler struct {
	Service *services.LoanService
}

func NewLoanHandler(service *services.LoanService) *LoanHandler {
	return &LoanHandler{Service: service}
}

func writeLoanError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	json.NewEncoder(w).Encode(map[string]string{
		"error": message,
	})
}

func handleLoanError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, repositories.ErrLoanNotFound),
		errors.Is(err, repositories.ErrBookNotFound),
		errors.Is(err, repositories.ErrMemberNotFound):
		writeLoanError(w, http.StatusNotFound, err.Error())

	case errors.Is(err, repositories.ErrBookUnavailable),
		errors.Is(err, repositories.ErrMemberInactive),
		errors.Is(err, repositories.ErrLoanAlreadyReturned),
		errors.Is(err, repositories.ErrInventoryLimit):
		writeLoanError(w, http.StatusConflict, err.Error())

	default:
		writeLoanError(w, http.StatusInternalServerError, "An unexpected error occurred")
	}
}

// GET /api/loans
func (h *LoanHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	loans, err := h.Service.GetAll(r.Context())
	if err != nil {
		writeLoanError(w, http.StatusInternalServerError, "Failed to retrieve loans")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(loans)
}

// GET /api/loans/{id}
func (h *LoanHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		writeLoanError(w, http.StatusBadRequest, "Invalid loan ID")
		return
	}

	loan, err := h.Service.GetByID(r.Context(), id)
	if err != nil {
		handleLoanError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(loan)
}

type IssueLoanRequest struct {
	BookID   int64  `json:"book_id"`
	MemberID int64  `json:"member_id"`
	DueDate  string `json:"due_date"`
}

// POST /api/loans
func (h *LoanHandler) Issue(w http.ResponseWriter, r *http.Request) {
	var request IssueLoanRequest

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		writeLoanError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if request.BookID <= 0 || request.MemberID <= 0 {
		writeLoanError(w, http.StatusBadRequest, "Valid book and member IDs are required")
		return
	}

	dueDate, err := time.Parse("2006-01-02", request.DueDate)
	if err != nil {
		writeLoanError(w, http.StatusBadRequest, "Due date must use YYYY-MM-DD format")
		return
	}

	if request.DueDate < time.Now().Format("2006-01-02") {
		writeLoanError(w, http.StatusBadRequest, "Due date cannot be in the past")
		return
	}

	loan, err := h.Service.Issue(
		r.Context(),
		request.BookID,
		request.MemberID,
		dueDate,
	)
	if err != nil {
		handleLoanError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(loan)
}

// POST /api/loans/{id}/return
func (h *LoanHandler) Return(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		writeLoanError(w, http.StatusBadRequest, "Invalid loan ID")
		return
	}

	if err := h.Service.Return(r.Context(), id); err != nil {
		handleLoanError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
