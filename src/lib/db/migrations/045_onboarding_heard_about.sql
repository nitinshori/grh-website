-- 045: capture how a pharmacy heard about us.
--
-- Two signups arrived in a fortnight (Stag Chemist 18 Aug, Heron Cross
-- 24 Aug) and there was no way to tell what brought them. The signup form
-- captured nothing about source, there was no column to put it in, and
-- with no analytics or Search Console connected the question could only be
-- answered by guessing. This is the cheap permanent fix.
--
-- Deliberately nullable and never required. A pharmacy part-way through
-- signing up should not be blocked by a marketing question, and a forced
-- answer is a worse answer: people pick the first option to get past it.
-- Expect a meaningful proportion of NULLs and treat that as honest data
-- rather than a gap to close.
--
-- heard_about        one of the preset options, or 'other'
-- heard_about_detail free text, used when 'other' is chosen or when
--                    someone names the person who referred them
--
-- Idempotent: safe to re-run.

ALTER TABLE onboarding_requests
  ADD COLUMN IF NOT EXISTS heard_about VARCHAR(60);

ALTER TABLE onboarding_requests
  ADD COLUMN IF NOT EXISTS heard_about_detail TEXT;
