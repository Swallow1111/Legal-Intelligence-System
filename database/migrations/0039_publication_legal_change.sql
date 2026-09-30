-- Project the structured legal-change card from the immutable analysis linked to a publication.
-- Public readers continue to consume only the publications layer; they never read analyses directly.
ALTER TABLE publications ADD COLUMN legal_change jsonb;

CREATE OR REPLACE FUNCTION sync_publication_legal_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT CASE
           WHEN a.output->'legalChange' IS NULL OR a.output->'legalChange' = 'null'::jsonb THEN NULL
           WHEN jsonb_typeof(a.output->'legalChange') = 'object' THEN a.output->'legalChange'
           ELSE NULL
         END
    INTO NEW.legal_change
  FROM analyses a
  WHERE a.id = NEW.analysis_id;

  IF NEW.analysis_id IS NULL OR NOT FOUND THEN
    NEW.legal_change := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER publications_legal_change_projection
BEFORE INSERT OR UPDATE OF analysis_id ON publications
FOR EACH ROW
EXECUTE FUNCTION sync_publication_legal_change();

-- Existing publications become complete immediately after the migration; no model calls or republish are needed.
UPDATE publications p
SET legal_change = CASE
  WHEN a.output->'legalChange' IS NULL OR a.output->'legalChange' = 'null'::jsonb THEN NULL
  WHEN jsonb_typeof(a.output->'legalChange') = 'object' THEN a.output->'legalChange'
  ELSE NULL
END
FROM analyses a
WHERE a.id = p.analysis_id;
