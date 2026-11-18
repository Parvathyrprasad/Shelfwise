package models

import "time"

type Member struct {
	ID               int64     `json:"id"`
	MemberCode       string    `json:"member_code"`
	Name             string    `json:"name"`
	Email            string    `json:"email"`
	Phone            string    `json:"phone"`
	MembershipStatus string    `json:"membership_status"`
	JoinedAt         time.Time `json:"joined_at"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}
