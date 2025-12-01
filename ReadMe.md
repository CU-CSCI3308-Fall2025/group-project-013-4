# WalletWatch 

## Application description
Our finance tracker application is a personal finance and social spending platform that helps users monitor their daily expenses while engaging with friends in a fun, interactive way. The core functionality allows users to log income and expenses, categorize their transactions, and visualize their spending patterns over time. The app will be updating real time. Users can log transactions however many times, whenever. The app provides insights for users as to where their money is going and helps users set budgets and financial limits to build smarter spending habits. Along with this, users can post their daily spendings for their friends to see, creating a transparent community around personal finance.

## Contributors
Kishore Karthikeyan, Matt Topham, Aiden Johnson, Ellie Odau, Harrie Ha, Emir Simsek

## Technology stack
- **Runtime & server:** Node.js 18, Express, Express Handlebars, JSON Web Tokens, and bcrypt-based authentication.
- **Database:** PostgreSQL 15 seeded through SQL scripts in `src/init_data`.
- **Infrastructure:** Docker Compose for orchestrating the Node.js app container and the PostgreSQL database.
- **Testing:** Mocha, Chai, and Chai-HTTP for API and integration tests.
- **Client integrations:** Google Maps JavaScript + Places API for address autocomplete.

## Directory Structure

```text
├── MilestoneSubmissions/
│   ├── 13-04 Lab 8 (including extra credit) Deliverable.md
│   ├── UAT Plan.pdf
│   ├── release-notes-v0.1
│   ├── release-notes-v0.2
│   ├── release-notes-v0.3
│   └── release-notes-v0.4
├── ProjectSourceCode/
│   ├── src
│   │   ├── config
│   │   │   └── db.js
│   │   ├── init_data
│   │   │   ├── create.sql
│   │   │   └── insert.sql
│   │   ├── middleware
│   │   │   └── protect.js
│   │   ├── modules
│   │   │   ├── auth.js
│   │   │   ├── budget.js
│   │   │   ├── friends.js
│   │   │   ├── leaderboard.js
│   │   │   ├── pages.js
│   │   │   ├── posts.js
│   │   │   └── transactions.js
│   │   ├── resources
│   │   │   ├── css
│   │   │   │   ├── auth.css
│   │   │   │   ├── base.css
│   │   │   │   ├── budget.css
│   │   │   │   ├── components.css
│   │   │   │   ├── friends.css
│   │   │   │   ├── layout.css
│   │   │   │   ├── leaderboard.css
│   │   │   │   ├── navbar.css
│   │   │   │   ├── profile.css
│   │   │   │   ├── style.css
│   │   │   │   ├── transactions.css
│   │   │   │   └── variables.css
│   │   │   ├── img
│   │   │   │   ├── PFP_Default.jpeg
│   │   │   │   └── logo_w_gradient.svg
│   │   │   ├── js
│   │   │   │   ├── api.js
│   │   │   │   ├── auth.js
│   │   │   │   ├── budget.js
│   │   │   │   ├── friends.js
│   │   │   │   ├── home.js
│   │   │   │   ├── leaderboard.js
│   │   │   │   ├── posts.js
│   │   │   │   ├── posts.location.js
│   │   │   │   ├── posts.modal.js
│   │   │   │   ├── posts.stream.js
│   │   │   │   ├── settings.js
│   │   │   │   ├── transactions.js
│   │   │   │   └── ui.js
│   │   ├── utils
│   │   │   └── env.js
│   │   ├── views
│   │   │   ├── layouts
│   │   │   │   └── main.hbs
│   │   │   ├── pages
│   │   │   │   ├── budget.hbs
│   │   │   │   ├── friends.hbs
│   │   │   │   ├── home.hbs
│   │   │   │   ├── leaderboard.hbs
│   │   │   │   ├── login.hbs
│   │   │   │   ├── profile.hbs
│   │   │   │   ├── register.hbs
│   │   │   │   ├── settings.hbs
│   │   │   │   └── transaction.hbs
│   │   │   └── partials
│   │   │       ├── footer.hbs
│   │   │       └── header.hbs
│   │   └── index.js
│   ├── test
│   │   ├── server.spec.js
│   │   └── test-screenshot.png
│   ├── .env.example
│   ├── 04-13 USE CASE DIAGRAM.pdf
│   ├── api-use-docs-and-user-validation.md
│   ├── docker-compose.yaml
│   ├── login-wireframe-draft1.png
│   ├── package.json
│   └── register-wireframe-draft1.png
├── TeamMeetingLogs/
│   ├── 10_30 Meeting Notes.md
│   ├── 11_06 Meeting Notes.md
│   ├── 11_13 Meeting Notes.md
│   ├── 11_20 MeetingNotes.md
│   └── TA Meeting Notes_ 10-23-25.md
├── .gitignore
└── README.md
```
### Folder & File Descriptions

#### MilestoneSubmissions

- **13-04 Lab 8 (including extra credit) Deliverable.md** – Lab 8 written deliverable, including extra credit components.
- **UAT Plan.pdf** – User Acceptance Testing (UAT) plan with test scenarios and acceptance criteria.
- **release-notes-v0.1** – Release notes for version 0.1 of the application.
- **release-notes-v0.2** – Release notes for version 0.2.
- **release-notes-v0.3** – Release notes for version 0.3.
- **release-notes-v0.4** – Release notes for version 0.4.

---

#### ProjectSourceCode

- **src/** – Main application source code (backend, views, and front-end assets).
  - **config/db.js** – Database connection setup.
  - **init_data/**
    - **create.sql** – SQL script to create the database schema.
    - **insert.sql** – SQL script to insert initial seed data.
  - **middleware/protect.js** – Authentication middleware to protect routes.
  - **modules/** – Express route handlers and business logic:
    - **auth.js** – Login, registration, and auth routes.
    - **budget.js** – Budget-related endpoints and logic.
    - **friends.js** – Friend management features.
    - **leaderboard.js** – Leaderboard calculations and endpoints.
    - **pages.js** – Routes that render Handlebars pages.
    - **posts.js** – Post creation, feed, and related behavior.
    - **transactions.js** – Transaction CRUD (create/read/update/delete) routes and logic.
  - **resources/** – Static assets served to the client:
    - **css/** – Stylesheets for pages and components (auth, budget, friends, layout, navbar, etc.).
    - **img/** – Images like the default profile picture and app logo.
    - **js/** – Front-end JavaScript:
      - **api.js** – Helper for making API requests.
      - **auth.js, budget.js, friends.js, home.js, leaderboard.js, transactions.js, settings.js** – Page-specific scripts.
      - **posts.js, posts.location.js, posts.modal.js, posts.stream.js** – Scripts for posts, location, modals, and post feed.
      - **ui.js** – Shared UI utilities.
  - **utils/env.js** – Helpers for reading and managing environment variables.
  - **views/** – Handlebars templates for server-side rendering:
    - **layouts/main.hbs** – Base layout shared by all pages.
    - **pages/** – Individual page templates (home, login, register, profile, budget, friends, leaderboard, transaction, settings).
    - **partials/** – Reusable components like **header.hbs** and **footer.hbs**.
  - **index.js** – Application entry point (Express app setup, middleware, routes).

- **test/**
  - **server.spec.js** – Automated tests for the server/API.
  - **test-screenshot.png** – Screenshot used for test documentation/evidence.

- **.env.example** – Example environment file for setting up the project.
- **04-13 USE CASE DIAGRAM.pdf** – Use case diagram for the system.
- **api-use-docs-and-user-validation.md** – API usage notes and user validation rules.
- **docker-compose.yaml** – Docker Compose configuration for running the app/services.
- **login-wireframe-draft1.png** – Wireframe for the login page.
- **register-wireframe-draft1.png** – Wireframe for the registration page.
- **package.json** – Project metadata, dependencies, and npm scripts.

---

#### TeamMeetingLogs

- **10_30 Meeting Notes.md** – Team meeting notes for October 30, 2025.
- **11_06 Meeting Notes.md** – Team meeting notes for November 6, 2025.
- **11_13 Meeting Notes.md** – Team meeting notes for November 13, 2025.
- **11_20 MeetingNotes.md** – Team meeting notes for November 20, 2025.
- **TA Meeting Notes_ 10-23-25.md** – Team meeting notes for October 23, 2025.
---

#### Root Files

- **.gitignore** – Specifies files and directories that Git should ignore.
- **README.md** – Main project documentation and overview.


## Prerequisites
1. **Git** – clone/pull the repository updates.
2. **Docker Desktop or Docker Engine + Docker Compose v2** – runs the full stack locally without installing Node/PostgreSQL directly.
3. **Google Cloud account** – required if you want Maps autocomplete and suggestions.

## Getting started
1. **Pull the latest code**
   ```bash
   git clone https://github.com/CU-CSCI3308-Fall2025/group-project-013-4.git
   cd group-project-013-4
   git pull origin main   # repeat later to stay up to date
   cd ProjectSourceCode
   ```
2. **Create a `.env` file**
   ```bash
   cp .env.example .env
   ```
   Update the generated `.env` with secure values for `SESSION_SECRET`, `JWT_SECRET`, and your `GOOGLE_MAPS_API_KEY` if you plan to use the autocomplete feature.

### Getting a Google Maps API key
1. Visit [console.cloud.google.com](https://console.cloud.google.com/) and sign in.
2. Create or select a Google Cloud project for WalletWatch.
3. In **APIs & Services → Library**, enable both **Maps JavaScript API** and **Places API** (needed for autocomplete).
4. Navigate to **APIs & Services → Credentials → Create Credentials → API key**.
5. Copy the generated key, set HTTP referrer restrictions if desired, and paste it into the `GOOGLE_MAPS_API_KEY` field inside `.env`.

## Running the application with Docker
1. From `ProjectSourceCode/`, start the containers:
   ```bash
   docker compose up -d
   ```
2. The PostgreSQL database boots first; the app container installs dependencies, runs `npm test`, and then launches on [http://localhost:3000](http://localhost:3000).
3. To follow logs: `docker compose logs -f app`. To stop everything: `docker compose down`.

## Running the tests
Tests are run during every startup. 

- **Inside Docker (optional):**
  ```bash
  docker compose run --rm app npm test
  ```

## Link
[Wallet Watch](https://walletwatch-013-4-3zg7.onrender.com)



