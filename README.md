# NyankoMatch CRM

A comprehensive Customer Relationship Management system built with Next.js, NestJS, and PostgreSQL.

## 🏗️ Project Structure

```
nyankomatch-crm/
├── frontend/          # Next.js 14 (React) frontend
├── backend/           # NestJS backend API
└── README.md
```

## 🚀 Tech Stack

### Frontend

-   **Next.js 14** with App Router
-   **TypeScript**
-   **Tailwind CSS** for styling
-   **@dnd-kit** for drag and drop (Pipeline view)
-   **Zustand** for state management
-   **React Query** for data fetching
-   **React Hook Form** with Zod validation

### Backend

-   **NestJS** framework
-   **PostgreSQL** database
-   **Prisma ORM**
-   **JWT Authentication** with refresh tokens
-   **Class Validator** for DTO validation

## 📋 Features

### Core Modules

-   ✅ Dashboard (Admin & Manager views)
-   ✅ Contacts Management
-   ✅ Deals Pipeline (Kanban, List, Forecast views)
-   ✅ Deal Details with Activities & Notes
-   ✅ Activities / To-Do List
-   ✅ Users Management (Admin only)
-   ✅ Settings (Password change, Country management)

### Role-Based Access

-   **Admin**: Full access to all features and countries
-   **Manager**: Limited access to assigned countries only

## 🛠️ Getting Started

### Prerequisites

-   Node.js 18+
-   PostgreSQL 14+
-   pnpm (recommended) or npm

### Backend Setup

```bash
cd backend
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Seed the database
pnpm prisma db seed

# Start development server
pnpm start:dev
```

### Frontend Setup

```bash
cd frontend
pnpm install

# Set up environment variables
cp .env.example .env.local

# Start development server
pnpm dev
```

## 🔐 Default Credentials

After seeding the database:

| Role    | Email                   | Password    |
| ------- | ----------------------- | ----------- |
| Admin   | admin@nyankomatch.com   | Admin123!   |
| Manager | manager@nyankomatch.com | Manager123! |

## 📡 API Endpoints

### Authentication

-   `POST /api/auth/login` - User login
-   `POST /api/auth/refresh` - Refresh access token
-   `POST /api/auth/logout` - User logout

### Users (Admin only)

-   `GET /api/users` - List all users
-   `POST /api/users` - Create user
-   `PATCH /api/users/:id` - Update user
-   `DELETE /api/users/:id` - Delete user

### Contacts

-   `GET /api/contacts` - List contacts (filtered by country for managers)
-   `POST /api/contacts` - Create contact
-   `PATCH /api/contacts/:id` - Update contact
-   `DELETE /api/contacts/:id` - Delete contact

### Deals

-   `GET /api/deals` - List deals
-   `POST /api/deals` - Create deal
-   `PATCH /api/deals/:id` - Update deal
-   `DELETE /api/deals/:id` - Delete deal
-   `PATCH /api/deals/:id/stage` - Move deal to stage

### Pipeline Stages

-   `GET /api/pipeline-stages` - List stages
-   `POST /api/pipeline-stages` - Create stage
-   `PATCH /api/pipeline-stages/:id` - Update stage
-   `DELETE /api/pipeline-stages/:id` - Delete stage
-   `PATCH /api/pipeline-stages/reorder` - Reorder stages

### Activities

-   `GET /api/activities` - List activities
-   `POST /api/activities` - Create activity
-   `PATCH /api/activities/:id` - Update activity
-   `DELETE /api/activities/:id` - Delete activity
-   `PATCH /api/activities/:id/complete` - Mark as complete

### Countries (Admin only)

-   `GET /api/countries` - List countries
-   `POST /api/countries` - Create country
-   `PATCH /api/countries/:id` - Update country
-   `DELETE /api/countries/:id` - Delete country

### Settings

-   `PATCH /api/settings/password` - Change password

## 🌍 Currency Handling

-   All values are stored in EUR
-   When filtering by country, values are converted using the country's exchange rate
-   Exchange rates are managed in Country settings
