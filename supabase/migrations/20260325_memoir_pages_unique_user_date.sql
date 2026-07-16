-- Fix 42P10: upsert on memoir_pages requires a unique constraint matching
-- onConflict: 'user_id,page_date' in src/app/api/ritual/submit/route.ts
--
-- Business rule: one memoir page per user per calendar day.

-- Drop non-unique index if present (recreated as unique below)
DROP INDEX IF EXISTS public.idx_memoir_pages_user_date;

-- If duplicate (user_id, page_date) rows already exist, keep the newest by updated_at
DELETE FROM public.memoir_pages a
USING public.memoir_pages b
WHERE a.user_id = b.user_id
  AND a.page_date = b.page_date
  AND a.id < b.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_memoir_pages_user_date
  ON public.memoir_pages (user_id, page_date);
