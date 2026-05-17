-- 015_booking_availability.sql
-- Single-row table holding the working-hours envelope and per-date
-- overrides for the public /book discovery-call page.
--
-- One row, id always = 1 (enforced by CHECK constraint). The booking
-- calendar reads from here on every request, so admin edits to the
-- schedule are live immediately — no redeploy required.
--
-- Idempotent.

CREATE TABLE IF NOT EXISTS booking_availability (
  id INTEGER PRIMARY KEY DEFAULT 1,
  -- Weekly defaults — one entry per ISO weekday (1=Mon … 7=Sun).
  -- Each entry: { enabled: bool, start: "HH:MM", end: "HH:MM" }.
  weekly_defaults JSONB NOT NULL DEFAULT '{
    "1": { "enabled": true,  "start": "09:00", "end": "17:00" },
    "2": { "enabled": true,  "start": "09:00", "end": "17:00" },
    "3": { "enabled": true,  "start": "09:00", "end": "17:00" },
    "4": { "enabled": true,  "start": "09:00", "end": "17:00" },
    "5": { "enabled": true,  "start": "09:00", "end": "17:00" },
    "6": { "enabled": false, "start": "09:00", "end": "17:00" },
    "7": { "enabled": false, "start": "09:00", "end": "17:00" }
  }'::jsonb,
  -- Date overrides — YYYY-MM-DD → { slots: ["HH:MM", ...] } OR { blocked: true }.
  -- When present, fully replaces the weekly default for that date.
  date_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  slot_minutes INTEGER NOT NULL DEFAULT 30 CHECK (slot_minutes IN (15, 30, 60)),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Seed the single row if it doesn't exist yet
INSERT INTO booking_availability (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
