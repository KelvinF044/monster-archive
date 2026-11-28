BEGIN;

CREATE TABLE public.watch_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 60),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

ALTER TABLE public.watch_releases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.watch_releases FROM anon, authenticated;
GRANT SELECT ON public.watch_releases TO anon, authenticated;
GRANT INSERT ON public.watch_releases TO authenticated;

CREATE POLICY "Anyone can read watch releases"
  ON public.watch_releases FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can create watch releases"
  ON public.watch_releases FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admin_users AS admin
    WHERE admin.user_id = (SELECT auth.uid()) AND admin.is_active
  ));

ALTER TABLE public.watch_eras
  ADD COLUMN release_id uuid REFERENCES public.watch_releases(id) ON DELETE SET NULL;

CREATE INDEX watch_eras_release_id_idx ON public.watch_eras (release_id);

ALTER TABLE public.watch_video_members
  ADD COLUMN show_on_profile boolean NOT NULL DEFAULT false;

CREATE INDEX watch_video_members_profile_idx
  ON public.watch_video_members (member_id, video_id)
  WHERE show_on_profile;

INSERT INTO public.watch_releases (name, slug)
VALUES ('BABYMONS7ER', 'babymons7er'), ('DRIP', 'drip'),
       ('WE GO UP', 'we-go-up'), ('CHOOM', 'choom');

WITH campaigns (slug, name, display_order, release_slug) AS (
  VALUES
    ('pre-debut', 'PRE-DEBUT', 0, NULL),
    ('batter-up', 'BATTER UP', 10, 'babymons7er'),
    ('stuck-in-the-middle', 'STUCK IN THE MIDDLE', 20, 'babymons7er'),
    ('sheesh', 'SHEESH', 30, 'babymons7er'),
    ('forever', 'FOREVER', 40, 'drip'),
    ('clik-clak', 'CLIK CLAK', 50, 'drip'),
    ('drip', 'DRIP', 60, 'drip'),
    ('love-in-my-heart', 'LOVE IN MY HEART', 70, 'drip'),
    ('really-like-you', 'REALLY LIKE YOU', 80, 'drip'),
    ('hot-sauce', 'HOT SAUCE', 90, NULL),
    ('we-go-up', 'WE GO UP', 100, 'we-go-up'),
    ('really-like-you-2026', 'REALLY LIKE YOU (2026)', 110, 'drip'),
    ('choom', 'CHOOM', 120, 'choom'),
    ('sugar-honey-ice-tea', 'SUGAR HONEY ICE TEA', 130, NULL),
    ('deserve', 'DESERVE', 140, NULL)
)
INSERT INTO public.watch_eras (slug, name, normalized_name, display_order, release_id)
SELECT campaigns.slug, campaigns.name, campaigns.name, campaigns.display_order, release.id
FROM campaigns
LEFT JOIN public.watch_releases AS release ON release.slug = campaigns.release_slug
ON CONFLICT (normalized_name) DO UPDATE
SET display_order = excluded.display_order, release_id = excluded.release_id;

-- Update only reviewed entries. Mixed DRIP promotions keep their existing Era.
WITH assignments (youtube_id, campaign_name, previous_era) AS (
  VALUES
    ('aVsAVYDYhFI', 'PRE-DEBUT', NULL),
    ('hCgZqFscMp0', 'PRE-DEBUT', NULL),
    ('o0oW3lPoOXM', 'CLIK CLAK', 'DRIP'),
    ('frV8cZ_yA_4', 'CLIK CLAK', 'DRIP'),
    ('B1gDCOTpDzA', 'CLIK CLAK', 'DRIP'),
    ('OnO6cDEiDtQ', 'CLIK CLAK', 'DRIP'),
    ('jumkiRQgq98', 'REALLY LIKE YOU (2026)', 'DRIP'),
    ('CAdRNXmkuc4', 'REALLY LIKE YOU (2026)', NULL),
    ('kaRvFX3W9qk', 'REALLY LIKE YOU (2026)', 'DRIP')
)
UPDATE public.watch_videos AS video
SET era_id = era.id, era = era.name
FROM assignments
JOIN public.watch_eras AS era ON era.normalized_name = assignments.campaign_name
WHERE video.youtube_video_id = assignments.youtube_id
  AND video.status = 'published'
  AND coalesce(
    (SELECT current_era.normalized_name FROM public.watch_eras AS current_era WHERE current_era.id = video.era_id),
    nullif(upper(btrim(video.era)), '')
  ) IS NOT DISTINCT FROM assignments.previous_era;

-- Preserve the original HARAM title and enable the known solo performance for RAMI.
UPDATE public.watch_video_members AS link
SET show_on_profile = true
FROM public.watch_videos AS video, public.members AS member
WHERE link.video_id = video.id
  AND link.member_id = member.id
  AND video.youtube_video_id = 'aVsAVYDYhFI'
  AND video.status = 'published'
  AND member.slug = 'rami';

-- Confirmed individual and duet appearances in the current public catalog.
WITH appearances (youtube_id, member_slug) AS (
  VALUES
    ('UTfHawj9Z6w', 'ahyeon'),
    ('FGXyvxzn-X8', 'pharita'),
    ('FGXyvxzn-X8', 'ahyeon'),
    ('B30NKIKXU1c', 'ahyeon'),
    ('gaibNb_66uU', 'pharita'),
    ('kaRvFX3W9qk', 'rora'),
    ('kaRvFX3W9qk', 'chiquita')
)
INSERT INTO public.watch_video_members (video_id, member_id, show_on_profile)
SELECT video.id, member.id, true
FROM appearances
JOIN public.watch_videos AS video ON video.youtube_video_id = appearances.youtube_id
JOIN public.members AS member ON member.slug = appearances.member_slug
WHERE video.status = 'published' AND member.is_active
ON CONFLICT (video_id, member_id) DO UPDATE SET show_on_profile = true;

COMMIT;
