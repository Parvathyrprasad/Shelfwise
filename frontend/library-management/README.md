# Shelfwise — Library Management System

Shelfwise is a full-stack Library Management System developed to manage books, library members, and borrowing activities. It provides a centralized platform for managing library operations and tracking book availability.

## Technologies Used

### Frontend
- Angular 22
- TypeScript
- HTML
- SCSS (Sass)
- CSS

### Backend
- Go (Golang)
- REST APIs

### Database
- PostgreSQL

## Features

### 1. Dashboard
- View total books and total copies.
- Track available copies.
- View registered members.
- Monitor active and overdue loans.
- View recent library activities.

### 2. Book Management
- Add, view, edit, and delete books.
- Search books by title, author, and ISBN.
- Filter books by category and availability.
- Sort book records.
- View book details and borrowing history.

### 3. Member Management
- Register new members.
- View, edit, and delete member records.
- Manage member status.
- View individual member details and borrowing history.

### 4. Loan Management
- Issue books to active members.
- Set due dates for borrowed books.
- Return borrowed books.
- Track active and returned loans.
- Prevent issuing unavailable books.
- Prevent duplicate returns.
- Detect overdue loans.

## Project Structure

```text
LibraryManagementSystem/
│
├── backend/
│   ├── internal/
│   │   ├── handlers/
│   │   ├── models/
│   │   ├── repositories/
│   │   └── services/
│   ├── main.go
│   └── go.mod
│
├── frontend/
│   └── library-management/
│       ├── src/
│       │   ├── app/
│       │   └── styles.scss
│       ├── angular.json
│       └── package.json
│
└── README.md
```

## Prerequisites

Make sure the following are installed:

- Go
- Node.js and npm
- Angular CLI
- PostgreSQL
- Visual Studio Code (recommended)

## How to Run the Application

### 1. Start PostgreSQL

Make sure PostgreSQL is running and the application database and database connection settings are configured correctly.

### 2. Start the Backend

Open a terminal in the project directory and navigate to the backend folder:

```bash
cd backend
```

Download the Go dependencies:

```bash
go mod download
```

Start the backend server:

```bash
go run main.go
```

The backend API runs at:

http://localhost:8080

### 3. Start the Frontend

Open another terminal in the project directory and navigate to the Angular application:

```bash
cd frontend/library-management
```

Install the frontend dependencies:

```bash
npm install
```

Start the Angular development server:

```bash
ng serve
```

Open the application in your browser:

http://localhost:4200

## Build

To create a production build, navigate to the Angular application directory and run:

```bash
ng build
```

The build output is generated in the `dist/` directory.

## Styling

The frontend uses SCSS for styling.

- Global stylesheet: `src/styles.scss`
- Angular component styles are configured to use SCSS.
- SCSS variables and nested selectors are used in the global stylesheet.
- SCSS support is configured through the Angular project configuration.

## Validation and Error Handling

The application includes:

- Required-field validation.
- Book availability validation.
- Active member validation.
- Due date validation.
- Duplicate return prevention.
- Inventory limit protection.
- Overdue loan detection.

## Conclusion

Shelfwise is a full-stack Library Management System developed using Angular, TypeScript, Go, and PostgreSQL. It provides functionality for managing books, members, and borrowing activities through an organized application.