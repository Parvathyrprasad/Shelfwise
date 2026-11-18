package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"library-management-system/internal/services"
)

type DashboardHandler struct {
	Service *services.DashboardService
}

func NewDashboardHandler(service *services.DashboardService) *DashboardHandler {
	return &DashboardHandler{
		Service: service,
	}
}

// GET /api/dashboard
func (h *DashboardHandler) GetSummary(w http.ResponseWriter, r *http.Request) {
	summary, err := h.Service.GetSummary(r.Context())
	if err != nil {
		log.Printf("Dashboard query failed: %v", err)
		http.Error(w, "Failed to retrieve dashboard data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(summary)
}
