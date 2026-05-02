# NexDesk — Svendeprøve IT Support Management System

NexDesk is a support ticket management system developed as a **svendeprøve project**.  
The solution includes a **web application** for ticket handling and administration, a **REST API** for backend logic and integration, and a **.NET MAUI mobile app** used for QR-based approval flows.

The project is built with **ASP.NET Core 8**, **Razor Pages**, **Entity Framework Core**, **SQL Server / SQLite**, and **JWT-based authentication**.

---

## Overview

NexDesk is designed to digitalize and structure IT support in one system.

The platform supports:

- Complete ticket lifecycle management
- Multi-user authentication with JWT
- Role-based access control
- QR-based approval flow through .NET MAUI
- Notifications and activity history
- Audit trail and documentation
- PDF export functionality

The goal of the project is to create a realistic support system with focus on:

- usability
- separation of concerns
- security
- documentation
- maintainability

---

## Architecture Overview

NexDesk consists of three main parts:

### 1. Web Application
The web frontend is used by:
- end users
- support staff
- administrators

The web application handles ticket creation, ticket processing, comments, tasks, reporting, and administration.

### 2. Backend API
The API contains:
- business logic
- authentication and authorization
- CRUD endpoints
- QR approval logic
- database communication

### 3. .NET MAUI Mobile App
The MAUI app is used in the QR verification flow.  
It communicates with the API and supports mobile-based approval scenarios.

---

## Core Features

### Ticket Management
- Create, assign, update, and close support tickets
- Status workflow: `Open -> In Progress -> Resolved -> Closed`
- Priority handling and department-based routing

### Task Management
- Create standalone or ticket-linked tasks
- Assign tasks to support staff
- Track deadlines and responsibilities

### Comments and Documentation
- Add comments to tickets
- Keep a documented support history
- Support traceability during the case lifecycle

### QR Verification Workflow
- Generate and validate QR-based access flow
- Use time-limited tokens
- Approve report access securely through MAUI

### User and Role Management
- Permission levels:
  - `Admin (3)`
  - `Support (2)`
  - `User (1)`
- Account activation/deactivation
- Password reset flow with OTP

### Notifications
- Notify users about ticket updates and approvals
- Mark notifications as read/unread

### Audit Trail
- Record who changed what and when
- Support traceability and accountability

### Dashboard and Reporting
- Ticket overviews
- Activity insights
- PDF export for selected data

---

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Backend API | ASP.NET Core | 8.0 |
| ORM | Entity Framework Core | 8.0 |
| Frontend | Razor Pages | .NET 8 |
| Mobile | .NET MAUI | 8.0 |
| Database (Production) | SQL Server | 2019+ |
| Database (Development) | SQLite | Latest |
| Authentication | JWT (HS256) | — |

---

## Project Structure

```text
NexDesk/
├── NexDesk.API/               # ASP.NET Core REST API
│   ├── Controllers/           # API endpoints
│   ├── Services/              # Business logic
│   └── Program.cs             # Startup configuration
├── NexDesk.Domain/            # Domain models and DTOs
├── NexDesk.Infrastructure/    # EF Core, repositories, migrations
├── NexDesk.Tests/             # Unit and integration tests
├── NexDesk/                   # Razor Pages web frontend
│   ├── Pages/                 # Server-rendered pages
│   └── wwwroot/js/            # Frontend JavaScript modules
├── NexDesk.MAUI/              # .NET MAUI mobile app
└── README.md                  # Project documentation
```

---

## Prerequisites

Before running the project, make sure the following is installed:

- .NET SDK 8.0+
- Visual Studio 2022+ (recommended)
- SQL Server 2019+ or SQLite
- Entity Framework Core CLI tools

Install EF CLI if needed:

```bash
dotnet tool install --global dotnet-ef
```

---

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/seba8798/NexDesk.git
cd NexDesk
```

### 2. Restore Dependencies

```bash
dotnet restore
```

### 3. Configure Database Connection

Update `appsettings.json` in the relevant startup project with your database connection string.

Example for SQL Server:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=NexDeskDB;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

For development, SQLite can also be used if configured in the project.

### 4. Apply EF Core Migrations

```bash
dotnet ef database update --project NexDesk.Infrastructure --startup-project NexDesk.API
```

### 5. Build the Solution

```bash
dotnet build -c Debug
```

---

## Run the Full Solution

NexDesk consists of:
- `NexDesk.API` — backend API
- `NexDesk` — Razor Pages web application
- `NexDesk.MAUI` — mobile app for QR flow

### Start the API

```bash
cd NexDesk.API
dotnet run
```

### Start the Web Application

Open a new terminal:

```bash
cd NexDesk
dotnet run
```

### Start the MAUI App

Open the solution in **Visual Studio** and run the **NexDesk.MAUI** project on:
- Android emulator
- physical Android device
- other supported MAUI target (if configured)

### Default Local URLs

- **API / Swagger:** `http://localhost:5093/swagger`
- **Web application:** `http://localhost:7022`

> **Note:**  
> When running the MAUI app on a physical device, the API may need to be accessed through a **local IP address** instead of `localhost`.  
> Example: `http://192.168.x.x:5093/api/...`

---

## First-Time Setup

Before using the system for the first time, verify the following:

1. Database connection is configured correctly
2. EF Core migrations are applied
3. JWT settings are configured
4. Required roles exist:
   - Admin
   - Support
   - User
5. At least one administrator account is available
6. Optional SMTP settings are configured if password reset or email features are used

If roles or initial users are not seeded automatically, they must be created manually.

---

## Getting Started

This section describes how the system is used in practice.

### As an End User

1. Open the web application
2. Log in
3. Create a support ticket
4. Follow ticket status and updates
5. View notifications and comments

### As Support Staff

1. Open ticket overview
2. Take ownership of a ticket or assign it
3. Add comments and documentation
4. Create linked tasks if needed
5. Resolve and close the ticket

### As an Administrator

1. Log in with administrator permissions
2. Manage users and roles
3. Review activity history and audit data
4. Approve report access through the QR flow
5. Use the MAUI app where relevant in the approval process

---

## API Documentation

Swagger is available when the API is running:

```text
http://localhost:5093/swagger
```

### Main Endpoint Areas

#### Tickets
- `GET /api/tickets` — List tickets
- `POST /api/tickets` — Create ticket
- `PATCH /api/tickets/{id}` — Update ticket
- `DELETE /api/tickets/{id}` — Delete ticket

#### Reports and QR
- `GET /api/reports` — List reports
- `POST /api/reports` — Create report
- `PATCH /api/reports/{id}/approve-scan-by-token` — Approve QR-based access

#### Users
- `GET /api/users` — List users
- `GET /api/users/{id}` — Get user details
- `POST /api/users` — Create user
- `PATCH /api/users/{id}` — Update user

#### Comments
- `GET /api/comments?ticketId={id}` — Get comments for ticket
- `POST /api/comments` — Add comment
- `DELETE /api/comments/{id}` — Delete comment

#### Notifications
- `GET /api/notifications` — List notifications for current user
- `PATCH /api/notifications/{id}/mark-read` — Mark notification as read

---

## Frontend Modules

The web project contains JavaScript modules such as:

- `main.js` — Entry point and navigation
- `userDetail.js` — User profile, activity tables, PDF export
- `renderTickets.js` — Ticket list and filtering
- `renderComments.js` — Comment handling
- `renderQrDetail.js` — QR-related flow
- `tooltip.js` — Tooltip behavior

---

## Security

### Authentication
- JWT-based authentication
- Bearer token authorization
- Token TTL configuration

### Authorization
- Role-based permission levels
- Attribute-based authorization
- Ownership/resource validation where relevant

### Password Security
- Secure password hashing
- OTP-based reset flow
- Token cleanup after reset

### QR Security
- Time-limited tokens
- Expiry validation
- Revocation support

### Data Protection
- Parameterized queries through EF Core
- Razor output encoding for XSS prevention
- Anti-forgery protection for relevant requests

---

## Testing

### Run All Tests

```bash
dotnet test
```

### Run Specific Test Project

```bash
dotnet test NexDesk.Tests/
```

### Run with Code Coverage

```bash
dotnet test /p:CollectCoverage=true
```

### Manual Test Checklist

- Create ticket as end user
- Assign ticket to support staff
- Add comment to ticket
- Create linked task
- Generate QR report
- Approve via QR flow
- Verify notification is received
- Export selected data to PDF
- Test different role permissions
- Verify password reset flow

---

## Troubleshooting

### Database Connection Fails
- Verify SQL Server is running
- Check connection string in `appsettings.json`
- Verify SQL Server is reachable on the correct port
- Confirm that migrations have been applied

### Pending Migrations
```bash
dotnet ef migrations list --project NexDesk.Infrastructure
dotnet ef database update --project NexDesk.Infrastructure --startup-project NexDesk.API
```

### Token Expired
- Re-login to obtain a new JWT
- Verify token TTL settings
- Check system time synchronization

### QR Approval Fails
- Verify token is still valid
- Check MAUI app sends the correct token
- Verify report ID and token extraction logic

### MAUI Cannot Reach API
- Replace `localhost` with the machine's local IP address
- Ensure phone/emulator and API host are on the same network
- Confirm firewall rules allow traffic to the API port

---

## Deployment

### Windows Server Deployment

1. Install **.NET 8 Runtime**
2. Publish the application:

```bash
dotnet publish -c Release -o ./publish
```

3. Deploy published files to the server
4. Configure **IIS**
5. Set up **Application Pool**
6. Add **HTTPS binding** and SSL certificate
7. Configure firewall rules
8. Verify database connectivity
9. Verify Swagger/API and web frontend are reachable

---

## Development Notes

### Add a New API Endpoint

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MyFeatureController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _db.MyFeatures.ToListAsync();
        return Ok(items);
    }
}
```

### Create a New Database Migration

```bash
dotnet ef migrations add AddMyFeature --project NexDesk.Infrastructure --startup-project NexDesk.API
dotnet ef database update --project NexDesk.Infrastructure --startup-project NexDesk.API
```

---

## Svendeprøve Highlights

This project includes work with:

- multi-user authentication
- role-based access control
- ticket lifecycle management
- QR-based approval flow
- mobile integration with .NET MAUI
- API development in ASP.NET Core
- Entity Framework Core and database migrations
- documentation and deployment
- testing and troubleshooting
- security and architectural separation

---

## Known Limitations

- MAUI iOS support is not fully completed
- Email delivery depends on SMTP configuration
- Production setup depends on external infrastructure and certificate configuration

---

## Author and Project Information

**Author:** Sebastian Larsen  
**Institution:** Syddansk Erhvervsskole  
**Program:** Svendeprøve (Apprenticeship Exam)  
**Repository:** https://github.com/seba8798/NexDesk  
**License:** Proprietary (Educational Use Only)

---

## README Purpose

This README is intended to document:

- what NexDesk is
- how the solution is structured
- how to install and run it
- how the system is used in practice
- how web, API, and MAUI work together

The goal is to make the project easier to understand, present, maintain, and hand over.
