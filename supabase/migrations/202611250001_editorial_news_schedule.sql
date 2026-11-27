-- MONSTER ARCHIVE — Phase 2.3.1
-- Apply first in monster-archive-test. This additive migration does not seed
-- articles/events, change existing tables, or grant access to the service role.
BEGIN;

CREATE TABLE public.editorial_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (btrim(name) <> ''),
  homepage_url text NOT NULL CHECK (homepage_url ~ '^https?://[^[:space:]]+$'),
  feed_url text CHECK (feed_url ~ '^https?://[^[:space:]]+$'),
  source_kind text NOT NULL CHECK (source_kind IN (
    'official_group', 'official_organizer', 'official_broadcaster', 'trusted_press', 'manual'
  )),
  discovery_method text NOT NULL DEFAULT 'manual' CHECK (discovery_method IN ('manual', 'rss', 'api')),
  is_active boolean NOT NULL DEFAULT true,
  last_scanned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, homepage_url)
);

CREATE TABLE public.news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category text NOT NULL DEFAULT 'official_announcements' CHECK (category IN (
    'official_announcements', 'music_releases', 'tours_concerts', 'interviews',
    'awards', 'media_appearances', 'achievements'
  )),
  title_pt text, title_en text,
  summary_pt text, summary_en text,
  body_pt text, body_en text,
  cover_image_url text CHECK (cover_image_url ~ '^https?://[^[:space:]]+$'),
  cover_image_alt_pt text, cover_image_alt_en text,
  cover_image_credit text,
  cover_image_source_url text CHECK (cover_image_source_url ~ '^https?://[^[:space:]]+$'),
  era_id uuid REFERENCES public.watch_eras(id) ON DELETE SET NULL,
  is_featured boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'in_review', 'approved', 'rejected', 'published', 'archived'
  )),
  approved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.agenda_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category text NOT NULL DEFAULT 'promotion' CHECK (category IN (
    'release', 'concert', 'festival', 'music_show', 'interview', 'broadcast', 'awards', 'promotion', 'other'
  )),
  title_pt text, title_en text,
  summary_pt text, summary_en text,
  location text,
  venue_name text,
  official_event_url text CHECK (official_event_url ~ '^https?://[^[:space:]]+$'),
  -- A local calendar date is preserved even when the clock time is unannounced.
  starts_on date,
  ends_on date,
  time_kind text NOT NULL DEFAULT 'time_tba' CHECK (time_kind IN ('timed', 'all_day', 'time_tba')),
  timezone text,
  starts_at timestamptz,
  ends_at timestamptz,
  event_status text NOT NULL DEFAULT 'confirmed' CHECK (event_status IN (
    'confirmed', 'postponed', 'rescheduled', 'cancelled', 'completed'
  )),
  era_id uuid REFERENCES public.watch_eras(id) ON DELETE SET NULL,
  is_featured boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'in_review', 'approved', 'rejected', 'published', 'archived'
  )),
  approved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_on IS NULL OR (starts_on IS NOT NULL AND ends_on >= starts_on)),
  CHECK (ends_at IS NULL OR (starts_at IS NOT NULL AND ends_at >= starts_at)),
  CHECK (
    (time_kind = 'timed' AND starts_on IS NOT NULL AND starts_at IS NOT NULL AND timezone IS NOT NULL
      AND (ends_at IS NULL OR ends_on IS NOT NULL))
    OR (time_kind IN ('all_day', 'time_tba') AND starts_at IS NULL AND ends_at IS NULL)
  )
);

CREATE TABLE public.editorial_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.editorial_sources(id) ON DELETE RESTRICT,
  kind text NOT NULL CHECK (kind IN ('news', 'event')),
  external_id text CHECK (btrim(external_id) <> ''),
  source_url text NOT NULL CHECK (source_url ~ '^https?://[^[:space:]]+$'),
  canonical_url text NOT NULL CHECK (canonical_url ~ '^https?://[^[:space:]]+$'),
  original_title text NOT NULL CHECK (btrim(original_title) <> ''),
  original_excerpt text,
  original_language text,
  source_published_at timestamptz,
  content_fingerprint text CHECK (btrim(content_fingerprint) <> ''),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_review', 'accepted', 'rejected', 'duplicate'
  )),
  duplicate_of_id uuid REFERENCES public.editorial_candidates(id) ON DELETE SET NULL,
  editorial_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, canonical_url),
  CHECK (duplicate_of_id IS NULL OR duplicate_of_id <> id)
);

-- Source links are a public-facing snapshot of attribution; the registry
-- and candidate notes remain private. Multiple sources can support one item.
CREATE TABLE public.news_article_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES public.editorial_sources(id) ON DELETE RESTRICT,
  source_name text NOT NULL CHECK (btrim(source_name) <> ''),
  source_url text NOT NULL CHECK (source_url ~ '^https?://[^[:space:]]+$'),
  canonical_url text NOT NULL CHECK (canonical_url ~ '^https?://[^[:space:]]+$'),
  source_published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (article_id, canonical_url)
);

CREATE TABLE public.agenda_event_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.agenda_events(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES public.editorial_sources(id) ON DELETE RESTRICT,
  source_name text NOT NULL CHECK (btrim(source_name) <> ''),
  source_url text NOT NULL CHECK (source_url ~ '^https?://[^[:space:]]+$'),
  canonical_url text NOT NULL CHECK (canonical_url ~ '^https?://[^[:space:]]+$'),
  official_evidence boolean NOT NULL DEFAULT false,
  source_published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, canonical_url)
);

CREATE TABLE public.editorial_ai_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES public.editorial_candidates(id) ON DELETE SET NULL,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  operation text NOT NULL CHECK (operation IN ('classify', 'translate', 'summarize', 'extract', 'organize', 'combined')),
  model text NOT NULL CHECK (btrim(model) <> ''),
  input_hash text NOT NULL CHECK (btrim(input_hash) <> ''),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),
  input_tokens integer CHECK (input_tokens >= 0),
  output_tokens integer CHECK (output_tokens >= 0),
  reserved_cost_usd numeric(14,8) NOT NULL DEFAULT 0 CHECK (reserved_cost_usd >= 0),
  estimated_cost_usd numeric(14,8) CHECK (estimated_cost_usd >= 0),
  actual_cost_usd numeric(14,8) CHECK (actual_cost_usd >= 0),
  suggestion jsonb CHECK (suggestion IS NULL OR jsonb_typeof(suggestion) = 'object'),
  error_kind text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE public.editorial_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('news', 'event', 'source', 'candidate')),
  entity_id uuid NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('created', 'updated', 'status_changed')),
  previous_status text,
  new_status text,
  previous_event_status text,
  new_event_status text,
  previous_event_starts_on date,
  new_event_starts_on date,
  previous_event_starts_at timestamptz,
  new_event_starts_at timestamptz,
  previous_event_timezone text,
  new_event_timezone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Use the existing catalogs; no copied members, eras or videos.
CREATE TABLE public.news_article_members (
  article_id uuid NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, member_id)
);
CREATE TABLE public.agenda_event_members (
  event_id uuid NOT NULL REFERENCES public.agenda_events(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, member_id)
);
CREATE TABLE public.news_article_videos (
  article_id uuid NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.watch_videos(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, video_id)
);
CREATE TABLE public.agenda_event_videos (
  event_id uuid NOT NULL REFERENCES public.agenda_events(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.watch_videos(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, video_id)
);

CREATE INDEX editorial_sources_active_idx ON public.editorial_sources (is_active, name);
CREATE INDEX news_articles_feed_idx ON public.news_articles (published_at DESC, id) WHERE status = 'published';
CREATE INDEX news_articles_category_idx ON public.news_articles (category, status);
CREATE INDEX news_articles_era_idx ON public.news_articles (era_id);
CREATE INDEX agenda_events_calendar_idx ON public.agenda_events (starts_on, starts_at, id) WHERE status = 'published';
CREATE INDEX agenda_events_category_idx ON public.agenda_events (category, status);
CREATE INDEX agenda_events_era_idx ON public.agenda_events (era_id);
CREATE UNIQUE INDEX editorial_candidates_external_idx ON public.editorial_candidates (source_id, kind, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX editorial_candidates_fingerprint_idx ON public.editorial_candidates (kind, content_fingerprint) WHERE content_fingerprint IS NOT NULL;
CREATE INDEX editorial_candidates_queue_idx ON public.editorial_candidates (status, created_at DESC);
CREATE INDEX news_article_sources_url_idx ON public.news_article_sources (canonical_url);
CREATE INDEX agenda_event_sources_url_idx ON public.agenda_event_sources (canonical_url);
CREATE INDEX editorial_ai_runs_usage_idx ON public.editorial_ai_runs (created_at, status);
-- A retry after failure is allowed; a successful or in-flight identical request is reused.
CREATE UNIQUE INDEX editorial_ai_runs_reuse_idx ON public.editorial_ai_runs (model, operation, input_hash)
  WHERE status IN ('pending', 'succeeded');
CREATE INDEX editorial_audit_entity_idx ON public.editorial_audit_log (entity_type, entity_id, created_at DESC);
CREATE INDEX news_article_members_member_idx ON public.news_article_members (member_id, article_id);
CREATE INDEX agenda_event_members_member_idx ON public.agenda_event_members (member_id, event_id);
CREATE INDEX news_article_videos_video_idx ON public.news_article_videos (video_id, article_id);
CREATE INDEX agenda_event_videos_video_idx ON public.agenda_event_videos (video_id, event_id);

-- Use the existing administrator model, under the caller's RLS.
CREATE FUNCTION public.editorial_is_active_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users a
    WHERE a.user_id = (SELECT auth.uid()) AND a.is_active = true
  );
$$;
REVOKE ALL ON FUNCTION public.editorial_is_active_admin() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.editorial_is_active_admin() TO authenticated;

CREATE FUNCTION public.editorial_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.editorial_validate_event_time()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  IF NEW.timezone IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_timezone_names z WHERE z.name = NEW.timezone
  ) THEN
    RAISE EXCEPTION 'Use a valid IANA time zone.';
  END IF;
  IF NEW.time_kind = 'timed' AND (
    (NEW.starts_at AT TIME ZONE NEW.timezone)::date IS DISTINCT FROM NEW.starts_on
    OR (NEW.ends_at IS NOT NULL AND (NEW.ends_at AT TIME ZONE NEW.timezone)::date IS DISTINCT FROM NEW.ends_on)
  ) THEN
    RAISE EXCEPTION 'Event local date and time zone do not match the timestamp.';
  END IF;
  RETURN NEW;
END;
$$;

-- The source links of approved/published items are locked until an admin
-- returns that item to draft. Lock its parent row to serialize with review.
CREATE FUNCTION public.editorial_lock_source_parent()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
DECLARE
  parent_id uuid;
  parent_status text;
  parent_table text := TG_ARGV[0];
  parent_key text := TG_ARGV[1];
  source_type text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    parent_id := (pg_catalog.to_jsonb(OLD) ->> parent_key)::uuid;
  ELSE
    parent_id := (pg_catalog.to_jsonb(NEW) ->> parent_key)::uuid;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF (pg_catalog.to_jsonb(OLD) ->> parent_key)::uuid IS DISTINCT FROM parent_id THEN
      RAISE EXCEPTION 'Move evidence by removing and adding it on editable items.';
    END IF;
  END IF;
  EXECUTE pg_catalog.format('SELECT status FROM public.%I WHERE id = $1 FOR UPDATE', parent_table)
    INTO parent_status USING parent_id;
  IF parent_status IS NULL AND TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  IF parent_status IS NULL OR parent_status NOT IN ('draft', 'in_review', 'rejected') THEN
    RAISE EXCEPTION 'Evidence can only be edited while the item is editable.';
  END IF;
  IF TG_TABLE_NAME = 'agenda_event_sources' AND TG_OP <> 'DELETE' THEN
    IF NEW.official_evidence THEN
      SELECT source_kind INTO source_type FROM public.editorial_sources WHERE id = NEW.source_id;
      IF source_type IS NULL OR source_type NOT IN ('official_group', 'official_organizer', 'official_broadcaster') THEN
        RAISE EXCEPTION 'Official evidence requires an official source.';
      END IF;
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

-- Editorial publication is a deliberate admin-only transition, never an insert
-- or the direct result of discovery/AI. Published content edits return to draft.
CREATE FUNCTION public.editorial_validate_workflow()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
DECLARE
  allowed boolean;
  comparable_old jsonb;
  comparable_new jsonb;
  ignored_keys text[] := ARRAY['status','approved_at','published_at','updated_at','era_id','is_featured'];
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'draft' THEN
      RAISE EXCEPTION 'Editorial content must start as a draft.';
    END IF;
    NEW.approved_at := NULL;
    NEW.published_at := NULL;
    RETURN NEW;
  END IF;

  allowed := NEW.status = OLD.status OR
    CASE OLD.status
      WHEN 'draft' THEN NEW.status = 'in_review'
      WHEN 'in_review' THEN NEW.status IN ('draft', 'approved', 'rejected')
      WHEN 'approved' THEN NEW.status IN ('draft', 'published')
      WHEN 'rejected' THEN NEW.status = 'draft'
      WHEN 'published' THEN NEW.status IN ('draft', 'archived')
      WHEN 'archived' THEN NEW.status = 'draft'
      ELSE false
    END;
  IF NOT allowed THEN
    RAISE EXCEPTION 'Invalid editorial status transition: % -> %.', OLD.status, NEW.status;
  END IF;

  IF OLD.status IN ('approved', 'published', 'archived') AND NEW.status <> 'draft' THEN
    comparable_old := pg_catalog.to_jsonb(OLD) - ignored_keys;
    comparable_new := pg_catalog.to_jsonb(NEW) - ignored_keys;
    IF comparable_old IS DISTINCT FROM comparable_new THEN
      RAISE EXCEPTION 'Return the item to draft before editing approved or published content.';
    END IF;
  END IF;

  -- Protect review/publication timestamps even if clients submit their own values.
  NEW.approved_at := OLD.approved_at;
  NEW.published_at := OLD.published_at;
  IF NEW.status = 'draft' THEN
    NEW.approved_at := NULL;
    NEW.published_at := NULL;
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('approved', 'published') THEN
    IF NOT public.editorial_is_active_admin() THEN
      RAISE EXCEPTION 'An active authenticated admin must approve and publish editorial content.';
    END IF;
    IF COALESCE(btrim(NEW.title_pt), '') = '' OR COALESCE(btrim(NEW.title_en), '') = ''
      OR COALESCE(btrim(NEW.summary_pt), '') = '' OR COALESCE(btrim(NEW.summary_en), '') = '' THEN
      RAISE EXCEPTION 'Both Portuguese and English titles and summaries are required.';
    END IF;
    IF TG_TABLE_NAME = 'news_articles' THEN
      IF NOT EXISTS (SELECT 1 FROM public.news_article_sources s WHERE s.article_id = NEW.id) THEN
        RAISE EXCEPTION 'At least one attributed source is required.';
      END IF;
    ELSE
      IF NEW.starts_on IS NULL THEN
        RAISE EXCEPTION 'A confirmed calendar date is required.';
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM public.agenda_event_sources s
        JOIN public.editorial_sources es ON es.id = s.source_id
        WHERE s.event_id = NEW.id AND s.official_evidence
          AND es.source_kind IN ('official_group', 'official_organizer', 'official_broadcaster')
      ) THEN
        RAISE EXCEPTION 'An official source must confirm the event.';
      END IF;
    END IF;
    IF NEW.status = 'approved' THEN
      NEW.approved_at := pg_catalog.now();
    ELSE
      IF OLD.approved_at IS NULL THEN
        RAISE EXCEPTION 'An approval is required before publication.';
      END IF;
      NEW.published_at := pg_catalog.now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Audit metadata only; neither source excerpts nor AI inputs are copied here.
CREATE FUNCTION public.editorial_audit_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  previous jsonb;
  current_row jsonb := pg_catalog.to_jsonb(NEW);
  action_name text := 'created';
BEGIN
  IF TG_OP = 'UPDATE' THEN
    previous := pg_catalog.to_jsonb(OLD);
    IF previous ->> 'status' IS DISTINCT FROM current_row ->> 'status'
      OR previous ->> 'event_status' IS DISTINCT FROM current_row ->> 'event_status' THEN
      action_name := 'status_changed';
    ELSE
      action_name := 'updated';
    END IF;
  END IF;
  INSERT INTO public.editorial_audit_log (
    entity_type, entity_id, actor_id, action, previous_status, new_status,
    previous_event_status, new_event_status,
    previous_event_starts_on, new_event_starts_on,
    previous_event_starts_at, new_event_starts_at,
    previous_event_timezone, new_event_timezone
  ) VALUES (
    TG_ARGV[0], NEW.id, auth.uid(), action_name,
    previous ->> 'status', current_row ->> 'status',
    previous ->> 'event_status', current_row ->> 'event_status',
    (previous ->> 'starts_on')::date, (current_row ->> 'starts_on')::date,
    (previous ->> 'starts_at')::timestamptz, (current_row ->> 'starts_at')::timestamptz,
    previous ->> 'timezone', current_row ->> 'timezone'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER agenda_events_time BEFORE INSERT OR UPDATE ON public.agenda_events FOR EACH ROW EXECUTE FUNCTION public.editorial_validate_event_time();
CREATE TRIGGER news_articles_workflow BEFORE INSERT OR UPDATE ON public.news_articles FOR EACH ROW EXECUTE FUNCTION public.editorial_validate_workflow();
CREATE TRIGGER agenda_events_workflow BEFORE INSERT OR UPDATE ON public.agenda_events FOR EACH ROW EXECUTE FUNCTION public.editorial_validate_workflow();
CREATE TRIGGER news_article_sources_editable BEFORE INSERT OR UPDATE OR DELETE ON public.news_article_sources FOR EACH ROW
  EXECUTE FUNCTION public.editorial_lock_source_parent('news_articles', 'article_id');
CREATE TRIGGER agenda_event_sources_editable BEFORE INSERT OR UPDATE OR DELETE ON public.agenda_event_sources FOR EACH ROW
  EXECUTE FUNCTION public.editorial_lock_source_parent('agenda_events', 'event_id');

CREATE TRIGGER news_articles_audit AFTER INSERT OR UPDATE ON public.news_articles FOR EACH ROW EXECUTE FUNCTION public.editorial_audit_change('news');
CREATE TRIGGER agenda_events_audit AFTER INSERT OR UPDATE ON public.agenda_events FOR EACH ROW EXECUTE FUNCTION public.editorial_audit_change('event');
CREATE TRIGGER editorial_sources_audit AFTER INSERT OR UPDATE ON public.editorial_sources FOR EACH ROW EXECUTE FUNCTION public.editorial_audit_change('source');
CREATE TRIGGER editorial_candidates_audit AFTER INSERT OR UPDATE ON public.editorial_candidates FOR EACH ROW EXECUTE FUNCTION public.editorial_audit_change('candidate');

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['editorial_sources','news_articles','agenda_events','editorial_candidates','editorial_ai_runs']
  LOOP
    EXECUTE format('CREATE TRIGGER editorial_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.editorial_touch_updated_at()', table_name);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.editorial_touch_updated_at() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.editorial_validate_event_time() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.editorial_lock_source_parent() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.editorial_validate_workflow() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.editorial_audit_change() FROM PUBLIC, anon, authenticated, service_role;

-- Explicit least-privilege grants and RLS. Private records are never public.
DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'editorial_sources','news_articles','agenda_events','editorial_candidates',
    'news_article_sources','agenda_event_sources','editorial_ai_runs','editorial_audit_log',
    'news_article_members','agenda_event_members','news_article_videos','agenda_event_videos'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated, service_role', table_name);
    IF table_name = 'editorial_audit_log' THEN
      EXECUTE format('GRANT SELECT ON TABLE public.%I TO authenticated', table_name);
      EXECUTE format('CREATE POLICY editorial_admin_read ON public.%I FOR SELECT TO authenticated USING ((SELECT public.editorial_is_active_admin()))', table_name);
    ELSE
      EXECUTE format('GRANT SELECT, INSERT, UPDATE ON TABLE public.%I TO authenticated', table_name);
      EXECUTE format('CREATE POLICY editorial_admin_access ON public.%I FOR ALL TO authenticated USING ((SELECT public.editorial_is_active_admin())) WITH CHECK ((SELECT public.editorial_is_active_admin()))', table_name);
    END IF;
  END LOOP;
END;
$$;

GRANT SELECT ON public.news_articles, public.agenda_events TO anon;
CREATE POLICY editorial_public_read ON public.news_articles FOR SELECT TO anon, authenticated
  USING (status = 'published' AND published_at <= now());
CREATE POLICY editorial_public_read ON public.agenda_events FOR SELECT TO anon, authenticated
  USING (status = 'published' AND published_at <= now());

-- Public child records require a visible published parent; linked videos and
-- members must themselves be public. The catalog's own RLS remains intact.
DO $$
DECLARE item record;
BEGIN
  FOR item IN SELECT * FROM (VALUES
    ('news_article_sources', 'news_articles', 'article_id', ''),
    ('agenda_event_sources', 'agenda_events', 'event_id', ''),
    ('news_article_members', 'news_articles', 'article_id', ' AND EXISTS (SELECT 1 FROM public.members m WHERE m.id = news_article_members.member_id AND m.is_active)'),
    ('agenda_event_members', 'agenda_events', 'event_id', ' AND EXISTS (SELECT 1 FROM public.members m WHERE m.id = agenda_event_members.member_id AND m.is_active)'),
    ('news_article_videos', 'news_articles', 'article_id', ' AND EXISTS (SELECT 1 FROM public.watch_videos v WHERE v.id = news_article_videos.video_id AND v.status = ''published'')'),
    ('agenda_event_videos', 'agenda_events', 'event_id', ' AND EXISTS (SELECT 1 FROM public.watch_videos v WHERE v.id = agenda_event_videos.video_id AND v.status = ''published'')')
  ) AS links(table_name, parent_table, parent_key, extra_condition)
  LOOP
    EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon', item.table_name);
    EXECUTE format('GRANT DELETE ON TABLE public.%I TO authenticated', item.table_name);
    EXECUTE format(
      'CREATE POLICY editorial_public_read ON public.%I FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.%I p WHERE p.id = %I.%I AND p.status = ''published'' AND p.published_at <= now())%s)',
      item.table_name, item.parent_table, item.table_name, item.parent_key, item.extra_condition
    );
  END LOOP;
END;
$$;

COMMIT;
