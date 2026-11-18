package models

import "time"

type Loan struct {
	ID         int64      `json:"id"`
	BookID     int64      `json:"book_id"`
	MemberID   int64      `json:"member_id"`
	IssueDate  time.Time  `json:"issue_date"`
	DueDate    time.Time  `json:"due_date"`
	ReturnDate *time.Time `json:"return_date,omitempty"`
	Status     string     `json:"status"`
	CreatedAt  time.Time  `json:"created_at"`
}
