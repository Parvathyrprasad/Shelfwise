package handlers

import (
	"net/http"

	"library-management-system/internal/middleware"
	"library-management-system/internal/repositories"
	"library-management-system/internal/services"

	"github.com/jackc/pgx/v5/pgxpool"
)

func NewRouter(db *pgxpool.Pool) http.Handler {
	mux := http.NewServeMux()

	// Repositories
	bookRepository := repositories.NewBookRepository(db)
	memberRepository := repositories.NewMemberRepository(db)
	loanRepository := repositories.NewLoanRepository(db)
	dashboardRepository := repositories.NewDashboardRepository(db)

	// Services
	bookService := services.NewBookService(bookRepository)
	memberService := services.NewMemberService(memberRepository)
	loanService := services.NewLoanService(loanRepository)
	dashboardService := services.NewDashboardService(dashboardRepository)

	// Handlers
	bookHandler := NewBookHandler(bookService)
	memberHandler := NewMemberHandler(memberService)
	loanHandler := NewLoanHandler(loanService)
	dashboardHandler := NewDashboardHandler(dashboardService)

	// Dashboard
	mux.HandleFunc("GET /api/dashboard", dashboardHandler.GetSummary)

	// Books
	mux.HandleFunc("GET /api/books", bookHandler.GetAll)
	mux.HandleFunc("GET /api/books/{id}", bookHandler.GetByID)
	mux.HandleFunc("POST /api/books", bookHandler.Create)
	mux.HandleFunc("PUT /api/books/{id}", bookHandler.Update)
	mux.HandleFunc("DELETE /api/books/{id}", bookHandler.Delete)

	// Members
	mux.HandleFunc("GET /api/members", memberHandler.GetAll)
	mux.HandleFunc("GET /api/members/{id}", memberHandler.GetByID)
	mux.HandleFunc("POST /api/members", memberHandler.Create)
	mux.HandleFunc("PUT /api/members/{id}", memberHandler.Update)
	mux.HandleFunc("DELETE /api/members/{id}", memberHandler.Delete)

	// Loans
	mux.HandleFunc("GET /api/loans", loanHandler.GetAll)
	mux.HandleFunc("GET /api/loans/{id}", loanHandler.GetByID)
	mux.HandleFunc("POST /api/loans", loanHandler.Issue)
	mux.HandleFunc("POST /api/loans/{id}/return", loanHandler.Return)

	// Middleware
	return middleware.CORS(middleware.Logger(mux))
}
