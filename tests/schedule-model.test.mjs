import test from "node:test";
import assert from "node:assert/strict";
import { blankEvent, parseEvent, validDate, validTimezone, localTimeCandidates, eventReviewReady, eventFields, monthBounds, isOfficialSourceKind, localEventClock } from "../src/lib/admin/schedule/model.ts";

const fields=overrides=>({...blankEvent(),title_pt:"[TESTE] Agenda",...overrides});
const timed=overrides=>fields({time_kind:"timed",starts_on:"2026-12-01",start_time:"18:00",timezone:"Asia/Seoul",...overrides});

test("draft supports unknown dates and one language without fabricating UTC",()=>{
  const r=parseEvent(fields());
  assert.equal(r.ok,true);
  assert.equal(r.fields.starts_on,null);
  assert.equal(r.fields.starts_at,null);
  assert.equal(r.fields.ends_at,null);
  assert.equal(r.fields.slug,"teste-agenda");
});
test("local Seoul date and clock convert to UTC without changing local date",()=>{
  const r=parseEvent(timed());
  assert.equal(r.ok,true);
  assert.equal(r.fields.starts_at,"2026-12-01T09:00:00.000Z");
  assert.equal(r.fields.starts_on,"2026-12-01");
  assert.equal(localEventClock(r.fields.starts_at,r.fields.timezone),"18:00");
  assert.equal(parseEvent(timed({starts_on:"2026-12-01",start_time:"00:30"})).fields.starts_at,"2026-11-30T15:30:00.000Z");
});
test("all-day and unannounced time keep local dates and null timestamps",()=>{
  for(const kind of ["all_day","time_tba"]){
    const r=parseEvent(fields({time_kind:kind,starts_on:"2026-12-01",timezone:"Asia/Seoul"}));
    assert.equal(r.ok,true);
    assert.equal(r.fields.starts_at,null);
    assert.equal(r.fields.starts_on,"2026-12-01");
    assert.equal(parseEvent(fields({time_kind:kind,start_time:"12:00"})).error,"invalid_time");
  }
});
test("invalid date, clock, zone and missing required timed fields are rejected",()=>{
  assert.equal(validDate("2026-02-30"),false);
  assert.equal(validDate("2028-02-29"),true);
  assert.equal(validTimezone("Mars/Unknown"),false);
  assert.equal(validTimezone("+09:00"),false);
  assert.equal(parseEvent(timed({starts_on:""})).error,"invalid_date");
  assert.equal(parseEvent(timed({timezone:""})).error,"invalid_timezone");
  assert.equal(parseEvent(timed({start_time:"25:00"})).error,"invalid_time");
});
test("DST skipped time is rejected rather than shifted",()=>{
  assert.deepEqual(localTimeCandidates("2026-03-08","02:30","America/New_York"),[]);
  assert.equal(parseEvent(timed({starts_on:"2026-03-08",start_time:"02:30",timezone:"America/New_York"})).error,"nonexistent_time");
});
test("DST repeated hour requires an explicit occurrence, with both choices retained",()=>{
  const local={starts_on:"2026-11-01",start_time:"01:30",timezone:"America/New_York"};
  assert.deepEqual(localTimeCandidates(local.starts_on,local.start_time,local.timezone),["2026-11-01T05:30:00.000Z","2026-11-01T06:30:00.000Z"]);
  assert.equal(parseEvent(timed(local)).error,"ambiguous_time");
  assert.equal(parseEvent(timed({...local,start_occurrence:"earlier"})).fields.starts_at,"2026-11-01T05:30:00.000Z");
  assert.equal(parseEvent(timed({...local,start_occurrence:"later"})).fields.starts_at,"2026-11-01T06:30:00.000Z");
});
test("end date and clock cannot precede start or omit the local end date",()=>{
  assert.equal(parseEvent(timed({ends_on:"2026-11-30"})).error,"invalid_end");
  assert.equal(parseEvent(timed({end_time:"20:00"})).error,"invalid_end");
  assert.equal(parseEvent(timed({ends_on:"2026-12-01",end_time:"17:00"})).error,"invalid_end");
  const r=parseEvent(timed({ends_on:"2026-12-02",end_time:"01:00"}));
  assert.equal(r.ok,true);
  assert.equal(r.fields.ends_at,"2026-12-01T16:00:00.000Z");
});
test("event editor restores the original local time and second DST occurrence",()=>{
  const r=parseEvent(timed({starts_on:"2026-11-01",start_time:"01:30",timezone:"America/New_York",start_occurrence:"later"}));
  const row={...r.fields,id:"123",status:"draft",approved_at:null,published_at:null,created_at:"",updated_at:""};
  const f=eventFields(row);
  assert.equal(f.start_time,"01:30");
  assert.equal(f.start_occurrence,"later");
  assert.equal(f.starts_on,"2026-11-01");
  assert.deepEqual(parseEvent(f).fields,r.fields);
});
test("approval requires bilingual titles and summaries, confirmed local date and official source",()=>{
  const complete=timed({title_en:"Test schedule",summary_en:"TEST",summary_pt:"TESTE"});
  assert.equal(eventReviewReady(complete,1),true);
  assert.equal(eventReviewReady(complete,0),false);
  assert.equal(eventReviewReady({...complete,summary_pt:""},1),false);
  assert.equal(eventReviewReady(fields({title_en:"Test",summary_pt:"A",summary_en:"B"}),1),false);
  assert.equal(isOfficialSourceKind("official_organizer"),true);
  assert.equal(isOfficialSourceKind("trusted_press"),false);
  assert.equal(isOfficialSourceKind("manual"),false);
});
test("event statuses and editorial publication are separate; only permitted payload fields are written",()=>{
  const r=parseEvent(timed({event_status:"postponed",status:"published",published_at:"2026-12-01",id:"not-allowed"}));
  assert.equal(r.ok,true);
  assert.equal(r.fields.event_status,"postponed");
  assert.equal(r.fields.starts_on,"2026-12-01");
  assert.equal("status" in r.fields,false);
  assert.equal("published_at" in r.fields,false);
  assert.equal("id" in r.fields,false);
  assert.equal(parseEvent(timed({event_status:"bogus"})).ok,false);
});
test("month filters use real local calendar boundaries, including leap years",()=>{
  assert.deepEqual(monthBounds("2028-02"),{start:"2028-02-01",end:"2028-02-29"});
  assert.deepEqual(monthBounds("2026-12"),{start:"2026-12-01",end:"2026-12-31"});
  assert.deepEqual(monthBounds("9999-12"),{start:"9999-12-01",end:"9999-12-31"});
  assert.equal(monthBounds("2026-13"),null);
  assert.equal(monthBounds("2026-12,other"),null);
});
