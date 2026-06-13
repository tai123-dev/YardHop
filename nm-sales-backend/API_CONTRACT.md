# NM Sales App — API Contract

**Base URL (Railway):** `https://your-railway-url.up.railway.app` ← update once deployed  
**Base URL (local):** `http://127.0.0.1:8000`

---

## GET /

Health check — confirms server is running.

**Auth:** No  
**Response:** `{ "message": "NM Sales API is running" }`

---

## GET /sales

Returns sales listings. Supports optional city and date filters.

**Auth:** No  
**Query params:**
- `city` (optional) — filter by city, case-insensitive. Example: `GET /sales?city=Albuquerque`
- `date` (optional, YYYY-MM-DD) — filter by exact date. Example: `GET /sales?date=2026-07-05`
- Both can be combined: `GET /sales?city=Albuquerque&date=2026-07-05`

**Response:**
```json
[
  {
    "id": 1,
    "title": "Big yard sale",
    "address": "123 Main St",
    "city": "Albuquerque",
    "zip": "87101",
    "date": "2026-06-07",
    "start_time": "08:00:00",
    "end_time": "14:00:00",
    "description": "Furniture, clothes, tools",
    "categories": "furniture"
  }
]
```

---

## GET /sales/{id}

Returns a single sale by ID.

**Auth:** No  
**Response:** same shape as one item above  
**Error (404):** `{ "detail": "Sale not found" }`

---

## POST /sales

Creates a new sale. Records who posted it via JWT token.

**Auth:** Yes — `Authorization: Bearer <token>`

**Request body:**
```json
{
  "title": "Big yard sale",
  "address": "123 Main St",
  "city": "Albuquerque",
  "zip": "87101",
  "date": "2026-07-05",
  "start_time": "08:00",
  "end_time": "14:00",
  "description": "Optional",
  "categories": "Optional"
}
```

**Required fields:** `title`, `address`, `city`, `date`, `start_time`  
**Optional fields:** `zip`, `end_time`, `description`, `categories`

**Response:** `{ "message": "Sale created", "id": 7 }`  
**Error (401):** Missing or invalid token

---

## DELETE /sales/{id}

Deletes a sale by ID.

**Auth:** No  
**Response:** `{ "message": "Sale 5 deleted" }`  
**Error (404):** `{ "detail": "Sale not found" }`

---

## POST /auth/signup

Creates a new user account.

**Auth:** No

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "securepass123",
  "full_name": "Jane Smith"
}
```

**Response:** `{ "message": "User created", "user_id": "uuid-here" }`  
**Error (400):** Email already registered

---

## POST /auth/login

Logs in and returns a JWT token.

**Auth:** No

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "user": { "id": "uuid", "email": "user@example.com", "full_name": "Jane Smith" }
}
```

**Error (401):** Invalid email or password

---

## GET /auth/me

Returns the currently logged-in user's profile.

**Auth:** Yes — `Authorization: Bearer <token>`

**Response:**
```json
{ "id": "uuid", "email": "user@example.com", "full_name": "Jane Smith" }
```

**Error (401):** Missing or invalid token

---

## POST /saved_sales

Saves a sale to the user's favorites.

**Auth:** Yes — `Authorization: Bearer <token>`

**Request body:** `{ "sale_id": 7 }`

**Response:** `{ "message": "Sale saved" }`  
**Error (400):** Already saved  
**Error (404):** Sale not found

---

## DELETE /saved_sales/{id}

Removes a sale from the user's favorites.

**Auth:** Yes — `Authorization: Bearer <token>`

**Response:** `{ "message": "Sale removed from saved" }`  
**Error (404):** Saved sale not found for this user

---

## GET /saved_sales

Returns all sales the logged-in user has saved.

**Auth:** Yes — `Authorization: Bearer <token>`

**Response:** same shape as GET /sales (array of sale objects)

---

## Notes for John

- Date format: `YYYY-MM-DD`
- Time format: `HH:MM` or `HH:MM:SS`
- Optional fields may be `null` in GET responses
- All responses are JSON
- For protected endpoints: click **Authorize** in Swagger UI (`/docs`) and paste your token
- Token expires after 24 hours — log in again to get a new one
