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



