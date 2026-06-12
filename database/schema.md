# YardHop Database Schema

## users
| Column        | Type        | Required | Notes                  |
|---------------|-------------|----------|------------------------|
| id            | int8        | yes      | Primary key            |
| email         | text        | yes      |                        |
| password_hash | text        | yes      |                        |
| name          | text        | yes      |                        |
| created_at    | timestamptz | no       | Auto-set on creation   |

## sales
| Column      | Type        | Required | Notes                  |
|-------------|-------------|----------|------------------------|
| id          | int8        | yes      | Primary key            |
| user_id     | int8        | yes      | FK → users.id          |
| title       | text        | yes      |                        |
| description | text        | no       |                        |
| address     | text        | yes      |                        |
| city        | text        | yes      |                        |
| zip         | text        | yes      |                        |
| date        | date        | yes      |                        |
| start_time  | time        | yes      |                        |
| end_time    | time        | yes      |                        |
| categories  | text        | no       | e.g. furniture, tools  |
| created_at  | timestamptz | no       | Auto-set on creation   |

## saved_sales
| Column     | Type        | Required | Notes                  |
|------------|-------------|----------|------------------------|
| id         | int8        | yes      | Primary key            |
| user_id    | int8        | yes      | FK → users.id          |
| sale_id    | int8        | yes      | FK → sales.id          |
| created_at | timestamptz | no       | Auto-set on creation   |

## Relationships
- A user can post many sales (one-to-many)
- A user can save many sales (many-to-many via saved_sales)
- Deleting a user cascades to their sales and saved entries
- Deleting a sale cascades to all saved entries for that sale


# YardHop — Database Schema

**Last updated:** Week 3  
**Database:** Supabase (PostgreSQL), West US region  
**Owner:** Tài (tai123-dev)  

---

## Week 3 Changes

- Added `password_hash` column to `users` table (used by Tee's `POST /auth/signup`)
- Added `user_id` column to `sales` table (links a sale to its owner)
- Added RLS policies for all three tables (8 policies total)

---

## Tables

### `users`

Stores user accounts. Rows are created automatically via the
`handle_new_user` trigger when someone signs up through Supabase Auth.
`password_hash` is filled separately by Tee's `POST /auth/signup` endpoint.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NO | — | Primary key — set by Supabase Auth |
| created_at | timestamptz | NO | now() | Auto-set on insert |
| email | text | NO | — | Unique per user |
| full_name | text | YES | NULL | From signup form |
| password_hash | text | YES | NULL | bcrypt hash — set by Tee's API |

---

### `sales`

Stores all yard, garage, and estate sale listings posted by sellers.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint | NO | auto | Primary key — auto increment |
| created_at | timestamptz | NO | now() | Auto-set on insert |
| title | text | NO | — | Sale listing title |
| description | text | NO | — | Full description |
| address | text | NO | — | Street address |
| city | text | NO | — | City |
| zip | text | NO | — | ZIP code |
| date | date | NO | — | Sale date (YYYY-MM-DD) |
| start_time | time | NO | — | Opening time |
| end_time | time | NO | — | Closing time |
| categories | text | YES | NULL | Comma-separated e.g. "furniture, tools" |
| user_id | uuid | YES | NULL | FK → users.id (who posted the sale) |

---

### `saved_sales`

Bookmarks — records which users saved which sales.
One row = one user saving one sale.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint | NO | auto | Primary key — auto increment |
| created_at | timestamptz | NO | now() | Auto-set on insert |
| sale_id | bigint | NO | — | FK → sales.id (CASCADE delete) |
| user_id | uuid | YES | NULL | FK → users.id (CASCADE delete) |

---

## Relationships

```
users ──────────────────── sales
  │         (user_id)        │
  │                          │
  └──── saved_sales ─────────┘
          (user_id)  (sale_id)
```

- A **user** can post many **sales** (`sales.user_id → users.id`)
- A **user** can save many **sales** (`saved_sales.user_id → users.id`)
- A **sale** can be saved by many **users** (`saved_sales.sale_id → sales.id`)
- Deleting a **sale** cascades and removes all its `saved_sales` rows
- Deleting a **user** cascades and removes all their `saved_sales` rows

---

## Row Level Security Policies

RLS is enabled on all three tables. Summary of the 8 policies:

| Table | Operation | Who | Rule |
|---|---|---|---|
| users | SELECT | authenticated | Can only read own profile |
| users | UPDATE | authenticated | Can only update own profile |
| sales | SELECT | anyone | All sales are public |
| sales | INSERT | authenticated | Any logged-in user can post |
| sales | DELETE | authenticated | Only the owner can delete |
| saved_sales | SELECT | authenticated | Only see own saved sales |
| saved_sales | INSERT | authenticated | Can only save for yourself |
| saved_sales | DELETE | authenticated | Can only remove own saved sales |

---

## Trigger

### `on_auth_user_created`

Fires after every insert into `auth.users` (Supabase Auth).
Automatically creates a matching row in `public.users`.

```sql
INSERT INTO public.users (id, email, full_name)
VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
);
```

**Note:** `password_hash` is NOT set by the trigger.
It is left NULL when using Supabase Auth (Supabase manages the password internally).
It is set by Tee's `POST /auth/signup` endpoint when using the FastAPI auth flow.

---

## API Endpoints (Tee's FastAPI — Week 3)

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | /sales | No | Fetch all sales |
| GET | /sales/{id} | No | Fetch one sale |
| POST | /sales | Yes | Create a sale |
| DELETE | /sales/{id} | Yes | Delete a sale |
| POST | /auth/signup | No | Create new user account |
| POST | /auth/login | No | Log in, returns JWT token |
| GET | /auth/me | Yes | Get current user profile |
| POST | /saved_sales | Yes | Save a sale |
| DELETE | /saved_sales/{id} | Yes | Unsave a sale |
| GET | /saved_sales | Yes | Get user's saved sales |

---

## Environment Variables

| Variable | Who Uses It | Where To Find It |
|---|---|---|
| SUPABASE_URL | Tee, John | Supabase Dashboard → Settings → API |
| SUPABASE_ANON_KEY | Tee, John | Supabase Dashboard → Settings → API |
| DATABASE_URL | Tee | Supabase Dashboard → Connect → Transaction pooler (port 6543) |
| SECRET_KEY | Tee | Generate with: `python -c "import secrets; print(secrets.token_hex(32))"` |