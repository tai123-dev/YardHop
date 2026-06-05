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