# 🏷️ YardHop

> Find yard sales, garage sales, and estate sales all over New Mexico — in one app.

YardHop is marketplace for local sales. Sellers post their sales with details like time, location, and categories. Buyers browse, search, and save sales they want to visit.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Team](#team)
- [Tech Stack](#tech-stack)
- [Project Timeline](#project-timeline)
- [Getting Started](#getting-started)
- [Repository Structure](#repository-structure)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Branch Strategy](#branch-strategy)
- [Weekly Progress](#weekly-progress)

---

## Project Overview

YardHop lets anyone in New Mexico discover local sales happening today or this weekend. 

**For buyers:**
- Browse all active sales in one place
- Search by city, ZIP code, or category
- Save sales to favorites
- Get directions straight from the listing

**For sellers:**
- Post a sale in minutes
- List your time, location, and what you're selling
- Reach thousands of buyers in your area

**Key product decisions:**
- Single account model — the same account can buy and sell (like TikTok, not eBay)
- Login required to browse
- Mystery sale format — text-only category lists, no photos required
- New Mexico only (for now)

---

## Team

| Name | Role | GitHub |
|---|---|---|
| Tài | Database, Infrastructure, GitHub Admin | [@tai123-dev](https://github.com/tai123-dev) |
| Tee (Thien) | Backend — Python / FastAPI | [@thien-gif](https://github.com/thien-gif) |
| John (Johnathon) | Frontend — HTML / CSS / JavaScript | [@tryingtocode11](https://github.com/tryingtocode11) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript (vanilla) |
| Backend | Python, FastAPI |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth + JWT (python-jose) |
| Password hashing | bcrypt (passlib) |
| Payments (Week 6–8) | Stripe |
| Deployment (Week 11–12) | Railway / Render / Vercel |

---

## Project Timeline

| Weeks | Phase | Status |
|---|---|---|
| 1–2 | Planning & Setup | ✅ Done |
| 3–5 | Core Features | 🔄 In Progress |
| 6–8 | Stripe / Payments | ⏳ Upcoming |
| 9–10 | Polish & Testing | ⏳ Upcoming |
| 11–12 | Deployment | ⏳ Upcoming |
| 13–14 | Buffer | ⏳ Upcoming |

Team commits roughly 20–30 hours per week collectively.

---

## Getting Started

### Prerequisites

- Python 3.10+
- A modern web browser
- Git

### Backend (Tee)

```bash
# Clone the repo
git clone https://github.com/tai123-dev/YardHop.git
cd YardHop

# Switch to your branch
git checkout tee-backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Mac / Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Create your .env file (copy from example)
cp .env.example .env
# Then fill in your credentials in .env

# Run the server
uvicorn main:app --reload

# API will be live at:
# http://localhost:8000
# http://localhost:8000/docs  ← Swagger UI for testing
```

### Frontend (John)

```bash
# Switch to your branch
git checkout john-frontend

# Open the app — no build step needed
open index.html
# Or just double-click index.html in Finder / File Explorer
```

### Database (Tài)

The database lives in Supabase — nothing to run locally.
All schema changes go through `database/schema.sql` and are applied via the Supabase SQL Editor.

---

## Repository Structure

```
YardHop/
├── database/
│   ├── schema.sql          # Full database schema — source of truth
│   ├── schema.md           # Human-readable schema documentation
│   └── seed_data.sql       # Test data for local development
├── docs/
│   └── README.md           # This file
├── .env.example            # Template for environment variables
├── .gitignore              # Ignores .env, __pycache__, node_modules
└── [backend files]         # Tee's FastAPI code (tee-backend branch)
└── [frontend files]        # John's HTML/CSS/JS (john-frontend branch)
```

---

## Database Schema

Three tables — all with RLS enabled.

### `users`
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key — set by Supabase Auth |
| created_at | timestamptz | Auto-set |
| email | text | Required |
| full_name | text | From signup form |
| password_hash | text | bcrypt hash — set by Tee's API |

### `sales`
| Column | Type | Notes |
|---|---|---|
| id | bigint | Primary key — auto increment |
| created_at | timestamptz | Auto-set |
| title | text | Required |
| description | text | Required |
| address | text | Required |
| city | text | Required |
| zip | text | Required |
| date | date | Required (YYYY-MM-DD) |
| start_time | time | Required |
| end_time | time | Required |
| categories | text | Optional — comma separated |
| user_id | uuid | FK → users.id |

### `saved_sales`
| Column | Type | Notes |
|---|---|---|
| id | bigint | Primary key — auto increment |
| created_at | timestamptz | Auto-set |
| sale_id | bigint | FK → sales.id (CASCADE) |
| user_id | uuid | FK → users.id (CASCADE) |

Full schema details in [`database/schema.md`](./schema.md).

---

## API Endpoints

Base URL (local): `http://localhost:8000`

### Public (no auth required)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/sales` | Fetch all sales |
| GET | `/sales/{id}` | Fetch one sale |
| POST | `/auth/signup` | Create new user account |
| POST | `/auth/login` | Log in — returns JWT token |

### Protected (requires `Authorization: Bearer <token>` header)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/auth/me` | Get current user profile |
| POST | `/sales` | Create a new sale |
| DELETE | `/sales/{id}` | Delete a sale (owner only) |
| GET | `/saved_sales` | Get user's saved sales |
| POST | `/saved_sales` | Save a sale |
| DELETE | `/saved_sales/{id}` | Unsave a sale |

### Request body — POST /sales
```json
{
  "title": "Big Yard Sale",
  "description": "Everything must go!",
  "address": "123 Main St",
  "city": "Albuquerque",
  "zip": "87101",
  "date": "2026-07-05",
  "start_time": "08:00",
  "end_time": "14:00",
  "categories": "furniture, clothes, tools"
}
```

### Request body — POST /auth/signup
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "Jane Smith"
}
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values. Never commit `.env` to GitHub.

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:6543/postgres

# Auth (Tee's backend only)
SECRET_KEY=generate-with-python-secrets-token-hex-32
```

To generate a secure SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## Branch Strategy

| Branch | Owner | Purpose |
|---|---|---|
| `main` | Protected | Production-ready code only |
| `tai-infra` | Tài | Database, schema, infrastructure |
| `tee-backend` | Tee | FastAPI backend code |
| `john-frontend` | John | HTML / CSS / JavaScript |

**Rules:**
- Nobody pushes directly to `main`
- All changes go through a Pull Request
- Tài reviews and approves all PRs before merge
- Never commit `.env` — use `.env.example` as the template

---

## Weekly Progress

### Week 1–2 — Planning & Setup ✅

**Tài:**
- Created Supabase project (West US, RLS enabled)
- Designed and built database schema — `users`, `sales`, `saved_sales` tables
- Set up Supabase Auth with `handle_new_user` trigger
- Created GitHub repo with branch protection on `main`
- Set up `.env`, `.env.example`, `.gitignore`
- Pushed `schema.sql`, `schema.md`, `seed_data.sql`

**Tee:**
- Set up Python virtual environment
- Built FastAPI backend with 4 endpoints
- Connected to Supabase via transaction pooler (port 6543)
- Confirmed 200 responses from all endpoints

**John:**
- Built complete frontend UI — homepage, listing cards, detail page
- Built Create Listing form with photo upload and address autocomplete
- Built Nearby, Map, and Favorites pages
- Implemented light/dark theme toggle
- All pages running on mock data

---

### Week 3 — Core Features 🔄

**Tài:**
- Added `password_hash` column to `users` table
- Set up 8 RLS policies across all 3 tables
- Verified `handle_new_user` trigger still works correctly
- Updated `schema.sql`, `schema.md`, `seed_data.sql`

**Tee (in progress):**
- Fix DB connection — add try/finally to all routes
- Build `POST /auth/signup` with bcrypt password hashing
- Build `POST /auth/login` returning JWT token
- Build `GET /auth/me` with token verification
- Build `POST /saved_sales`, `DELETE /saved_sales/{id}`, `GET /saved_sales`

**John (in progress):**
- Replace mock data with real `fetch()` calls to Tee's API
- Wire Create Listing form to `POST /sales`
- Build Login / Signup pages connected to auth endpoints
- Wire heart button to `POST /saved_sales` and `DELETE /saved_sales/{id}`
- Wire Favorites page to `GET /saved_sales`

---