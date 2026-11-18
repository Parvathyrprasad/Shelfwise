package services

import (
	"context"

	"library-management-system/internal/models"
	"library-management-system/internal/repositories"
)

type DashboardService struct {
	Repository *repositories.DashboardRepository
}

func NewDashboardService(repository *repositories.DashboardRepository) *DashboardService {
	return &DashboardService{
		Repository: repository,
	}
}

func (s *DashboardService) GetSummary(ctx context.Context) (*models.DashboardSummary, error) {
	return s.Repository.GetSummary(ctx)
}
