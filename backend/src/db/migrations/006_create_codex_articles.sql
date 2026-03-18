CREATE TABLE IF NOT EXISTS codex_articles (
  id           SERIAL PRIMARY KEY,
  article_num  TEXT NOT NULL,
  body         TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT 'standing_articles',
  sort_order   INT NOT NULL
);
