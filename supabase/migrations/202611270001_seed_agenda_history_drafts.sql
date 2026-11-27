-- MONSTER ARCHIVE - Phase 2.3 historical event drafts.
-- Sources: YG's monthly BABYMONSTER calendar and the official CHOOM tour.
-- Local dates from 2026-05-27 through 2026-11-26. The 12 August Chiba
-- start time follows the dedicated Japan announcement and tour listing.
-- Run after the editorial schema migrations. All new entries are drafts.
BEGIN;

CREATE TEMP TABLE history_candidates (
  slug text,
  category text,
  title_pt text,
  title_en text,
  summary_pt text,
  summary_en text,
  location text,
  venue_name text,
  official_event_url text,
  starts_on date,
  time_kind text,
  timezone text,
  starts_at timestamptz
) ON COMMIT DROP;

INSERT INTO history_candidates VALUES
  ('babymonster-yg-4622', 'music_show', 'BABYMONSTER — Mnet M Countdown', 'BABYMONSTER — Mnet M Countdown', 'A agenda oficial da YG registrou uma participação do BABYMONSTER em Mnet M Countdown.', 'YG’s official calendar listed a BABYMONSTER appearance at Mnet M Countdown.', NULL, NULL, 'https://ygfamily.com/ko/artists/babymonster/schedule', '2026-06-11', 'timed', 'Asia/Seoul', '2026-06-11T09:00:00.000Z'),
  ('babymonster-yg-4623', 'music_show', 'BABYMONSTER — MBC Show! Music Core', 'BABYMONSTER — MBC Show! Music Core', 'A agenda oficial da YG registrou uma participação do BABYMONSTER em MBC Show! Music Core.', 'YG’s official calendar listed a BABYMONSTER appearance at MBC Show! Music Core.', NULL, NULL, 'https://ygfamily.com/ko/artists/babymonster/schedule', '2026-06-13', 'timed', 'Asia/Seoul', '2026-06-13T06:20:00.000Z'),
  ('babymonster-yg-4625', 'music_show', 'BABYMONSTER — SBS Inkigayo', 'BABYMONSTER — SBS Inkigayo', 'A agenda oficial da YG registrou uma participação do BABYMONSTER em SBS Inkigayo.', 'YG’s official calendar listed a BABYMONSTER appearance at SBS Inkigayo.', NULL, NULL, 'https://ygfamily.com/ko/artists/babymonster/schedule', '2026-06-14', 'timed', 'Asia/Seoul', '2026-06-14T03:30:00.000Z'),
  ('babymonster-yg-4626', 'broadcast', 'BABYMONSTER — KBS Cool FM 오마이걸 효정의 볼륨을 높여요 (89.1MHz)', 'BABYMONSTER — KBS Cool FM 오마이걸 효정의 볼륨을 높여요 (89.1MHz)', 'A agenda oficial da YG registrou uma participação do BABYMONSTER em KBS Cool FM 오마이걸 효정의 볼륨을 높여요 (89.1MHz).', 'YG’s official calendar listed a BABYMONSTER appearance at KBS Cool FM 오마이걸 효정의 볼륨을 높여요 (89.1MHz).', NULL, NULL, 'https://ygfamily.com/ko/artists/babymonster/schedule', '2026-06-15', 'timed', 'Asia/Seoul', '2026-06-15T11:00:00.000Z'),
  ('babymonster-yg-4628', 'broadcast', 'BABYMONSTER — SBS PowerFM Cultwo Show', 'BABYMONSTER — SBS PowerFM Cultwo Show', 'A agenda oficial da YG registrou uma participação do BABYMONSTER em SBS PowerFM Cultwo Show.', 'YG’s official calendar listed a BABYMONSTER appearance at SBS PowerFM Cultwo Show.', NULL, NULL, 'https://ygfamily.com/ko/artists/babymonster/schedule', '2026-06-17', 'timed', 'Asia/Seoul', '2026-06-17T05:00:00.000Z'),
  ('babymonster-yg-4629', 'music_show', 'BABYMONSTER — Mnet M Countdown', 'BABYMONSTER — Mnet M Countdown', 'A agenda oficial da YG registrou uma participação do BABYMONSTER em Mnet M Countdown.', 'YG’s official calendar listed a BABYMONSTER appearance at Mnet M Countdown.', NULL, NULL, 'https://ygfamily.com/ko/artists/babymonster/schedule', '2026-06-18', 'timed', 'Asia/Seoul', '2026-06-18T09:00:00.000Z'),
  ('babymonster-yg-4627', 'broadcast', 'BABYMONSTER — KBS Cool FM 한해의 키스 더 라디오 (89.1MHz)', 'BABYMONSTER — KBS Cool FM 한해의 키스 더 라디오 (89.1MHz)', 'A agenda oficial da YG registrou uma participação do BABYMONSTER em KBS Cool FM 한해의 키스 더 라디오 (89.1MHz).', 'YG’s official calendar listed a BABYMONSTER appearance at KBS Cool FM 한해의 키스 더 라디오 (89.1MHz).', NULL, NULL, 'https://ygfamily.com/ko/artists/babymonster/schedule', '2026-06-19', 'timed', 'Asia/Seoul', '2026-06-19T13:00:00.000Z'),
  ('babymonster-yg-4630', 'music_show', 'BABYMONSTER — SBS Inkigayo', 'BABYMONSTER — SBS Inkigayo', 'A agenda oficial da YG registrou uma participação do BABYMONSTER em SBS Inkigayo.', 'YG’s official calendar listed a BABYMONSTER appearance at SBS Inkigayo.', NULL, NULL, 'https://ygfamily.com/ko/artists/babymonster/schedule', '2026-06-21', 'timed', 'Asia/Seoul', '2026-06-21T03:30:00.000Z'),
  ('babymonster-choom-seoul-2026-06-26', 'concert', 'BABYMONSTER WORLD TOUR [CHOOM] em SEOUL', 'BABYMONSTER WORLD TOUR [CHOOM] in SEOUL', 'A agenda oficial da YG registrou um show da turnê CHOOM em JAMSIL INDOOR STADIUM, SEOUL.', 'YG’s official calendar listed a CHOOM world tour show at JAMSIL INDOOR STADIUM in SEOUL.', 'SEOUL', 'JAMSIL INDOOR STADIUM', 'https://artist.ygfamily.co.kr/ARTISTS/BABYMONSTER/concert/worldtourchoom/index.html', '2026-06-26', 'timed', 'Asia/Seoul', '2026-06-26T11:00:00.000Z'),
  ('babymonster-choom-seoul-2026-06-27', 'concert', 'BABYMONSTER WORLD TOUR [CHOOM] em SEOUL', 'BABYMONSTER WORLD TOUR [CHOOM] in SEOUL', 'A agenda oficial da YG registrou um show da turnê CHOOM em JAMSIL INDOOR STADIUM, SEOUL.', 'YG’s official calendar listed a CHOOM world tour show at JAMSIL INDOOR STADIUM in SEOUL.', 'SEOUL', 'JAMSIL INDOOR STADIUM', 'https://artist.ygfamily.co.kr/ARTISTS/BABYMONSTER/concert/worldtourchoom/index.html', '2026-06-27', 'timed', 'Asia/Seoul', '2026-06-27T09:00:00.000Z'),
  ('babymonster-choom-seoul-2026-06-28', 'concert', 'BABYMONSTER WORLD TOUR [CHOOM] em SEOUL', 'BABYMONSTER WORLD TOUR [CHOOM] in SEOUL', 'A agenda oficial da YG registrou um show da turnê CHOOM em JAMSIL INDOOR STADIUM, SEOUL.', 'YG’s official calendar listed a CHOOM world tour show at JAMSIL INDOOR STADIUM in SEOUL.', 'SEOUL', 'JAMSIL INDOOR STADIUM', 'https://artist.ygfamily.co.kr/ARTISTS/BABYMONSTER/concert/worldtourchoom/index.html', '2026-06-28', 'timed', 'Asia/Seoul', '2026-06-28T08:00:00.000Z'),
  ('babymonster-choom-kobe-2026-07-08', 'concert', 'BABYMONSTER WORLD TOUR [CHOOM] em KOBE', 'BABYMONSTER WORLD TOUR [CHOOM] in KOBE', 'A agenda oficial da YG registrou um show da turnê CHOOM em GLION ARENA KOBE, KOBE.', 'YG’s official calendar listed a CHOOM world tour show at GLION ARENA KOBE in KOBE.', 'KOBE', 'GLION ARENA KOBE', 'https://artist.ygfamily.co.kr/ARTISTS/BABYMONSTER/concert/worldtourchoom/index.html', '2026-07-08', 'timed', 'Asia/Tokyo', '2026-07-08T09:00:00.000Z'),
  ('babymonster-choom-kobe-2026-07-09', 'concert', 'BABYMONSTER WORLD TOUR [CHOOM] em KOBE', 'BABYMONSTER WORLD TOUR [CHOOM] in KOBE', 'A agenda oficial da YG registrou um show da turnê CHOOM em GLION ARENA KOBE, KOBE.', 'YG’s official calendar listed a CHOOM world tour show at GLION ARENA KOBE in KOBE.', 'KOBE', 'GLION ARENA KOBE', 'https://artist.ygfamily.co.kr/ARTISTS/BABYMONSTER/concert/worldtourchoom/index.html', '2026-07-09', 'timed', 'Asia/Tokyo', '2026-07-09T09:00:00.000Z'),
  ('babymonster-yg-4664', 'music_show', 'BABYMONSTER — MBC Show! Music Core', 'BABYMONSTER — MBC Show! Music Core', 'A agenda oficial da YG registrou uma participação do BABYMONSTER em MBC Show! Music Core.', 'YG’s official calendar listed a BABYMONSTER appearance at MBC Show! Music Core.', NULL, NULL, 'https://ygfamily.com/ko/artists/babymonster/schedule', '2026-07-11', 'timed', 'Asia/Seoul', '2026-07-11T06:20:00.000Z'),
  ('babymonster-yg-4665', 'music_show', 'BABYMONSTER — SBS Inkigayo', 'BABYMONSTER — SBS Inkigayo', 'A agenda oficial da YG registrou uma participação do BABYMONSTER em SBS Inkigayo.', 'YG’s official calendar listed a BABYMONSTER appearance at SBS Inkigayo.', NULL, NULL, 'https://ygfamily.com/ko/artists/babymonster/schedule', '2026-07-12', 'timed', 'Asia/Seoul', '2026-07-12T06:20:00.000Z'),
  ('babymonster-choom-fukuoka-2026-07-28', 'concert', 'BABYMONSTER WORLD TOUR [CHOOM] em FUKUOKA', 'BABYMONSTER WORLD TOUR [CHOOM] in FUKUOKA', 'A agenda oficial da YG registrou um show da turnê CHOOM em MARINE MESSE FUKUOKA HALL A, FUKUOKA.', 'YG’s official calendar listed a CHOOM world tour show at MARINE MESSE FUKUOKA HALL A in FUKUOKA.', 'FUKUOKA', 'MARINE MESSE FUKUOKA HALL A', 'https://artist.ygfamily.co.kr/ARTISTS/BABYMONSTER/concert/worldtourchoom/index.html', '2026-07-28', 'timed', 'Asia/Tokyo', '2026-07-28T09:00:00.000Z'),
  ('babymonster-choom-fukuoka-2026-07-29', 'concert', 'BABYMONSTER WORLD TOUR [CHOOM] em FUKUOKA', 'BABYMONSTER WORLD TOUR [CHOOM] in FUKUOKA', 'A agenda oficial da YG registrou um show da turnê CHOOM em MARINE MESSE FUKUOKA HALL A, FUKUOKA.', 'YG’s official calendar listed a CHOOM world tour show at MARINE MESSE FUKUOKA HALL A in FUKUOKA.', 'FUKUOKA', 'MARINE MESSE FUKUOKA HALL A', 'https://artist.ygfamily.co.kr/ARTISTS/BABYMONSTER/concert/worldtourchoom/index.html', '2026-07-29', 'timed', 'Asia/Tokyo', '2026-07-29T09:00:00.000Z'),
  ('babymonster-choom-yokohama-2026-08-01', 'concert', 'BABYMONSTER WORLD TOUR [CHOOM] em YOKOHAMA', 'BABYMONSTER WORLD TOUR [CHOOM] in YOKOHAMA', 'A agenda oficial da YG registrou um show da turnê CHOOM em PIA ARENA MM, YOKOHAMA.', 'YG’s official calendar listed a CHOOM world tour show at PIA ARENA MM in YOKOHAMA.', 'YOKOHAMA', 'PIA ARENA MM', 'https://artist.ygfamily.co.kr/ARTISTS/BABYMONSTER/concert/worldtourchoom/index.html', '2026-08-01', 'timed', 'Asia/Tokyo', '2026-08-01T09:00:00.000Z'),
  ('babymonster-choom-yokohama-2026-08-02', 'concert', 'BABYMONSTER WORLD TOUR [CHOOM] em YOKOHAMA', 'BABYMONSTER WORLD TOUR [CHOOM] in YOKOHAMA', 'A agenda oficial da YG registrou um show da turnê CHOOM em PIA ARENA MM, YOKOHAMA.', 'YG’s official calendar listed a CHOOM world tour show at PIA ARENA MM in YOKOHAMA.', 'YOKOHAMA', 'PIA ARENA MM', 'https://artist.ygfamily.co.kr/ARTISTS/BABYMONSTER/concert/worldtourchoom/index.html', '2026-08-02', 'timed', 'Asia/Tokyo', '2026-08-02T07:00:00.000Z'),
  ('babymonster-yg-4683', 'music_show', 'BABYMONSTER — Mnet M Countdown', 'BABYMONSTER — Mnet M Countdown', 'A agenda oficial da YG registrou uma participação do BABYMONSTER em Mnet M Countdown.', 'YG’s official calendar listed a BABYMONSTER appearance at Mnet M Countdown.', NULL, NULL, 'https://ygfamily.com/ko/artists/babymonster/schedule', '2026-08-06', 'timed', 'Asia/Seoul', '2026-08-06T09:00:00.000Z'),
  ('babymonster-yg-4684', 'music_show', 'BABYMONSTER — MBC Show! Music Core', 'BABYMONSTER — MBC Show! Music Core', 'A agenda oficial da YG registrou uma participação do BABYMONSTER em MBC Show! Music Core.', 'YG’s official calendar listed a BABYMONSTER appearance at MBC Show! Music Core.', NULL, NULL, 'https://ygfamily.com/ko/artists/babymonster/schedule', '2026-08-08', 'timed', 'Asia/Seoul', '2026-08-08T06:20:00.000Z'),
  ('babymonster-yg-4639', 'broadcast', 'BABYMONSTER — SBS 가요대전 ~SUMMER~', 'BABYMONSTER — SBS 가요대전 ~SUMMER~', 'A agenda oficial da YG registrou uma participação do BABYMONSTER em SBS 가요대전 ~SUMMER~.', 'YG’s official calendar listed a BABYMONSTER appearance at SBS 가요대전 ~SUMMER~.', NULL, '일산 KINTEX', 'https://ygfamily.com/ko/artists/babymonster/schedule', '2026-08-09', 'timed', 'Asia/Seoul', '2026-08-09T10:00:00.000Z'),
  ('babymonster-choom-chiba-2026-08-11', 'concert', 'BABYMONSTER WORLD TOUR [CHOOM] em CHIBA', 'BABYMONSTER WORLD TOUR [CHOOM] in CHIBA', 'A agenda oficial da YG registrou um show da turnê CHOOM em LaLa arena TOKYO-BAY, CHIBA.', 'YG’s official calendar listed a CHOOM world tour show at LaLa arena TOKYO-BAY in CHIBA.', 'CHIBA', 'LaLa arena TOKYO-BAY', 'https://artist.ygfamily.co.kr/ARTISTS/BABYMONSTER/concert/worldtourchoom/index.html', '2026-08-11', 'timed', 'Asia/Tokyo', '2026-08-11T09:00:00.000Z'),
  ('babymonster-choom-chiba-2026-08-12', 'concert', 'BABYMONSTER WORLD TOUR [CHOOM] em CHIBA', 'BABYMONSTER WORLD TOUR [CHOOM] in CHIBA', 'A agenda oficial da YG registrou um show da turnê CHOOM em LaLa arena TOKYO-BAY, CHIBA.', 'YG’s official calendar listed a CHOOM world tour show at LaLa arena TOKYO-BAY in CHIBA.', 'CHIBA', 'LaLa arena TOKYO-BAY', 'https://yg-babymonster-official.jp/live/2026-2027_worldtour_in_japan/', '2026-08-12', 'timed', 'Asia/Tokyo', '2026-08-12T09:00:00.000Z'),
  ('babymonster-yg-4586', 'festival', 'BABYMONSTER — SUMMER SONIC 2026 @TOKYO', 'BABYMONSTER — SUMMER SONIC 2026 @TOKYO', 'A agenda oficial da YG registrou uma participação do BABYMONSTER em SUMMER SONIC 2026 @TOKYO.', 'YG’s official calendar listed a BABYMONSTER appearance at SUMMER SONIC 2026 @TOKYO.', 'Chiba, Japão', 'MARINE STAGE', 'https://ygfamily.com/ko/artists/babymonster/schedule', '2026-08-14', 'time_tba', 'Asia/Tokyo', NULL),
  ('babymonster-choom-nagoya-2026-08-16', 'concert', 'BABYMONSTER WORLD TOUR [CHOOM] em NAGOYA', 'BABYMONSTER WORLD TOUR [CHOOM] in NAGOYA', 'A agenda oficial da YG registrou um show da turnê CHOOM em IG ARENA, NAGOYA.', 'YG’s official calendar listed a CHOOM world tour show at IG ARENA in NAGOYA.', 'NAGOYA', 'IG ARENA', 'https://artist.ygfamily.co.kr/ARTISTS/BABYMONSTER/concert/worldtourchoom/index.html', '2026-08-16', 'timed', 'Asia/Tokyo', '2026-08-16T09:00:00.000Z'),
  ('babymonster-choom-manila-2026-09-05', 'concert', 'BABYMONSTER WORLD TOUR [CHOOM] em MANILA', 'BABYMONSTER WORLD TOUR [CHOOM] in MANILA', 'A agenda oficial da YG registrou um show da turnê CHOOM em SM MALL OF ASIA ARENA, MANILA.', 'YG’s official calendar listed a CHOOM world tour show at SM MALL OF ASIA ARENA in MANILA.', 'MANILA', 'SM MALL OF ASIA ARENA', 'https://artist.ygfamily.co.kr/ARTISTS/BABYMONSTER/concert/worldtourchoom/index.html', '2026-09-05', 'timed', 'Asia/Manila', '2026-09-05T11:00:00.000Z'),
  ('babymonster-choom-macao-2026-09-11', 'concert', 'BABYMONSTER WORLD TOUR [CHOOM] em MACAO', 'BABYMONSTER WORLD TOUR [CHOOM] in MACAO', 'A agenda oficial da YG registrou um show da turnê CHOOM em THE VENETIAN ARENA, MACAO.', 'YG’s official calendar listed a CHOOM world tour show at THE VENETIAN ARENA in MACAO.', 'MACAO', 'THE VENETIAN ARENA', 'https://artist.ygfamily.co.kr/ARTISTS/BABYMONSTER/concert/worldtourchoom/index.html', '2026-09-11', 'timed', 'Asia/Macau', '2026-09-11T12:00:00.000Z'),
  ('babymonster-choom-macao-2026-09-12', 'concert', 'BABYMONSTER WORLD TOUR [CHOOM] em MACAO', 'BABYMONSTER WORLD TOUR [CHOOM] in MACAO', 'A agenda oficial da YG registrou um show da turnê CHOOM em THE VENETIAN ARENA, MACAO.', 'YG’s official calendar listed a CHOOM world tour show at THE VENETIAN ARENA in MACAO.', 'MACAO', 'THE VENETIAN ARENA', 'https://artist.ygfamily.co.kr/ARTISTS/BABYMONSTER/concert/worldtourchoom/index.html', '2026-09-12', 'timed', 'Asia/Macau', '2026-09-12T10:00:00.000Z'),
  ('babymonster-choom-osaka-2026-09-22', 'concert', 'BABYMONSTER WORLD TOUR [CHOOM] em OSAKA', 'BABYMONSTER WORLD TOUR [CHOOM] in OSAKA', 'A agenda oficial da YG registrou um show da turnê CHOOM em KYOCERA DOME OSAKA, OSAKA.', 'YG’s official calendar listed a CHOOM world tour show at KYOCERA DOME OSAKA in OSAKA.', 'OSAKA', 'KYOCERA DOME OSAKA', 'https://artist.ygfamily.co.kr/ARTISTS/BABYMONSTER/concert/worldtourchoom/index.html', '2026-09-22', 'timed', 'Asia/Tokyo', '2026-09-22T10:00:00.000Z'),
  ('babymonster-choom-osaka-2026-09-23', 'concert', 'BABYMONSTER WORLD TOUR [CHOOM] em OSAKA', 'BABYMONSTER WORLD TOUR [CHOOM] in OSAKA', 'A agenda oficial da YG registrou um show da turnê CHOOM em KYOCERA DOME OSAKA, OSAKA.', 'YG’s official calendar listed a CHOOM world tour show at KYOCERA DOME OSAKA in OSAKA.', 'OSAKA', 'KYOCERA DOME OSAKA', 'https://artist.ygfamily.co.kr/ARTISTS/BABYMONSTER/concert/worldtourchoom/index.html', '2026-09-23', 'timed', 'Asia/Tokyo', '2026-09-23T06:00:00.000Z'),
  ('babymonster-choom-jakarta-2026-10-17', 'concert', 'BABYMONSTER WORLD TOUR [CHOOM] em JAKARTA', 'BABYMONSTER WORLD TOUR [CHOOM] in JAKARTA', 'A agenda oficial da YG registrou um show da turnê CHOOM em INDONESIA ARENA, JAKARTA.', 'YG’s official calendar listed a CHOOM world tour show at INDONESIA ARENA in JAKARTA.', 'JAKARTA', 'INDONESIA ARENA', 'https://artist.ygfamily.co.kr/ARTISTS/BABYMONSTER/concert/worldtourchoom/index.html', '2026-10-17', 'timed', 'Asia/Jakarta', '2026-10-17T11:30:00.000Z'),
  ('babymonster-yg-4724', 'music_show', 'BABYMONSTER — MBC Show! Music Core', 'BABYMONSTER — MBC Show! Music Core', 'A agenda oficial da YG registrou uma participação do BABYMONSTER em MBC Show! Music Core.', 'YG’s official calendar listed a BABYMONSTER appearance at MBC Show! Music Core.', NULL, NULL, 'https://ygfamily.com/ko/artists/babymonster/schedule', '2026-10-24', 'timed', 'Asia/Seoul', '2026-10-24T06:20:00.000Z'),
  ('babymonster-yg-4725', 'music_show', 'BABYMONSTER — SBS Inkigayo', 'BABYMONSTER — SBS Inkigayo', 'A agenda oficial da YG registrou uma participação do BABYMONSTER em SBS Inkigayo.', 'YG’s official calendar listed a BABYMONSTER appearance at SBS Inkigayo.', NULL, NULL, 'https://ygfamily.com/ko/artists/babymonster/schedule', '2026-10-25', 'timed', 'Asia/Seoul', '2026-10-25T06:20:00.000Z'),
  ('babymonster-yg-4727', 'music_show', 'BABYMONSTER — SBS Inkigayo', 'BABYMONSTER — SBS Inkigayo', 'A agenda oficial da YG registrou uma participação do BABYMONSTER em SBS Inkigayo.', 'YG’s official calendar listed a BABYMONSTER appearance at SBS Inkigayo.', NULL, NULL, 'https://ygfamily.com/ko/artists/babymonster/schedule', '2026-11-01', 'timed', 'Asia/Seoul', '2026-11-01T06:20:00.000Z'),
  ('babymonster-yg-4729', 'broadcast', 'BABYMONSTER — MBC FM4U Hope Song at Noon', 'BABYMONSTER — MBC FM4U Hope Song at Noon', 'A agenda oficial da YG registrou uma participação do BABYMONSTER em MBC FM4U Hope Song at Noon.', 'YG’s official calendar listed a BABYMONSTER appearance at MBC FM4U Hope Song at Noon.', NULL, NULL, 'https://ygfamily.com/ko/artists/babymonster/schedule', '2026-11-04', 'timed', 'Asia/Seoul', '2026-11-04T03:00:00.000Z'),
  ('babymonster-yg-4730', 'broadcast', 'BABYMONSTER — SBS PowerFM Wendy’s Youngstreet', 'BABYMONSTER — SBS PowerFM Wendy’s Youngstreet', 'A agenda oficial da YG registrou uma participação do BABYMONSTER em SBS PowerFM Wendy’s Youngstreet.', 'YG’s official calendar listed a BABYMONSTER appearance at SBS PowerFM Wendy’s Youngstreet.', NULL, NULL, 'https://ygfamily.com/ko/artists/babymonster/schedule', '2026-11-04', 'timed', 'Asia/Seoul', '2026-11-04T11:00:00.000Z'),
  ('babymonster-yg-4731', 'broadcast', 'BABYMONSTER — SBS PowerFM Cultwo Show', 'BABYMONSTER — SBS PowerFM Cultwo Show', 'A agenda oficial da YG registrou uma participação do BABYMONSTER em SBS PowerFM Cultwo Show.', 'YG’s official calendar listed a BABYMONSTER appearance at SBS PowerFM Cultwo Show.', NULL, NULL, 'https://ygfamily.com/ko/artists/babymonster/schedule', '2026-11-05', 'timed', 'Asia/Seoul', '2026-11-05T05:00:00.000Z'),
  ('babymonster-choom-bangkok-2026-11-07', 'concert', 'BABYMONSTER WORLD TOUR [CHOOM] em BANGKOK', 'BABYMONSTER WORLD TOUR [CHOOM] in BANGKOK', 'A agenda oficial da YG registrou um show da turnê CHOOM em IMPACT ARENA, BANGKOK.', 'YG’s official calendar listed a CHOOM world tour show at IMPACT ARENA in BANGKOK.', 'BANGKOK', 'IMPACT ARENA', 'https://artist.ygfamily.co.kr/ARTISTS/BABYMONSTER/concert/worldtourchoom/index.html', '2026-11-07', 'timed', 'Asia/Bangkok', '2026-11-07T11:00:00.000Z'),
  ('babymonster-choom-bangkok-2026-11-08', 'concert', 'BABYMONSTER WORLD TOUR [CHOOM] em BANGKOK', 'BABYMONSTER WORLD TOUR [CHOOM] in BANGKOK', 'A agenda oficial da YG registrou um show da turnê CHOOM em IMPACT ARENA, BANGKOK.', 'YG’s official calendar listed a CHOOM world tour show at IMPACT ARENA in BANGKOK.', 'BANGKOK', 'IMPACT ARENA', 'https://artist.ygfamily.co.kr/ARTISTS/BABYMONSTER/concert/worldtourchoom/index.html', '2026-11-08', 'timed', 'Asia/Bangkok', '2026-11-08T11:00:00.000Z'),
  ('babymonster-choom-kuala-lumpur-2026-11-14', 'concert', 'BABYMONSTER WORLD TOUR [CHOOM] em KUALA LUMPUR', 'BABYMONSTER WORLD TOUR [CHOOM] in KUALA LUMPUR', 'A agenda oficial da YG registrou um show da turnê CHOOM em UNIFI ARENA, KUALA LUMPUR.', 'YG’s official calendar listed a CHOOM world tour show at UNIFI ARENA in KUALA LUMPUR.', 'KUALA LUMPUR', 'UNIFI ARENA', 'https://artist.ygfamily.co.kr/ARTISTS/BABYMONSTER/concert/worldtourchoom/index.html', '2026-11-14', 'timed', 'Asia/Kuala_Lumpur', '2026-11-14T09:00:00.000Z'),
  ('babymonster-yg-4732', 'awards', 'BABYMONSTER — 2026 MAMA AWARDS', 'BABYMONSTER — 2026 MAMA AWARDS', 'A agenda oficial da YG registrou uma participação do BABYMONSTER em 2026 MAMA AWARDS.', 'YG’s official calendar listed a BABYMONSTER appearance at 2026 MAMA AWARDS.', 'Osaka, Japão', 'KYOCERA DOME OSAKA', 'https://ygfamily.com/ko/artists/babymonster/schedule', '2026-11-20', 'timed', 'Asia/Tokyo', '2026-11-20T09:00:00.000Z'),
  ('babymonster-choom-taipei-2026-11-21', 'concert', 'BABYMONSTER WORLD TOUR [CHOOM] em TAIPEI', 'BABYMONSTER WORLD TOUR [CHOOM] in TAIPEI', 'A agenda oficial da YG registrou um show da turnê CHOOM em TAIPEI ARENA, TAIPEI.', 'YG’s official calendar listed a CHOOM world tour show at TAIPEI ARENA in TAIPEI.', 'TAIPEI', 'TAIPEI ARENA', 'https://artist.ygfamily.co.kr/ARTISTS/BABYMONSTER/concert/worldtourchoom/index.html', '2026-11-21', 'timed', 'Asia/Taipei', '2026-11-21T11:30:00.000Z'),
  ('babymonster-choom-taipei-2026-11-22', 'concert', 'BABYMONSTER WORLD TOUR [CHOOM] em TAIPEI', 'BABYMONSTER WORLD TOUR [CHOOM] in TAIPEI', 'A agenda oficial da YG registrou um show da turnê CHOOM em TAIPEI ARENA, TAIPEI.', 'YG’s official calendar listed a CHOOM world tour show at TAIPEI ARENA in TAIPEI.', 'TAIPEI', 'TAIPEI ARENA', 'https://artist.ygfamily.co.kr/ARTISTS/BABYMONSTER/concert/worldtourchoom/index.html', '2026-11-22', 'timed', 'Asia/Taipei', '2026-11-22T10:00:00.000Z');

INSERT INTO public.editorial_sources (name, homepage_url, source_kind)
SELECT 'YG Entertainment', 'https://ygfamily.com/', 'official_group'
WHERE NOT EXISTS (
  SELECT 1 FROM public.editorial_sources
  WHERE source_kind = 'official_group' AND is_active
    AND rtrim(homepage_url, '/') IN ('https://ygfamily.com', 'https://www.ygfamily.com')
)
ON CONFLICT (name, homepage_url) DO NOTHING;

CREATE TEMP TABLE history_source ON COMMIT DROP AS
SELECT id, name
FROM public.editorial_sources
WHERE source_kind = 'official_group' AND is_active
  AND rtrim(homepage_url, '/') IN ('https://ygfamily.com', 'https://www.ygfamily.com')
ORDER BY (homepage_url = 'https://ygfamily.com/') DESC, created_at, id
LIMIT 1;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM history_source) THEN
    RAISE EXCEPTION 'No active official YG Entertainment source is available for the historical drafts.';
  END IF;
END;
$$;

CREATE TEMP TABLE history_insertions (
  id uuid,
  official_event_url text
) ON COMMIT DROP;

WITH added AS (
  INSERT INTO public.agenda_events (
    slug, category, title_pt, title_en, summary_pt, summary_en, location,
    venue_name, official_event_url, starts_on, time_kind, timezone, starts_at, status
  )
  SELECT candidate.*, 'draft'
  FROM history_candidates AS candidate
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.agenda_events AS existing
    WHERE existing.starts_on = candidate.starts_on
      AND (
        lower(btrim(existing.title_en)) = lower(btrim(candidate.title_en))
        OR lower(btrim(existing.title_pt)) = lower(btrim(candidate.title_pt))
        OR (
          candidate.slug LIKE 'babymonster-choom-%'
          AND existing.category = 'concert'
          AND lower(btrim(existing.venue_name)) = lower(btrim(candidate.venue_name))
          AND existing.starts_at = candidate.starts_at
        )
      )
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id, official_event_url
)
INSERT INTO history_insertions SELECT id, official_event_url FROM added;

INSERT INTO public.agenda_event_sources (
  event_id, source_id, source_name, source_url, canonical_url, official_evidence
)
SELECT inserted.id, source.id, source.name, inserted.official_event_url,
  inserted.official_event_url, true
FROM history_insertions AS inserted CROSS JOIN history_source AS source;

SELECT (SELECT count(*) FROM history_candidates) AS official_events_in_batch,
       (SELECT count(*) FROM history_insertions) AS drafts_inserted;

COMMIT;
