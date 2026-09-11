-- 058: one consultation, one row in pgd_consultations.
--
-- The admin dashboard read 269 consultations started against 43 completed on
-- 11 September 2026. That was not a drop-off problem: every STEP of a
-- consultation was writing its own "started" row. useConsultationTracking
-- lived inside StepWrapper, and most tools render a separate StepWrapper per
-- step, so advancing a step unmounted one wrapper and mounted the next,
-- recreating the hook and posting another start. One MenACWY consultation
-- that afternoon left seven rows seconds apart and completed the last:
--
--   17:19:27, 17:19:39, 17:20:13, 17:20:24, 17:20:26, 17:21:13, 17:21:26 done
--
-- The code fix (one module-level entry per PGD slug) stops new duplicates.
-- This migration collapses the rows already written, so the 30 day figures
-- mean what they say.
--
-- HOW A CLUSTER IS DEFINED. Rows are grouped by pharmacy, user and PGD slug,
-- in start order. A new cluster begins when either
--   (a) the previous row was completed, so the consultation before this one
--       had finished. This is what separates back to back consultations of
--       the same PGD by the same pharmacist, which at a travel clinic can be
--       minutes apart (the sample above has a completion at 17:14:46 and the
--       next consultation starting at 17:19:27), or
--   (b) more than 15 minutes passed since the previous row, which ends an
--       abandoned consultation that was never completed.
-- The earliest row in each cluster is kept, carrying the latest completion
-- time found anywhere in the cluster. Clusters of one row are left alone.
--
-- The one case this cannot separate: a consultation abandoned part way and a
-- new one for the same PGD by the same pharmacist begun within 15 minutes.
-- Those merge into one row, so the abandoned attempt is not counted. Rare,
-- and it errs towards under-counting starts rather than inventing them.
--
-- Checked before writing against the 14 real rows of 11 September (two
-- MenACWY patients, seven rows each): they collapse to two completed
-- consultations, a lone row and a 40 minute gap are left alone, and a second
-- run finds nothing.
--
-- NOTHING IS LOST. Deleted rows are copied first into
-- pgd_consultations_duplicate_starts_backup. Clinical records are in a
-- different table (consultation_records) and are not touched, except that any
-- record pointing at a row about to be deleted is repointed at the kept row
-- of the same cluster, so no record loses its link.
--
-- Idempotent: after this runs every cluster holds one row, so a second run
-- finds nothing to collapse.

CREATE TABLE IF NOT EXISTS pgd_consultations_duplicate_starts_backup (
  id uuid PRIMARY KEY,
  pharmacy_id uuid NOT NULL,
  user_id uuid NOT NULL,
  pgd_slug varchar(255) NOT NULL,
  started_at timestamp NOT NULL,
  completed_at timestamp,
  created_at timestamp NOT NULL,
  kept_id uuid NOT NULL,
  backed_up_at timestamptz NOT NULL DEFAULT now()
);

CREATE TEMP TABLE tmp_consultation_clusters ON COMMIT DROP AS
WITH ordered AS (
  SELECT
    id,
    pharmacy_id,
    user_id,
    pgd_slug,
    started_at,
    completed_at,
    LAG(started_at) OVER w AS prev_started_at,
    LAG(completed_at) OVER w AS prev_completed_at
  FROM pgd_consultations
  WINDOW w AS (
    PARTITION BY pharmacy_id, user_id, pgd_slug
    ORDER BY started_at, id
  )
),
marked AS (
  SELECT
    ordered.*,
    CASE
      WHEN prev_started_at IS NULL THEN 1
      WHEN prev_completed_at IS NOT NULL THEN 1
      WHEN started_at - prev_started_at > interval '15 minutes' THEN 1
      ELSE 0
    END AS starts_cluster
  FROM ordered
),
grouped AS (
  SELECT
    marked.*,
    SUM(starts_cluster) OVER (
      PARTITION BY pharmacy_id, user_id, pgd_slug
      ORDER BY started_at, id
      ROWS UNBOUNDED PRECEDING
    ) AS cluster_no
  FROM marked
)
SELECT
  id,
  pharmacy_id,
  user_id,
  pgd_slug,
  started_at,
  completed_at,
  FIRST_VALUE(id) OVER (
    PARTITION BY pharmacy_id, user_id, pgd_slug, cluster_no
    ORDER BY started_at, id
  ) AS kept_id,
  MAX(completed_at) OVER (
    PARTITION BY pharmacy_id, user_id, pgd_slug, cluster_no
  ) AS cluster_completed_at,
  COUNT(*) OVER (
    PARTITION BY pharmacy_id, user_id, pgd_slug, cluster_no
  ) AS cluster_size
FROM grouped;

-- Keep the clinical records attached: repoint any record that references a
-- row about to be deleted at the kept row of its cluster.
UPDATE consultation_records AS cr
SET consultation_id = c.kept_id
FROM tmp_consultation_clusters AS c
WHERE cr.consultation_id = c.id
  AND c.cluster_size > 1
  AND c.id <> c.kept_id;

-- The kept row carries the completion, wherever in the cluster it was marked.
UPDATE pgd_consultations AS pc
SET completed_at = c.cluster_completed_at
FROM tmp_consultation_clusters AS c
WHERE pc.id = c.kept_id
  AND c.cluster_size > 1
  AND pc.completed_at IS DISTINCT FROM c.cluster_completed_at;

INSERT INTO pgd_consultations_duplicate_starts_backup
  (id, pharmacy_id, user_id, pgd_slug, started_at, completed_at, created_at, kept_id)
SELECT pc.id, pc.pharmacy_id, pc.user_id, pc.pgd_slug, pc.started_at,
       pc.completed_at, pc.created_at, c.kept_id
FROM pgd_consultations AS pc
JOIN tmp_consultation_clusters AS c ON c.id = pc.id
WHERE c.cluster_size > 1
  AND c.id <> c.kept_id
ON CONFLICT (id) DO NOTHING;

DELETE FROM pgd_consultations AS pc
USING tmp_consultation_clusters AS c
WHERE pc.id = c.id
  AND c.cluster_size > 1
  AND c.id <> c.kept_id;
