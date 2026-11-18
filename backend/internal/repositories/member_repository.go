package repositories

import (
	"context"
	"errors"
	"fmt"

	"library-management-system/internal/models"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrDuplicateMemberCode = errors.New("a member with this member code already exists")
	ErrDuplicateEmail      = errors.New("a member with this email already exists")
)

type MemberRepository struct {
	DB *pgxpool.Pool
}

func NewMemberRepository(db *pgxpool.Pool) *MemberRepository {
	return &MemberRepository{DB: db}
}

func handleMemberDatabaseError(err error) error {
	var pgErr *pgconn.PgError

	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		switch pgErr.ConstraintName {
		case "members_member_code_key":
			return ErrDuplicateMemberCode
		case "members_email_key":
			return ErrDuplicateEmail
		}
	}

	return err
}

func (r *MemberRepository) GetAll(ctx context.Context) ([]models.Member, error) {
	query := `
		SELECT id, member_code, name, email, COALESCE(phone, ''),
		       membership_status, joined_at, created_at, updated_at
		FROM members
		ORDER BY id DESC
	`

	rows, err := r.DB.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch members: %w", err)
	}
	defer rows.Close()

	members := make([]models.Member, 0)

	for rows.Next() {
		var member models.Member

		err := rows.Scan(
			&member.ID,
			&member.MemberCode,
			&member.Name,
			&member.Email,
			&member.Phone,
			&member.MembershipStatus,
			&member.JoinedAt,
			&member.CreatedAt,
			&member.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan member: %w", err)
		}

		members = append(members, member)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error reading members: %w", err)
	}

	return members, nil
}

func (r *MemberRepository) GetByID(ctx context.Context, id int64) (*models.Member, error) {
	query := `
		SELECT id, member_code, name, email, COALESCE(phone, ''),
		       membership_status, joined_at, created_at, updated_at
		FROM members
		WHERE id = $1
	`

	var member models.Member

	err := r.DB.QueryRow(ctx, query, id).Scan(
		&member.ID,
		&member.MemberCode,
		&member.Name,
		&member.Email,
		&member.Phone,
		&member.MembershipStatus,
		&member.JoinedAt,
		&member.CreatedAt,
		&member.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch member: %w", err)
	}

	return &member, nil
}

func (r *MemberRepository) Create(ctx context.Context, member *models.Member) error {
	query := `
		INSERT INTO members (
			member_code, name, email, phone, membership_status
		)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, joined_at, created_at, updated_at
	`

	err := r.DB.QueryRow(
		ctx,
		query,
		member.MemberCode,
		member.Name,
		member.Email,
		member.Phone,
		member.MembershipStatus,
	).Scan(
		&member.ID,
		&member.JoinedAt,
		&member.CreatedAt,
		&member.UpdatedAt,
	)

	if err != nil {
		return handleMemberDatabaseError(err)
	}

	return nil
}

func (r *MemberRepository) Update(ctx context.Context, member *models.Member) error {
	query := `
		UPDATE members
		SET member_code = $1,
		    name = $2,
		    email = $3,
		    phone = $4,
		    membership_status = $5,
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = $6
		RETURNING updated_at
	`

	err := r.DB.QueryRow(
		ctx,
		query,
		member.MemberCode,
		member.Name,
		member.Email,
		member.Phone,
		member.MembershipStatus,
		member.ID,
	).Scan(&member.UpdatedAt)

	if err != nil {
		return handleMemberDatabaseError(err)
	}

	return nil
}

func (r *MemberRepository) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM members WHERE id = $1`

	result, err := r.DB.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete member: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("member with ID %d not found", id)
	}

	return nil
}
