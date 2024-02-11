CREATE TABLE events (
  id VARCHAR(32) PRIMARY KEY,
  sport_key VARCHAR(100),
  sport_title VARCHAR(100),
  commence_time DATETIME,
  home_team VARCHAR(100),
  away_team VARCHAR(100)
);

CREATE TABLE odds (
  id VARCHAR(32) PRIMARY KEY,
  sport_key VARCHAR(100),
  sport_title VARCHAR(100),
  commence_time DATETIME,
  home_team VARCHAR(100),
  away_team VARCHAR(100),
  bookmaker_key VARCHAR(65535),
);

CREATE TABLE bets (
  id VARCHAR(25) PRIMARY KEY,
  amount DECIMAL,
  odds DECIMAL,
  eventDescription VARCHAR(255) NULL,
  event VARCHAR(32) NULL,
  to_win DECIMAL,
  telegramID VARCHAR(255),
  date_placed DATE,
  date_settled DATE NULL,
  won BOOLEAN NULL
);
