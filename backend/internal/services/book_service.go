package services

import (
	"context"
	"fmt"
	"strings"

	"library-management-system/internal/models"
	"library-management-system/internal/repositories"
)

type BookService struct {
	Repository *repositories.BookRepository
}

func NewBookService(repository *repositories.BookRepository) *BookService {
	return &BookService{Repository: repository}
}

func (s *BookService) GetAll(ctx context.Context) ([]models.Book, error) {
	return s.Repository.GetAll(ctx)
}

func (s *BookService) GetByID(ctx context.Context, id int64) (*models.Book, error) {
	if id <= 0 {
		return nil, fmt.Errorf("invalid book ID")
	}

	return s.Repository.GetByID(ctx, id)
}

func (s *BookService) Create(ctx context.Context, book *models.Book) error {
	book.Title = strings.TrimSpace(book.Title)
	book.Author = strings.TrimSpace(book.Author)
	book.ISBN = strings.TrimSpace(book.ISBN)
	book.Category = strings.TrimSpace(book.Category)

	if book.Title == "" || book.Author == "" ||
		book.ISBN == "" || book.Category == "" {
		return fmt.Errorf("all book fields are required")
	}

	if book.TotalCopies <= 0 {
		return fmt.Errorf("total copies must be greater than zero")
	}

	book.AvailableCopies = book.TotalCopies

	return s.Repository.Create(ctx, book)
}

func (s *BookService) Update(ctx context.Context, book *models.Book) error {
	if book.ID <= 0 {
		return fmt.Errorf("invalid book ID")
	}

	book.Title = strings.TrimSpace(book.Title)
	book.Author = strings.TrimSpace(book.Author)
	book.ISBN = strings.TrimSpace(book.ISBN)
	book.Category = strings.TrimSpace(book.Category)

	if book.Title == "" || book.Author == "" ||
		book.ISBN == "" || book.Category == "" {
		return fmt.Errorf("all book fields are required")
	}

	if book.TotalCopies <= 0 {
		return fmt.Errorf("total copies must be greater than zero")
	}

	if book.AvailableCopies < 0 ||
		book.AvailableCopies > book.TotalCopies {
		return fmt.Errorf("invalid available copies")
	}

	return s.Repository.Update(ctx, book)
}

func (s *BookService) Delete(ctx context.Context, id int64) error {
	if id <= 0 {
		return fmt.Errorf("invalid book ID")
	}

	return s.Repository.Delete(ctx, id)
}
