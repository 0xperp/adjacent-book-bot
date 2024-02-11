CREATE TABLE IF NOT EXISTS users (telegramId TEXT PRIMARY KEY, username TEXT, firstName TEXT, lastName TEXT, authorized BOOLEAN DEFAULT 0)

CREATE TABLE transactions (
  id INT PRIMARY KEY,
  betId VARCHAR(255),
  telegramId TEXT,
  transaction_date DATE,
  amount DECIMAL(10, 2),
  description VARCHAR(255)
);