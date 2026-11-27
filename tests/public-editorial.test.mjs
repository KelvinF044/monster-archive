import test from "node:test";
import assert from "node:assert/strict";
import { parseFilters, editorialHref, hasFilters, validSlug, coverUrl, localText, calendarDays, shiftMonth, occursOn, eventClock, displayDate, eventTimeFilter } from "../src/lib/editorial/model.ts";
const now = new Date("2026-11-26T00:11:00Z");
const id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

test("public filters accept supported categories and UUIDs, not arbitrary syntax", () => {
  const result = parseFilters({q:"DRIP, (teste)",category:"official_announcements",member:id,era:"invalid",status:"draft",page:"2",view:"history"}, "news", now);
  assert.deepEqual(result, {q:"DRIP teste",category:"official_announcements",member:id,era:"",status:"",page:2,view:"upcoming",month:"2026-11"});
  assert.equal(hasFilters(result),true);
  assert.equal(parseFilters({category:"concert",q:["a","b"],page:"-5",month:"2026-13"}, "news",now).category,"");
  assert.equal(parseFilters({page:"-5"},"news",now).page,1);
});
test("calendar navigation retains filters and never retains page offsets", () => {
  const f = parseFilters({view:"calendar",month:"2026-12",status:"rescheduled",category:"concert",member:id,page:"100"}, "schedule",now);
  const url = new URL(editorialHref("schedule",f,{month:"2027-01"}),"https://example.com");
  assert.equal(url.searchParams.get("month"),"2027-01");
  assert.equal(url.searchParams.get("status"),"rescheduled");
  assert.equal(url.searchParams.get("member"),id);
  assert.equal(url.searchParams.has("page"),false);
  assert.equal(parseFilters({month:"0001-01",view:"calendar"},"schedule",now).month,"2026-11");
});
test("only valid public slugs and HTTPS image URLs are accepted",()=>{
  assert.equal(validSlug("teste-noticia-monster-archive"),true);
  assert.equal(validSlug("../draft"),false);
  assert.equal(validSlug("a".repeat(121)),false);
  assert.equal(coverUrl("https://example.com/image.jpg"),"https://example.com/image.jpg");
  for (const url of ["javascript:alert(1)","http://example.com/image.jpg","https://user:pass@example.com/a","https://example.com/a b"]) assert.equal(coverUrl(url),null);
});
test("localization honors active language with fallback",()=>{
  assert.equal(localText("Notícia","News","pt-BR"),"Notícia");
  assert.equal(localText(null,"News","pt-BR"),"News");
  assert.equal(localText("Notícia",null,"en"),"Notícia");
});
test("calendar starts Monday, contains leap day, and pads complete weeks",()=>{
  const cells=calendarDays("2024-02");
  assert.equal(cells.length%7,0);
  assert.equal(cells[3],"2024-02-01");
  assert.equal(cells.includes("2024-02-29"),true);
  assert.equal(cells.includes("2024-02-30"),false);
  assert.equal(shiftMonth("2026-12",1),"2027-01");
  assert.equal(shiftMonth("2026-01",-1),"2025-12");
});
test("multi-day calendar events use inclusive original calendar dates",()=>{
  const e={starts_on:"2026-11-30",ends_on:"2026-12-02"};
  assert.equal(occursOn(e,"2026-12-01"),true);
  assert.equal(occursOn(e,"2026-12-02"),true);
  assert.equal(occursOn(e,"2026-12-03"),false);
  assert.equal(occursOn({starts_on:"2026-12-01",ends_on:null},"2026-12-01"),true);
});
test("Seoul times convert to Brasilia and retain the original event date for untimed events",()=>{
  const instant="2026-12-01T09:00:00Z";
  assert.match(eventClock(instant,"Asia/Seoul","pt-BR"),/18:00/);
  assert.match(eventClock(instant,"America/Sao_Paulo","pt-BR"),/06:00/);
  assert.match(eventClock("2026-12-01T00:30:00Z","America/Sao_Paulo","en"),/Nov 30, 2026/);
  assert.match(displayDate("2026-12-01","en"),/Dec 1, 2026/);
  assert.equal(eventClock(null,"Asia/Seoul","en"),"");
  assert.equal(eventClock(instant,"Invalid/Zone","en"),"");
});
test("list time filters use exact UTC for timed events and local date for untimed; completed goes to history",()=>{
  const upcoming=eventTimeFilter("upcoming",now),history=eventTimeFilter("history",now);
  assert.ok(upcoming.includes("event_status.neq.completed"));
  assert.ok(upcoming.includes("starts_at.gte.2026-11-26T00:11:00.000Z"));
  assert.ok(upcoming.includes("starts_on.gte.2026-11-26"));
  assert.ok(history.startsWith("event_status.eq.completed"));
  assert.ok(history.includes("ends_at.is.null,ends_at.lt."));
});
