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
- Conflict-free appointment booking
- Appointment status updates and cancellation
- Admin dashboard for users and all appointments

## Project Structure

```text
client/   React frontend
server/   Express API and MongoDB models
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

Email login also works.

## API Overview

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

The Atlas database password previously used during development should be rotated in
MongoDB Atlas before deployment, then updated only in the deployment secret manager
and the local ignored `.env` file.

### Availability

- `GET /api/availability`
- `POST /api/availability`
- `DELETE /api/availability/:id`

### Appointments

- `GET /api/appointments`
- `POST /api/appointments`
- `PATCH /api/appointments/:id/status`
- `PATCH /api/appointments/:id/cancel`

## Conflict-Free Booking

The backend validates that a requested slot is inside a doctor's published availability and rejects overlapping active appointments. It also uses a MongoDB partial unique index on `(doctor, startTime)` for non-cancelled appointments so concurrent booking requests cannot double-book the same doctor slot.
