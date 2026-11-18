package repositories

import (
	"context"
	"errors"
	"fmt"

	"library-management-system/internal/models"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrDuplicateISBN = errors.New("a book with this ISBN already exists")

type BookRepository struct {
	DB *pgxpool.Pool
}

func NewBookRepository(db *pgxpool.Pool) *BookRepository {
	return &BookRepository{DB: db}
}

func (r *BookRepository) GetAll(ctx context.Context) ([]models.Book, error) {
	query := `
		SELECT id, title, author, isbn, category,
		       total_copies, available_copies, created_at, updated_at
		FROM books
		ORDER BY id DESC
	`

	rows, err := r.DB.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch books: %w", err)
	}
	defer rows.Close()

	books := make([]models.Book, 0)

	for rows.Next() {
		var book models.Book

		err := rows.Scan(
			&book.ID,
			&book.Title,
			&book.Author,
			&book.ISBN,
			&book.Category,
			&book.TotalCopies,
			&book.AvailableCopies,
			&book.CreatedAt,
			&book.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan book: %w", err)
		}

		books = append(books, book)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error reading books: %w", err)
	}

	return books, nil
}

func (r *BookRepository) GetByID(ctx context.Context, id int64) (*models.Book, error) {
	query := `
		SELECT id, title, author, isbn, category,
		       total_copies, available_copies, created_at, updated_at
		FROM books
		WHERE id = $1
	`

	var book models.Book

	err := r.DB.QueryRow(ctx, query, id).Scan(
		&book.ID,
		&book.Title,
		&book.Author,
		&book.ISBN,
		&book.Category,
		&book.TotalCopies,
		&book.AvailableCopies,
		&book.CreatedAt,
		&book.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch book: %w", err)
	}

	return &book, nil
}

func (r *BookRepository) Create(ctx context.Context, book *models.Book) error {
	query := `
		INSERT INTO books (
			title, author, isbn, category, total_copies, available_copies
		)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`

	err := r.DB.QueryRow(
		ctx,
		query,
		book.Title,
		book.Author,
		book.ISBN,
		book.Category,
		book.TotalCopies,
		book.AvailableCopies,
	).Scan(&book.ID, &book.CreatedAt, &book.UpdatedAt)

	if err != nil {
		var pgErr *pgconn.PgError

		if errors.As(err, &pgErr) &&
			pgErr.Code == "23505" &&
			pgErr.ConstraintName == "books_isbn_key" {
			return ErrDuplicateISBN
		}

		return fmt.Errorf("failed to create book: %w", err)
	}

	return nil
}

func (r *BookRepository) Update(ctx context.Context, book *models.Book) error {
	query := `
		UPDATE books
		SET title = $1,
		    author = $2,
		    isbn = $3,
		    category = $4,
		    total_copies = $5,
		    available_copies = $6,
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = $7
		RETURNING updated_at
	`

	err := r.DB.QueryRow(
		ctx,
		query,
		book.Title,
		book.Author,
		book.ISBN,
		book.Category,
		book.TotalCopies,
		book.AvailableCopies,
		book.ID,
	).Scan(&book.UpdatedAt)

	if err != nil {
		var pgErr *pgconn.PgError

		if errors.As(err, &pgErr) &&
			pgErr.Code == "23505" &&
			pgErr.ConstraintName == "books_isbn_key" {
			return ErrDuplicateISBN
		}

		return fmt.Errorf("failed to update book: %w", err)
	}

	return nil
}

func (r *BookRepository) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM books WHERE id = $1`

	result, err := r.DB.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete book: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("book with ID %d not found", id)
	}

	return nil
}
