package services

import (
	"context"
	"fmt"
	"strings"

	"library-management-system/internal/models"
	"library-management-system/internal/repositories"
)

type MemberService struct {
	Repository *repositories.MemberRepository
}

func NewMemberService(repository *repositories.MemberRepository) *MemberService {
	return &MemberService{Repository: repository}
}

func (s *MemberService) GetAll(ctx context.Context) ([]models.Member, error) {
	return s.Repository.GetAll(ctx)
}

func (s *MemberService) GetByID(ctx context.Context, id int64) (*models.Member, error) {
	if id <= 0 {
		return nil, fmt.Errorf("invalid member ID")
	}

	return s.Repository.GetByID(ctx, id)
}

func (s *MemberService) Create(ctx context.Context, member *models.Member) error {
	member.MemberCode = strings.TrimSpace(member.MemberCode)
	member.Name = strings.TrimSpace(member.Name)
	member.Email = strings.TrimSpace(member.Email)
	member.Phone = strings.TrimSpace(member.Phone)

	if member.MemberCode == "" || member.Name == "" || member.Email == "" {
		return fmt.Errorf("member code, name and email are required")
	}

	if !strings.Contains(member.Email, "@") {
		return fmt.Errorf("invalid email address")
	}

	if member.MembershipStatus == "" {
		member.MembershipStatus = "active"
	}

	if member.MembershipStatus != "active" &&
		member.MembershipStatus != "inactive" &&
		member.MembershipStatus != "suspended" {
		return fmt.Errorf("invalid membership status")
	}

	return s.Repository.Create(ctx, member)
}

func (s *MemberService) Update(ctx context.Context, member *models.Member) error {
	if member.ID <= 0 {
		return fmt.Errorf("invalid member ID")
	}

	member.MemberCode = strings.TrimSpace(member.MemberCode)
	member.Name = strings.TrimSpace(member.Name)
	member.Email = strings.TrimSpace(member.Email)
	member.Phone = strings.TrimSpace(member.Phone)

	if member.MemberCode == "" || member.Name == "" || member.Email == "" {
		return fmt.Errorf("member code, name and email are required")
	}

	if !strings.Contains(member.Email, "@") {
		return fmt.Errorf("invalid email address")
	}

	if member.MembershipStatus != "active" &&
		member.MembershipStatus != "inactive" &&
		member.MembershipStatus != "suspended" {
		return fmt.Errorf("invalid membership status")
	}

	return s.Repository.Update(ctx, member)
}

func (s *MemberService) Delete(ctx context.Context, id int64) error {
	if id <= 0 {
		return fmt.Errorf("invalid member ID")
	}

	return s.Repository.Delete(ctx, id)
}
