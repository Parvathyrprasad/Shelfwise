
package repositories

import (
	"context"
	"fmt"
	"sync"

	"library-management-system/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DashboardRepository struct {
	DB *pgxpool.Pool
}

func NewDashboardRepository(db *pgxpool.Pool) *DashboardRepository {
	return &DashboardRepository{DB: db}
}

func (r *DashboardRepository) GetSummary(ctx context.Context) (*models.DashboardSummary, error) {
	summary := &models.DashboardSummary{}

	var wg sync.WaitGroup
	var summaryErr, activityErr error

	wg.Add(2)

	// Fetch dashboard counts concurrently.
	go func() {
		defer wg.Done()

		query := `
			SELECT
				(SELECT COUNT(*) FROM books),
				(SELECT COALESCE(SUM(total_copies), 0) FROM books),
				(SELECT COALESCE(SUM(available_copies), 0) FROM books),
				(SELECT COUNT(*) FROM members),
				(SELECT COUNT(*) FROM loans WHERE status = 'active'),
				(SELECT COUNT(*) FROM loans
				 WHERE status = 'active' AND due_date < CURRENT_DATE)
		`

		summaryErr = r.DB.QueryRow(ctx, query).Scan(
			&summary.TotalBooks,
			&summary.TotalCopies,
			&summary.AvailableCopies,
			&summary.TotalMembers,
			&summary.ActiveLoans,
			&summary.OverdueLoans,
		)

		if summaryErr != nil {
			summaryErr = fmt.Errorf("failed to retrieve dashboard summary: %w", summaryErr)
		}
	}()

	// Fetch recent activity concurrently.
	go func() {
		defer wg.Done()

		activityQuery := `
			SELECT id, activity_type, book_title, member_name, activity_date
			FROM (
				SELECT
					l.id,
					'issued'::text AS activity_type,
					b.title AS book_title,
					m.name AS member_name,
					TO_CHAR(l.issue_date, 'YYYY-MM-DD') AS activity_date
				FROM loans l
				JOIN books b ON b.id = l.book_id
				JOIN members m ON m.id = l.member_id

				UNION ALL

				SELECT
					l.id,
					'returned'::text AS activity_type,
					b.title AS book_title,
					m.name AS member_name,
					TO_CHAR(l.return_date, 'YYYY-MM-DD') AS activity_date
				FROM loans l
				JOIN books b ON b.id = l.book_id
				JOIN members m ON m.id = l.member_id
				WHERE l.return_date IS NOT NULL
			) AS activities
			ORDER BY activity_date DESC
			LIMIT 8
		`

		rows, err := r.DB.Query(ctx, activityQuery)
		if err != nil {
			activityErr = fmt.Errorf("failed to retrieve recent activity: %w", err)
			return
		}
		defer rows.Close()

		summary.RecentActivity = []models.RecentActivity{}

		for rows.Next() {
			var activity models.RecentActivity

			if err := rows.Scan(
				&activity.ID,
				&activity.Type,
				&activity.BookTitle,
				&activity.MemberName,
				&activity.Date,
			); err != nil {
				activityErr = fmt.Errorf("failed to read recent activity: %w", err)
				return
			}

			summary.RecentActivity = append(summary.RecentActivity, activity)
		}

		if err := rows.Err(); err != nil {
			activityErr = fmt.Errorf("failed while reading recent activity: %w", err)
		}
	}()

	wg.Wait()

	if summaryErr != nil {
		return nil, summaryErr
	}

	if activityErr != nil {
		return nil, activityErr
	}

	return summary, nil
}
