import assert from "node:assert/strict";
import test from "node:test";
import { parseChoomSchedule, parseCoachellaAnnouncement } from "../src/lib/admin/schedule/parse-discovered-events.ts";
import { parseEvent } from "../src/lib/admin/schedule/model.ts";
import { EVENT_SOURCE_URLS, isEventProvider } from "../src/lib/admin/schedule/discovery.ts";

function tourStop(city, venue, dates) {
  return `<div class="row">
    <div class="left"><div class="item1">${city}</div><div class="item2">${venue}</div></div>
    <div class="right"><div class="item4">${dates.map(date => `<p>${date}</p>`).join("")}</div></div>
  </div>`;
}

test("CHOOM tour retains separate performances and converts official 12-hour local times", () => {
  const events = parseChoomSchedule(tourStop("SINGAPORE", "Singapore Indoor Stadium", [
    "2026.11.28. (SAT) 6:30PM",
    "2026.11.29. (SUN) 12AM",
  ]));
  assert.equal(events.length, 2);
  assert.notEqual(events[0].slug, events[1].slug);
  assert.equal(events[0].start_time, "18:30");
  assert.equal(events[1].start_time, "00:00");
  assert.equal(events[0].timezone, "Asia/Singapore");
  assert.equal(events[0].official_event_url, EVENT_SOURCE_URLS.choom);
  assert.equal(parseEvent(events[0]).fields.starts_at, "2026-11-28T10:30:00.000Z");
});

test("an unannounced time and an unmapped time zone do not invent a UTC instant", () => {
  const events = parseChoomSchedule(
    tourStop("AUCKLAND", "Spark Arena", ["2026.12.08. (TUE)"]) +
    tourStop("UNMAPPED CITY", "Venue", ["2026.12.09. (WED) 7PM"]),
  );
  assert.equal(events.length, 2);
  for (const event of events) {
    assert.equal(event.time_kind, "time_tba");
    assert.equal(parseEvent(event).fields.starts_at, null);
  }
});

test("Coachella uses the official article and keeps the two dates separate without a set time", () => {
  const html = `<div class="view_header"><div class="view_tit"><h2>BABYMONSTER at Coachella</h2></div></div>
    <div class="view_body"><div class="ql-editor"><p>BABYMONSTER will perform at the 2027 Coachella Valley Music and Arts Festival.
    BABYMONSTER will take the stage twice, on April 11 and 18 next year.</p></div></div>`;
  const events = parseCoachellaAnnouncement(html);
  assert.deepEqual(events.map(event => event.starts_on), ["2027-04-11", "2027-04-18"]);
  assert.ok(events.every(event => event.time_kind === "time_tba" && event.official_event_url === EVENT_SOURCE_URLS.coachella));
  assert.deepEqual(parseCoachellaAnnouncement(html.replaceAll("BABYMONSTER", "Other Group")), []);
});

test("event discovery accepts configured providers only and fails on ambiguous tour dates", () => {
  assert.equal(isEventProvider("choom"), true);
  assert.equal(isEventProvider("https://example.com"), false);
  assert.throws(() => parseChoomSchedule(tourStop("SEOUL", "Arena", [
    "2027.01.08. (FRI) 6PM", "2027.01.08. (FRI) 8PM",
  ])), /duplicate/);
});

test("YG calendar requests the current Seoul month and next two, across a year boundary", async () => {
  const { ygScheduleMonths } = await import("../src/lib/admin/schedule/yg-schedule.ts");
  const results = ygScheduleMonths(new Date("2026-11-30T16:00:00Z"));
  assert.deepEqual(results.map(row => row.period), ["2026-12", "2027-01", "2027-02"]);
  assert.equal(results[1].url, "https://ygfamily.com/api/artist/schedule/list/319/2027/1");
});

test("YG calendar identifies music shows and distinct same-day radio appearances", async () => {
  const { parseYgSchedule } = await import("../src/lib/admin/schedule/yg-schedule.ts");
  const event = { artistId: 319, place: "", date: "2026-11-04", time: "15:20", isDisplay: true };
  const results = parseYgSchedule([
    { ...event, id: 1, type: "tv", title: "SBS 인기가요" },
    { ...event, id: 2, type: "radio", title: "MBC FM4U 정오의 희망곡 김신영입니다" },
    { ...event, id: 3, type: "radio", title: "SBS 파워FM 웬디의 영스트리트" },
    { ...event, id: 4, type: "tv", title: "2026 MAMA AWARDS", place: "KYOCERA DOME OSAKA" },
    { ...event, id: 5, type: "tv", title: "Hidden", isDisplay: false },
    { ...event, id: 6, type: "tv", title: "KBS 뮤직뱅크 (취소)" },
    { ...event, id: 7, type: "tv", title: "Another artist", artistId: 320 },
  ], "2026-11");
  assert.deepEqual(results.map(row => row.category), ["music_show", "broadcast", "broadcast", "awards"]);
  assert.equal(new Set(results.map(row => row.slug)).size, 4);
  assert.equal(results[0].title_en, "BABYMONSTER — SBS Inkigayo");
  assert.equal(parseEvent(results[0]).fields.starts_at, "2026-11-04T06:20:00.000Z");
  assert.equal(results[3].time_kind, "time_tba");
  assert.equal(results[3].timezone, "");
});

test("a show in the official calendar has the same slug as the dedicated tour source", async () => {
  const { parseYgSchedule } = await import("../src/lib/admin/schedule/yg-schedule.ts");
  const official = parseYgSchedule([{
    id: 4576, artistId: 319, title: "2026-27 BABYMONSTER WORLD TOUR [춤 (CHOOM)] IN SINGAPORE",
    place: "SINGAPORE INDOOR STADIUM", date: "2026-11-28", time: "18:00", type: "concert", isDisplay: true,
  }], "2026-11")[0];
  const tour = parseChoomSchedule(tourStop("SINGAPORE", "SINGAPORE INDOOR STADIUM", ["2026.11.28. (SAT) 6PM"]))[0];
  assert.equal(official.slug, tour.slug);
  assert.equal(official.timezone, "Asia/Singapore");
  assert.equal(official.official_event_url, EVENT_SOURCE_URLS["yg-schedule"]);
  assert.deepEqual(parseYgSchedule([], "2027-02"), []);
  assert.throws(() => parseYgSchedule({ data: [] }, "2027-02"), /Invalid YG schedule response/);
  assert.throws(() => parseYgSchedule([{ format: "unknown" }], "2027-02"), /Unrecognized/);
});
