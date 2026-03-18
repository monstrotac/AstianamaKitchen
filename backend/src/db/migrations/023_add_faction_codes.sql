-- Scythes' Code
INSERT INTO codex_articles (article_num, body, category, sort_order) VALUES
  ('ARTICLE I',   'A contract accepted is a verdict already signed. The walk to the target is not deliberation. That ended when you took the mark.', 'scythes_code', 1),
  ('ARTICLE II',  'The blade has no opinion of the target. Ethics are for clients. Your function is execution, not judgment.', 'scythes_code', 2),
  ('ARTICLE III', 'Reconnaissance before contact. A Scythe who moves without intelligence is a Scythe who does not come back.', 'scythes_code', 3),
  ('ARTICLE IV',  'Leave the scene clean or leave nothing. A body that asks questions is unfinished work. Either it tells a story that closes curiosity, or there is no body.', 'scythes_code', 4),
  ('ARTICLE V',   'A Scythe works alone. Partnerships dilute precision and multiply variables. The contract did not include a partner.', 'scythes_code', 5),
  ('ARTICLE VI',  'Sentiment toward the mark is a technical failure. If you find it in the field, the contract was accepted before you were ready.', 'scythes_code', 6),
  ('ARTICLE VII', 'Speed and finality are the only mercy you owe. There are no last words. The mark chose their path long before you arrived.', 'scythes_code', 7)
ON CONFLICT (article_num, category) DO NOTHING;

-- The Veil''s Code
INSERT INTO codex_articles (article_num, body, category, sort_order) VALUES
  ('ARTICLE I',   'The Veil does not kill. That is the Scythe''s work. Your weapon is knowledge — gathered, held, and delivered only when the wound lands deepest.', 'veil_code', 1),
  ('ARTICLE II',  'You do not exist. The identity you wear today has no history you cannot account for. Your real self is behind glass. No one touches the glass.', 'veil_code', 2),
  ('ARTICLE III', 'Everyone reveals themselves eventually. Your only task is to remain in the room long enough to see it. Patience is the sharpest instrument in the kit.', 'veil_code', 3),
  ('ARTICLE IV',  'Never carry information you cannot afford to lose. What you know and what you carry are never the same thing. Never let them meet in the same place at once.', 'veil_code', 4),
  ('ARTICLE V',   'Attachment is operational. The target who trusts you has given you a weapon. The target who loves you has handed you everything they protect.', 'veil_code', 5),
  ('ARTICLE VI',  'The cover stays intact until you are clear. You burn the identity only when it is already burning. Never before.', 'veil_code', 6),
  ('ARTICLE VII', 'The Veil seeks no recognition. The operation that goes unnoticed succeeded. Silence is the only acknowledgment the work requires.', 'veil_code', 7)
ON CONFLICT (article_num, category) DO NOTHING;
