package services

import (
	"context"
	"fmt"
	"time"

	"library-management-system/internal/models"
	"library-management-system/internal/repositories"
)

type LoanService struct {
	Repository *repositories.LoanRepository
}

func NewLoanService(repository *repositories.LoanRepository) *LoanService {
	return &LoanService{Repository: repository}
}

func (s *LoanService) GetAll(ctx context.Context) ([]models.Loan, error) {
	return s.Repository.GetAll(ctx)
}

func (s *LoanService) GetByID(ctx context.Context, id int64) (*models.Loan, error) {
	if id <= 0 {
		return nil, fmt.Errorf("invalid loan ID")
	}

	return s.Repository.GetByID(ctx, id)
}

func (s *LoanService) Issue(
	ctx context.Context,
	bookID int64,
	memberID int64,
	dueDate time.Time,
) (*models.Loan, error) {
	if bookID <= 0 || memberID <= 0 {
		return nil, fmt.Errorf("valid book and member IDs are required")
	}

	today := time.Now().Truncate(24 * time.Hour)
	dueDate = dueDate.Truncate(24 * time.Hour)

	if dueDate.Before(today) {
		return nil, fmt.Errorf("due date cannot be in the past")
	}

	return s.Repository.Issue(
		ctx,
		bookID,
		memberID,
		dueDate.Format("2006-01-02"),
	)
}

func (s *LoanService) Return(ctx context.Context, loanID int64) error {
	if loanID <= 0 {
		return fmt.Errorf("invalid loan ID")
	}

	return s.Repository.Return(ctx, loanID)
}
