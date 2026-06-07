# NM Sales App — API Contract

**Base URL (local):** `http://127.0.0.1:8000`  
**Base URL (deployed):** TBD — update once Railway is set up

---

## GET /sales

Returns all sales listings.

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

**Response:** same shape as one item above  
**Error (404):** `{ "detail": "Sale not found" }`

---

## POST /sales

Creates a new sale.

**Request body:**
```json
{
  "title": "Big yard sale",
  "address": "123 Main St",
  "city": "Albuquerque",
  "zip": "87101",
  "date": "2026-06-07",
  "start_time": "08:00:00",
  "end_time": "14:00:00",
  "description": "Optional — can be omitted",
  "categories": "Optional — can be omitted"
}
```

**Required fields:** `title`, `address`, `city`, `date`, `start_time`  
**Optional fields:** `zip`, `end_time`, `description`, `categories`

**Response:**
```json
{ "message": "Sale created", "id": 5 }
```

**Error (422):** Missing or wrong-type field — check the error detail for which field failed.

---

## DELETE /sales/{id}

Deletes a sale by ID.

**Response:** `{ "message": "Sale 5 deleted" }`  
**Error (404):** `{ "detail": "Sale not found" }`

---

## Interactive docs

When the server is running locally, visit `http://127.0.0.1:8000/docs` to test all endpoints in the browser.

---

## Notes for John

- Date format: `YYYY-MM-DD`
- Time format: `HH:MM:SS`
- Optional fields may be `null` in GET responses
- All responses are JSON
