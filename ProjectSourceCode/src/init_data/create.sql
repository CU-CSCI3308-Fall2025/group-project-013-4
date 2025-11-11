-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Posts Table
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2),
  category VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Friends Table
CREATE TABLE IF NOT EXISTS friends (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  friend_id INT REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(10) DEFAULT 'pending'  -- pending | accepted
  --enforce bidirectional uniqueness
  user_low INT GENERATED ALWAYS AS (LEAST(user_id, friend_id)) STORED,
  user_high INT GENERATED ALWAYS AS (GREATEST(user_id, friend_id)) STORED,
  CONSTRAINT unique_friendship_pair UNIQUE (user_low, user_high)
);

-- Optional test user
INSERT INTO users (username, email, password_hash)
VALUES ('testuser', 'test@example.com', 'placeholder')
ON CONFLICT DO NOTHING;
