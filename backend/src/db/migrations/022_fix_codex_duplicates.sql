-- Remove duplicate codex articles (keep lowest id per article_num+category)
DELETE FROM codex_articles
WHERE id NOT IN (
  SELECT MIN(id)
  FROM codex_articles
  GROUP BY article_num, category
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE codex_articles
  ADD CONSTRAINT codex_articles_num_category_unique UNIQUE (article_num, category);
