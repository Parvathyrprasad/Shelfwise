package models

type DashboardSummary struct {
	TotalBooks      int              `json:"total_books"`
	TotalCopies     int              `json:"total_copies"`
	AvailableCopies int              `json:"available_copies"`
	TotalMembers    int              `json:"total_members"`
	ActiveLoans     int              `json:"active_loans"`
	OverdueLoans    int              `json:"overdue_loans"`
	RecentActivity  []RecentActivity `json:"recent_activity"`
}

type RecentActivity struct {
	ID         int64  `json:"id"`
	Type       string `json:"type"`
	BookTitle  string `json:"book_title"`
	MemberName string `json:"member_name"`
	Date       string `json:"date"`
}
