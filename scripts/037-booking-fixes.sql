-- =============================================
-- 037 — Booking + Calendar Fixes
-- Fix critical missing columns + new features
-- =============================================

-- CRITICAL BUG FIX: bookings table is missing location_url and meeting_details
-- These columns are referenced in the book route but never existed in the schema
-- Without them, every Zoom booking creation FAILS with a DB error
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS location_url text,
  ADD COLUMN IF NOT EXISTS meeting_details jsonb;

-- FEATURE: host image for calendar
ALTER TABLE booking_calendars
  ADD COLUMN IF NOT EXISTS host_image_url text,
  ADD COLUMN IF NOT EXISTS allow_cancellation boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_reschedule boolean NOT NULL DEFAULT false;

SELECT '✅ Booking fixes applied: location_url, meeting_details, host_image_url, allow_cancellation, allow_reschedule' AS resultado;
