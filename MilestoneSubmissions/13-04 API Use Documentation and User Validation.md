# **13-04 API Use Documentation & User Validation — WalletWatch** 

This document specifies WalletWatch’s API usage, authentication and authorization model, user validation rules, core endpoints, error conventions, and security practices. It aligns with our Lab‑7 Express/Node server, Postgres database, and TA notes on public/private/groups sharing and the opt‑in leaderboard.

## **1\) Overview**

• Stack: Node/Express, Handlebars UI, Postgres (Dockerized), session cookies.  
 • Features (v1): registration/login, session-based auth, CRUD for transactions, categories & budgets, personal dashboard, optional social feed with daily spend posts, and an opt‑in leaderboard.

Passwords are hashed with bcrypt and never stored in plaintext. Private data is scoped to the authenticated user unless otherwise shared via explicit settings.

## **2\) Base URL**

Local (Docker): http://localhost:3000  
 API prefix (recommended): /api/v1

## **3\) Authentication & Authorization Model**

Roles: Public, User, Admin (optional)  
 Sharing levels: private | friends | public  
 Flags: leaderboardOptIn (boolean)  
 Groups: allow‑lists that define the ‘friends’ scope

Expectations: The default is private. Users can explicitly opt into the leaderboard; per‑transaction details remain private unless the user posts them to the feed.

## **4\) Permissions Matrix** 

Resource                 Public 	User              	Admin (opt)  
 \-----------------------  \---------  \--------------------  \----------  
 Auth: register/login 	✓      	✓                 	✓  
 Session: /auth/me    	—      	✓                 	✓  
 Session: /logout     	—      	✓                 	✓  
 Transactions (own)   	—      	CRUD              	All users  
 Posts (own)          	—      	CRUD              	All users  
 Leaderboard (opt‑in) 	—      	read/join        	 manage  
 Users (others, public)   —      	read (respect privacy) manage  
 Admin tools          	—      	—                  	✓

## **5\) Auth & Session Flow**

Authentication uses server-side sessions with HttpOnly cookies. Production deployments must set Secure and SameSite appropriately.

Registration → bcrypt hash → insert → session optional; Login → bcrypt compare → session create; Logout → session destroy; WhoAmI → returns session user.

## **5.1) Registration**

POST /api/v1/auth/register  
 Content-Type: application/json  
 {  
   "email": "alice@example.com",  
   "password": "strong-pass",  
   "displayName": "Alice"  
 }

Responses:  
 • 201 Created → { user }  
 • 400 Bad Request (invalid email/password)  
 • 409 Conflict (email already exists)

## 

## 

## 

## **5.2) Login**

POST /api/v1/auth/login  
 {  
   "email": "alice@example.com",  
   "password": "strong-pass"  
 }

Responses:  
 • 200 OK → { user } \+ session cookie  
 • 401 Unauthorized (bad credentials)

## **5.3) WhoAmI & Logout**

GET  /api/v1/auth/me   	→ Returns the current user (requires session)  
 POST /api/v1/auth/logout   → Destroys session

## **5.4) Route Protection (Middleware)**

const auth \= (req, res, next) \=\> {  
   if (\!req.session?.user) return res.status(401).json({ error: 'auth\_required' });  
   next();  
 };

## **6\) User Validation**

Server-side validation is mandatory on every endpoint. At minimum:

• Email: required, RFC format, unique on register  
 • Password: required, min length 8, hashed with bcrypt; never log/store plaintext  
 • Authorization: every query/update/delete is scoped to req.session.user.id unless Admin  
 • Share rules: feed/leaderboard responses honor shareLevel, groups, and leaderboardOptIn  
 • Input sanitation: reject unexpected fields, types, and ranges

Failure responses:  
 • 400 validation\_error → { field, message }  
 • 401 auth\_required / invalid\_credentials  
 • 403 forbidden (ownership or scope violation)  
 • 404 not\_found (resource not visible or does not exist)

## **7\) Core Endpoints (v1)**

All endpoints below require a valid session unless marked Public.

## **7.1) Users**

GET  /api/v1/users/me  
 → 200 { id, email, displayName, shareLevel, leaderboardOptIn, groups }

 PATCH /api/v1/users/me  
 Body: { shareLevel?: 'private'|'friends'|'public', leaderboardOptIn?: boolean, groups?: string\[\] }  
 → 200 { user } | 400 validation\_error

## **7.2) Transactions**

GET  /api/v1/transactions?from=YYYY-MM-DD\&to=YYYY-MM-DD  
 → 200 \[{ id, itemName, category, amount, occurredAt }\]

 POST /api/v1/transactions  
 Body: { itemName: string, category: string, amount: number, occurredAt: ISODate }  
 → 201 { id }

 PATCH /api/v1/transactions/:id  
 Body: { itemName?, category?, amount?, occurredAt? }  
 → 200 { updated: true }

 DELETE /api/v1/transactions/:id  
 → 200 { deleted: true }

## **7.3) Posts (Daily Spend)**

GET  /api/v1/posts/feed  
 → 200 \[{ id, user: { displayName }, text, totalSpent, createdAt }\] (respects share rules)

 POST /api/v1/posts  
 Body: { text: string, totalSpent: number }  
 → 201 { id }

 DELETE /api/v1/posts/:id  
 → 200 { deleted: true }

## **7.4) Leaderboard (Opt‑in Only)**

GET /api/v1/leaderboard?period=week|month  
 → 200 \[{ user: { displayName }, periodTotal }\]  
 • Only users with leaderboardOptIn=true are included.

## **8\) Data Model (excerpt)**

users(  
   id PK, email UNIQUE, password\_hash, display\_name,  
   share\_level, leaderboard\_opt\_in BOOLEAN DEFAULT FALSE, created\_at  
 )

 transactions(  
   id PK, user\_id FK, item\_name, category,  
   amount NUMERIC(10,2), occurred\_at, created\_at  
 )

 posts(  
   id PK, user\_id FK, text, total\_spent NUMERIC(10,2), created\_at  
 )

## **9\) Error & Response Conventions**

200 OK        	→ success payload  
 201 Created   	→ resource created  
 400 Bad Request   → validation\_error { field, message }  
 401 Unauthorized  → auth\_required | invalid\_credentials  
 403 Forbidden 	→ forbidden (ownership/scope)  
 404 Not Found 	→ not\_found  
 409 Conflict  	→ duplicate (e.g., email in use)  
 429 Too Many  	→ rate\_limited  
 5xx Server Error  → server\_error

## **10\) Security Controls** 

• Password hashing (bcrypt) and constant‑time compare.  
 • HttpOnly cookies; set Secure and SameSite=strict in production.  
 • CSRF defenses for state‑changing browser posts (CSRF token or same‑site strategy).  
 • Input validation \+ output encoding; never trust client fields like user\_id.  
 • Principle of Least Privilege in SQL; parameterized queries.  
 • Audit logs for auth events (optional).

## **11\) External API Decision (v1)**

We are \*\*not\*\* using an external API in v1. The team considered barcode scanning (e.g., OpenFDA) and banking aggregation (Plaid). Barcode/UPC flows are a poor fit for finance tracking and add mobile camera \+ external database complexity. Plaid is closer to purpose but heavy for course scope and raises security/PII handling requirements. Therefore v1 relies on manual inputs: item name, category, amount.

## **12\) Runbook (Local Dev)**

1\) Docker up the stack (web \+ db)  
 2\) Apply init SQL and seed if present  
 3\) Set env vars: SESSION\_SECRET, DB creds  
 4\) npm install && npm start  
 5\) Visit http://localhost:3000

## **Appendix A — Sample Validation Rules**

email: string, 5..254 chars, RFC 5322, unique  
 password: string, min 8 chars; recommended: 1 upper, 1 lower, 1 digit  
 displayName: string, 1..50 chars  
 itemName: string, 1..80 chars  
 category: enum or string (1..40 chars)  
 amount: number \> 0, max 1e7  
 occurredAt: ISO-8601 date  
 shareLevel: one of \['private','friends','public'\]  
 groups: string\[\]; each 1..40 chars  
 text: string up to 500 chars

# 

