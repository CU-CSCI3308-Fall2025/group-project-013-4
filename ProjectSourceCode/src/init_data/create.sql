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

-- Friends Table
CREATE TABLE IF NOT EXISTS friends (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  friend_id INT REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(10) DEFAULT 'pending',  -- pending | accepted
  --enforce bidirectional uniqueness
  user_low INT GENERATED ALWAYS AS (LEAST(user_id, friend_id)) STORED,
  user_high INT GENERATED ALWAYS AS (GREATEST(user_id, friend_id)) STORED,
  CONSTRAINT unique_friendship_pair UNIQUE (user_low, user_high)
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
 
--Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  limit_amount NUMERIC(10,2) NOT NULL,--ex: $200 for groceries
  period TEXT DEFAULT 'monthly', --can change
  UNIQUE (user_id, category, period)
);

-- Posts Table
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2),
  category VARCHAR(100),
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Helpfull Testing DB psql -U walletwatch_user -d walletwatch
