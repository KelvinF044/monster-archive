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
