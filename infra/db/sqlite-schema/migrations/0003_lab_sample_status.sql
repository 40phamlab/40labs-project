ALTER TABLE lab_sample ADD COLUMN status TEXT NOT NULL DEFAULT 'collected'
  CHECK (status IN ('collected','insufficient','declined','used','removed'));
