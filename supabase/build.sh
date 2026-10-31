#!/usr/bin/env bash
# Rebuilds supabase/setup.sql from supabase/parts/*.sql (run after editing a part).
set -euo pipefail
cd "$(dirname "$0")"
python3 gen_seed.py
{
  cat <<'HDR'
-- =============================================================================
--  EPIC MENSWEAR — database setup
--  For a NEW, empty Supabase project (separate from any other store).
--  Paste this whole file into Supabase → SQL Editor → New query → Run.
--  Safe to run again later: it never overwrites products or settings you
--  create in the admin portal.
-- =============================================================================
begin;
HDR
  for f in parts/0*.sql; do printf '\n-- ======== %s ========\n' "$(basename "$f")"; cat "$f"; done
  printf '\ncommit;\n'
} > setup.sql
echo "wrote supabase/setup.sql"
