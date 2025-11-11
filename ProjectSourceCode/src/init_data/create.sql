-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  profile_picture TEXT
);

-- Posts Table
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (TRIM(category) !=''),
  description TEXT NOT NULL CHECK (TRIM(description) !=''),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Friends Table
CREATE TABLE IF NOT EXISTS friends (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  friend_id INT REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(10) DEFAULT 'pending'  -- pending | accepted
);

-- Transactions Table (Expenses Only)
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  category VARCHAR(50) NOT NULL CHECK (TRIM(category) != ''),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Helpfull Testing DB psql -U walletwatch_user -d walletwatch