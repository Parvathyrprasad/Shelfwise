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

type MemberHandler struct {
	Service *services.MemberService
}

func NewMemberHandler(service *services.MemberService) *MemberHandler {
	return &MemberHandler{Service: service}
}

func writeMemberError(w http.ResponseWriter, message string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{
		"error": message,
	})
}

func handleMemberError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, repositories.ErrDuplicateMemberCode):
		writeMemberError(w, "A member with this member code already exists", http.StatusConflict)

	case errors.Is(err, repositories.ErrDuplicateEmail):
		writeMemberError(w, "A member with this email already exists", http.StatusConflict)

	default:
		writeMemberError(w, err.Error(), http.StatusBadRequest)
	}
}

// GET /api/members
func (h *MemberHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	members, err := h.Service.GetAll(r.Context())
	if err != nil {
		writeMemberError(w, "Failed to retrieve members", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(members)
}

// GET /api/members/{id}
func (h *MemberHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		writeMemberError(w, "Invalid member ID", http.StatusBadRequest)
		return
	}

	member, err := h.Service.GetByID(r.Context(), id)
	if err != nil {
		writeMemberError(w, "Member not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(member)
}

// POST /api/members
func (h *MemberHandler) Create(w http.ResponseWriter, r *http.Request) {
	var member models.Member

	if err := json.NewDecoder(r.Body).Decode(&member); err != nil {
		writeMemberError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.Service.Create(r.Context(), &member); err != nil {
		handleMemberError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(member)
}

// PUT /api/members/{id}
func (h *MemberHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		writeMemberError(w, "Invalid member ID", http.StatusBadRequest)
		return
	}

	var member models.Member

	if err := json.NewDecoder(r.Body).Decode(&member); err != nil {
		writeMemberError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	member.ID = id

	if err := h.Service.Update(r.Context(), &member); err != nil {
		handleMemberError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(member)
}

// DELETE /api/members/{id}
func (h *MemberHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		writeMemberError(w, "Invalid member ID", http.StatusBadRequest)
		return
	}

	if err := h.Service.Delete(r.Context(), id); err != nil {
		writeMemberError(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
