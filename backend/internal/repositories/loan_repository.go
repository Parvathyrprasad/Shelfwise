package repositories

import (
	"context"
	"errors"
	"fmt"

	"library-management-system/internal/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrLoanNotFound        = errors.New("loan not found")
	ErrBookNotFound        = errors.New("book not found")
	ErrMemberNotFound      = errors.New("member not found")
	ErrBookUnavailable     = errors.New("book is not available")
	ErrMemberInactive      = errors.New("member is not active")
	ErrLoanAlreadyReturned = errors.New("book has already been returned")
	ErrInventoryLimit      = errors.New("book availability cannot exceed total copies")
)

type LoanRepository struct {
	DB *pgxpool.Pool
}

func NewLoanRepository(db *pgxpool.Pool) *LoanRepository {
	return &LoanRepository{DB: db}
}

func (r *LoanRepository) GetAll(ctx context.Context) ([]models.Loan, error) {
	query := `
		SELECT id, book_id, member_id, issue_date,
		       due_date, return_date, status, created_at
		FROM loans
		ORDER BY id DESC
	`

	rows, err := r.DB.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch loans: %w", err)
	}
	defer rows.Close()

	loans := make([]models.Loan, 0)

	for rows.Next() {
		var loan models.Loan

		err := rows.Scan(
			&loan.ID,
			&loan.BookID,
			&loan.MemberID,
			&loan.IssueDate,
			&loan.DueDate,
			&loan.ReturnDate,
			&loan.Status,
			&loan.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan loan: %w", err)
		}

		loans = append(loans, loan)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error reading loans: %w", err)
	}

	return loans, nil
}

func (r *LoanRepository) GetByID(ctx context.Context, id int64) (*models.Loan, error) {
	query := `
		SELECT id, book_id, member_id, issue_date,
		       due_date, return_date, status, created_at
		FROM loans
		WHERE id = $1
	`

	var loan models.Loan

	err := r.DB.QueryRow(ctx, query, id).Scan(
		&loan.ID,
		&loan.BookID,
		&loan.MemberID,
		&loan.IssueDate,
		&loan.DueDate,
		&loan.ReturnDate,
		&loan.Status,
		&loan.CreatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrLoanNotFound
	}

	if err != nil {
		return nil, fmt.Errorf("failed to fetch loan: %w", err)
	}

	return &loan, nil
}

// Issue creates a loan and reduces available book copies
// within a single database transaction.
func (r *LoanRepository) Issue(
	ctx context.Context,
	bookID int64,
	memberID int64,
	dueDate string,
) (*models.Loan, error) {
	tx, err := r.DB.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	var availableCopies int

	err = tx.QueryRow(
		ctx,
		`SELECT available_copies FROM books WHERE id = $1 FOR UPDATE`,
		bookID,
	).Scan(&availableCopies)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrBookNotFound
	}

	if err != nil {
		return nil, fmt.Errorf("failed to fetch book: %w", err)
	}

	if availableCopies <= 0 {
		return nil, ErrBookUnavailable
	}

	var memberStatus string

	err = tx.QueryRow(
		ctx,
		`SELECT membership_status FROM members WHERE id = $1`,
		memberID,
	).Scan(&memberStatus)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrMemberNotFound
	}

	if err != nil {
		return nil, fmt.Errorf("failed to fetch member: %w", err)
	}

	if memberStatus != "active" {
		return nil, ErrMemberInactive
	}

	var loan models.Loan

	err = tx.QueryRow(
		ctx,
		`
		INSERT INTO loans (book_id, member_id, due_date)
		VALUES ($1, $2, $3)
		RETURNING id, book_id, member_id, issue_date,
		          due_date, return_date, status, created_at
		`,
		bookID,
		memberID,
		dueDate,
	).Scan(
		&loan.ID,
		&loan.BookID,
		&loan.MemberID,
		&loan.IssueDate,
		&loan.DueDate,
		&loan.ReturnDate,
		&loan.Status,
		&loan.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to issue book: %w", err)
	}

	result, err := tx.Exec(
		ctx,
		`UPDATE books
		 SET available_copies = available_copies - 1,
		     updated_at = CURRENT_TIMESTAMP
		 WHERE id = $1
		   AND available_copies > 0`,
		bookID,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to update book availability: %w", err)
	}

	if result.RowsAffected() == 0 {
		return nil, ErrBookUnavailable
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit loan: %w", err)
	}

	return &loan, nil
}

// Return marks a loan as returned and restores one available copy.
func (r *LoanRepository) Return(ctx context.Context, loanID int64) error {
	tx, err := r.DB.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	var bookID int64
	var status string

	err = tx.QueryRow(
		ctx,
		`SELECT book_id, status FROM loans WHERE id = $1 FOR UPDATE`,
		loanID,
	).Scan(&bookID, &status)

	if errors.Is(err, pgx.ErrNoRows) {
		return ErrLoanNotFound
	}

	if err != nil {
		return fmt.Errorf("failed to fetch loan: %w", err)
	}

	if status == "returned" {
		return ErrLoanAlreadyReturned
	}

	_, err = tx.Exec(
		ctx,
		`UPDATE loans
		 SET status = 'returned',
		     return_date = CURRENT_DATE
		 WHERE id = $1`,
		loanID,
	)

	if err != nil {
		return fmt.Errorf("failed to update loan: %w", err)
	}

	result, err := tx.Exec(
		ctx,
		`UPDATE books
		 SET available_copies = available_copies + 1,
		     updated_at = CURRENT_TIMESTAMP
		 WHERE id = $1
		   AND available_copies < total_copies`,
		bookID,
	)

	if err != nil {
		return fmt.Errorf("failed to restore book availability: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrInventoryLimit
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit return: %w", err)
	}

	return nil
}
