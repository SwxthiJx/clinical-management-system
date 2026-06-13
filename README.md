# Clinic Appointment Scheduling System

A full-stack appointment management system for patients, doctors, and administrators.

## Tech Stack

- MongoDB + Mongoose
- Express.js + Node.js
- React.js + Vite
- JWT authentication
- Role-based access control

## Features

- Patient, doctor, and admin roles
- Secure cookie authentication with rotating refresh tokens
- Permission-based API authorization and CSRF protection
- Patient email verification and password reset/change flows
- Patient-only public registration and admin-managed doctor accounts
- Request validation and API rate limiting
- Doctor availability management
- Patient-visible doctor profiles with education, experience, languages, and clinical interests
- Appointment confirmation, cancellation, completion, and reminder emails
- Conflict-safe appointment rescheduling with fresh reminders and participant notifications
- Structured doctor consultation notes with draft/finalized workflows
- Patient-safe clinical note viewing with doctor-only private fields
- Secure patient medical profiles for allergies, conditions, medications, age, blood group, and emergency contacts
- Appointment-scoped medical profile access for assigned doctors
- Doctor search by name with specialty filtering
- Admin analytics for appointment volume, cancellations, active patients, doctor utilization, and specialty demand
- Appointment filtering by status and date for every role
- Conflict-free appointment booking
- Generated bookable slots from doctor availability
- Schedule exceptions for blocked doctor dates
- Idempotent booking requests for safer retries
- Appointment status transition rules
- Appointment status updates and cancellation
- Admin dashboard for users and all appointments
- Role-aware routed frontend pages with protected navigation
- TanStack Query caching and mutation invalidation
- Repository/service/controller backend architecture
- Interactive OpenAPI documentation
- Structured JSON request and error logs
- Liveness, readiness, and administrator operational metrics
- Persistent audit trail for security-sensitive actions
- Automated backend and frontend test suites

## Project Structure

```text
client/src/
  components/   Shared interface components
  contexts/     Authentication state
  hooks/        TanStack Query API hooks
  pages/        Role-aware routed pages

server/src/
  controllers/  HTTP request and response adapters
  services/     Business rules and use cases
  repositories/ Database access
  models/       MongoDB domain models
  openapi/      OpenAPI specification
  __tests__/    Backend API and domain tests
```

## Setup

1. Install dependencies:

```bash
npm run install:all
```

2. Create the server environment file:

```bash
cp server/.env.example server/.env
```

3. Update `server/.env` with your MongoDB URI and JWT secret.

4. Migrate existing users to the Phase 1 security fields:

```bash
npm run migrate:phase1 --prefix server
```

This migration is non-destructive and does not remove appointments.

5. Start both apps:

```bash
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:5001`
API docs: `http://localhost:5001/api/docs`

Run all automated tests:

```bash
npm test
```

## Demo Accounts

Run the seed script after configuring `.env`:

```bash
npm run seed --prefix server
```

| Role | Username | Password |
| --- | --- | --- |
| Admin | clinic-admin | Admin1234! |
| Doctor | dr-maya-rao | Doctor123! |
| Doctor | dr-arjun-mehta | Doctor123! |
| Doctor | dr-neha-iyer | Doctor123! |
| Doctor | dr-farah-khan | Doctor123! |
| Doctor | dr-kabir-sen | Doctor123! |
| Doctor | dr-sara-thomas | Doctor123! |
| Patient | alex-patient | Patient123! |
| Patient | priya-nair | Patient123! |
| Patient | rahul-verma | Patient123! |
| Patient | ananya-sharma | Patient123! |
| Patient | vikram-patel | Patient123! |
| Patient | meera-joseph | Patient123! |

Email login also works.

To add only missing demo patients without deleting current data, run:

```bash
npm run seed:patients --prefix server
```

To add or refresh the demo doctor profiles without deleting current data, run:

```bash
npm run seed:doctor-profiles --prefix server
```

Demo credentials are never displayed by default. To show the demo account picker
temporarily during local development, create `client/.env.local` with:

```env
VITE_SHOW_DEMO_LOGINS=true
```

Do not enable this setting in a deployed environment. Seeded demo accounts should
also be removed or assigned unique passwords before production deployment.

## API Overview

The machine-readable OpenAPI document is available at
`GET /api/openapi.json`. Interactive Swagger documentation is served at
`GET /api/docs`.

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/change-password`

### Users

- `GET /api/users/doctors`
- `GET /api/users`
- `POST /api/users/doctors`
- `PATCH /api/users/:id/active`
- `GET /api/users/me/medical-profile`
- `PUT /api/users/me/medical-profile`
- `GET /api/users/:id/medical-profile`

Patient medical information is stored separately from general account records so it is
not returned by user-list or authentication endpoints. Patients can update only their
own profile. Doctors can read a profile only when they have a booked or completed
appointment with that patient, while administrators have read-only access. Medical
content is excluded from audit metadata.

### Appointments

- `GET /api/appointments`
- `POST /api/appointments`
- `GET /api/appointments/slots`
- `PATCH /api/appointments/:id/reschedule`
- `PATCH /api/appointments/:id/status`
- `PATCH /api/appointments/:id/cancel`
- `GET /api/appointments/:id/consultation-note`
- `PUT /api/appointments/:id/consultation-note`

The assigned doctor can save consultation notes as drafts and finalize them for the
patient. Patients only receive finalized clinical fields. Private doctor notes remain
visible only to the assigned doctor and administrators. Audit logs record note actions
and revision numbers without storing clinical text.

## Authentication Security

- Access and refresh tokens are stored in `HttpOnly` cookies.
- Refresh tokens are hashed in MongoDB, rotated after use, and grouped into token families.
- Reuse of a revoked refresh token revokes the entire token family.
- State-changing authenticated requests require a matching CSRF cookie/header token.
- Password changes and resets revoke all existing sessions.
- Development verification/reset links are printed to the server terminal when SMTP is not configured.

## Production Authentication Configuration

Use HTTPS and configure:

```env
NODE_ENV=production
CLIENT_URL=https://your-frontend.example
APP_BASE_URL=https://your-frontend.example
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
JWT_SECRET=a-unique-random-secret-with-at-least-32-characters
```

If the frontend and API use the same site, prefer `COOKIE_SAME_SITE=lax`.
Configure the `SMTP_*` variables to deliver verification and password-reset emails.
Never commit `server/.env`.

Appointment notifications use the same SMTP configuration. Booking confirmations,
cancellations, and completion notices are sent to both the patient and doctor.
The reminder scheduler sends one reminder per booked appointment within the
configured lead window.

```env
ENABLE_APPOINTMENT_REMINDERS=true
APPOINTMENT_REMINDER_HOURS=24
REMINDER_SCAN_INTERVAL_MINUTES=15
NOTIFICATION_TIME_ZONE=Asia/Kolkata
```

When SMTP is not configured in development, notification previews are written as
structured development logs. In production, configure SMTP before enabling reminders.

The Atlas database password previously used during development should be rotated in
MongoDB Atlas before deployment, then updated only in the deployment secret manager
and the local ignored `.env` file.

### Availability

- `GET /api/availability`
- `POST /api/availability`
- `DELETE /api/availability/:id`

### Appointments

- `GET /api/appointments`
- `GET /api/appointments/slots`
- `POST /api/appointments`
- `PATCH /api/appointments/:id/status`
- `PATCH /api/appointments/:id/reschedule`
- `PATCH /api/appointments/:id/cancel`

### Operations

- `GET /api/health`
- `GET /api/ready`
- `GET /api/system/status` (admin)
- `GET /api/system/audit-logs` (admin)

## Phase 2 Scheduling

- Patients now select from generated available slots instead of guessing a date/time.
- Doctors can block full dates as schedule exceptions.
- Booking requests can include an `idempotencyKey` so retrying the same request does not create duplicates.
- Appointments can transition from `booked` to `completed` or `cancelled`; terminal statuses cannot be changed again.
- Patients, assigned doctors, and administrators can move booked appointments to another generated slot for the same doctor.
- Rescheduling revalidates availability and conflicts, records an audit event, resets the reminder cycle, and notifies both participants.

## Phase 3 Architecture

- React Router separates login, appointments, booking, schedule, admin, and security pages.
- Protected routes and role checks keep users within their permitted workflows.
- TanStack Query centralizes server-state caching, loading states, and mutation refreshes.
- Express controllers now delegate business rules to services and persistence to repositories.
- OpenAPI and Swagger provide a browsable contract for the REST API.

## Phase 4 Quality And Observability

- Structured JSON logs include request IDs, response times, status codes, user context, and safe error details.
- Liveness and readiness endpoints distinguish a running process from a database-ready service.
- In-memory request metrics track traffic, server errors, active requests, and average response time.
- Administrators have an Operations page for system health and recent audit activity.
- MongoDB audit records capture important authentication, account, appointment, and scheduling changes without storing passwords, tokens, cookies, or medical reasons.
- Vitest, Supertest, Testing Library, and jsdom cover backend APIs, domain rules, protected routes, and shared frontend guidance.

## Conflict-Free Booking

The backend validates that a requested slot is inside a doctor's published availability and rejects overlapping active appointments. It also uses a MongoDB partial unique index on `(doctor, startTime)` for non-cancelled appointments so concurrent booking requests cannot double-book the same doctor slot.
