# 13-04 API Use Documentation & User Validation
> Version: 2025-10-27 • Scope: v1 • Stack: Node/Express + Handlebars + Postgres (Docker) + session cookies

---

## Overview
WalletWatch is a personal finance app with **registration/login**, **session-based auth**, **CRUD for transactions**, **categories/budgets**, a **personal dashboard**, and an **optional social layer** (daily spend posts + **opt‑in** leaderboard). Passwords are **bcrypt**‑hashed; protected routes require a valid session.

## Base URL
- **Local (Docker)**: `http://localhost:3000`  
- **API prefix (recommended)**: `/api/v1`

## Auth & Roles
- **Roles**: `Public`, `User`, `Admin (optional)`  
- **Sharing levels**: `private | friends | public`  
- **Flags**: `leaderboardOptIn` (boolean)  
- **Groups**: allow‑lists that define the **friends** scope  
**Default privacy**: *private*. Users must explicitly opt in to appear on the leaderboard. Per‑transaction details stay private unless posted to the feed.

## Permissions Matrix
| Resource / Action                  | Public | User (owner)            | Admin (opt)      |
|-----------------------------------|:------:|-------------------------|------------------|
| **Auth**: register/login          |   ✓    | ✓                       | ✓                |
| **Session**: `/auth/me`           |   —    | ✓                       | ✓                |
| **Logout**                         |   —    | ✓                       | ✓                |
| **Transactions**                  |   —    | **CRUD**                | All users        |
| **Posts**                         |   —    | **CRUD**                | All users        |
| **Leaderboard (opt‑in only)**     |   —    | read / opt‑in           | manage           |
| **Admin tools**                   |   —    | —                        | ✓                |

## Auth & Session Flow
- Sessions use **HttpOnly** cookies. In production set **Secure** and **SameSite=strict**.
- **Registration** → bcrypt hash → insert user → (optionally) log in.  
- **Login** → bcrypt compare → create session (`req.session.user`).  
- **Logout** → destroy session.  
- **WhoAmI** → returns current user from session.  
- **Password reset**: resets user password. 

### Registration
**Request**
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "strong-pass",
  "displayName": "Alice"
}
```
**Responses**
- `201 Created` → `{ "user": { ... } }`
- `400 Bad Request` (malformed email/password)
- `409 Conflict` (email already exists)

### Login
**Request**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "strong-pass"
}
```
**Responses**
- `200 OK` → `{ "user": { ... } }` and **session cookie**
- `401 Unauthorized` (invalid credentials)

### WhoAmI & Logout
```http
GET  /api/v1/auth/me      → 200 { user }         (requires session)
POST /api/v1/auth/logout  → 200 { loggedOut: true }
```

### Route Protection (middleware example)
```js
const auth = (req, res, next) => {
  if (!req.session?.user) return res.status(401).json({ error: 'auth_required' });
  next();
};
```

## Validation Rules
Apply **server-side** validation for **every** endpoint:
- **Email**: required, RFC format, **unique** on register
- **Password**: required, **min 8 chars**; bcrypt hash; never log/store plaintext
- **AuthZ**: every read/write **scoped to `req.session.user.id`** unless Admin
- **Share rules**: feed/leaderboard honor `shareLevel`, `groups`, `leaderboardOptIn`
- **Sanitize**: reject unexpected fields/types; bound numeric ranges and string lengths

Failure responses:
- `400 validation_error` → `{ "error":"validation_error","details":[{"field":"…","message":"…"}] }`
- `401 auth_required` / `invalid_credentials`
- `403 forbidden` (ownership/scope)
- `404 not_found` (not visible or doesn’t exist)

## Endpoints
All endpoints require a valid session unless marked **Public**.  
Where applicable, list **pagination**: `?limit` (default 25, max 100) and `?offset`.

### Users
**GET `/api/v1/users/me`** → `200`
```json
{ "id":"...", "email":"...", "displayName":"...", "shareLevel":"private|friends|public",
  "leaderboardOptIn": false, "groups": ["roommates","finance-club"] }
```
**PATCH `/api/v1/users/me`** → update privacy/settings
```http
Body: { "shareLevel"?: "...", "leaderboardOptIn"?: true|false, "groups"?: [string] }
```
Responses: `200 { user }` | `400 validation_error`

### Transactions
**GET `/api/v1/transactions?from=YYYY-MM-DD&to=YYYY-MM-DD&limit&offset`** → list
```json
[ { "id":1,"itemName":"Coffee","category":"Food","amount":3.75,"occurredAt":"2025-10-27" } ]
```
**POST `/api/v1/transactions`**
```json
{ "itemName":"Coffee","category":"Food","amount":3.75,"occurredAt":"2025-10-27" }
```
Responses: `201 { id }` | `400 validation_error`
**PATCH `/api/v1/transactions/:id`** → `200 { updated: true }`
**DELETE `/api/v1/transactions/:id`** → `200 { deleted: true }`

**Example cURL (session cookies):**
```bash
curl -X POST http://localhost:3000/api/v1/transactions   -H 'Content-Type: application/json'   -b cookiejar.txt -c cookiejar.txt   -d '{"itemName":"Coffee","category":"Food","amount":3.75,"occurredAt":"2025-10-27"}'
```

### Posts
**GET `/api/v1/posts/feed?limit&offset`** → respects share rules
```json
[ { "id":7, "user": { "displayName":"Alice" }, "text":"No-spend day!", "totalSpent":0, "createdAt":"2025-10-27T16:00:00Z" } ]
```
**POST `/api/v1/posts`** → `201 { id }`  
**DELETE `/api/v1/posts/:id`** → `200 { deleted: true }`

### Leaderboard
**GET `/api/v1/leaderboard?period=week|month&limit&offset`**
```json
[ { "user": { "displayName": "Alice" }, "periodTotal": 123.45 } ]
```
Only users with `leaderboardOptIn=true` are included.

## Data Model (excerpt)
```sql
users(
  id PK, email UNIQUE, password_hash, display_name,
  share_level, leaderboard_opt_in BOOLEAN DEFAULT FALSE, created_at
);

transactions(
  id PK, user_id FK, item_name, category,
  amount NUMERIC(10,2), occurred_at, created_at
);

posts(
  id PK, user_id FK, text, total_spent NUMERIC(10,2), created_at
);
```

## Errors & Conventions
| Code | Meaning                         | Notes / Example                                          |
|-----:|----------------------------------|-----------------------------------------------------------|
| 200  | OK                               | Success payload                                           |
| 201  | Created                          | Resource created                                          |
| 400  | validation_error                 | `details: [{field,message}]`                              |
| 401  | auth_required / invalid_credentials | No session / bad login                                |
| 403  | forbidden                        | Ownership/scope violation                                 |
| 404  | not_found                        | Resource not visible or missing                           |
| 409  | conflict                         | e.g., email already exists                                |
| 429  | rate_limited                     | Optional                                                  |
| 5xx  | server_error                     | Unexpected                                                |

**Standard error body**
```json
{
  "error": "validation_error",
  "details": [{ "field": "email", "message": "invalid_format" }]
}
```

## Security Controls
- **Password hashing**: bcrypt; constant‑time compare
- **Cookies**: HttpOnly; **Secure & SameSite=strict in prod**
- **CSRF**: protect state‑changing routes (either CSRF token on forms **or** rely on SameSite=strict with credentialed XHR)
- **Input validation & output encoding**; never trust client‑supplied `user_id`
- **SQL**: parameterized queries; least‑privileged DB user
- **Logging**: auth events + admin actions (optional)

## External API Decision
**Not used in v1.** Barcode/UPC or OpenFDA is misaligned with finance; **Plaid** is closer to purpose but heavy for course scope and introduces sensitive data handling. v1 relies on **manual inputs**: item, category, amount.

## Appendix A — Sample Validation Schema
```json
{
  "email":      { "type":"string", "min":5,  "max":254, "format":"email" },
  "password":   { "type":"string", "min":8 },
  "displayName":{ "type":"string", "min":1,  "max":50 },
  "itemName":   { "type":"string", "min":1,  "max":80 },
  "category":   { "type":"string", "min":1,  "max":40 },
  "amount":     { "type":"number", "exclusiveMinimum": 0, "maximum": 10000000 },
  "occurredAt": { "type":"string", "format":"date" },
  "shareLevel": { "enum":["private","friends","public"] },
  "groups":     { "type":"array", "items": { "type":"string", "min":1, "max":40 } },
  "text":       { "type":"string", "max":500 }
}
```
