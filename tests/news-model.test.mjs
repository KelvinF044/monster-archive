import test from "node:test";
import assert from "node:assert/strict";
import { blankNews, parseArticle, slugify, publicUrl, canonicalSourceUrl, allowedTransitions, canTransition, reviewReady, toDatabaseFields, searchText, editableStatus } from "../src/lib/admin/news/model.ts";

const fields = overrides => ({ ...blankNews(), title_pt: "BABYMONSTER — Novo álbum", ...overrides });

test("draft can have one language and an automatically generated URL slug", () => {
  const result = parseArticle(fields());
  assert.equal(result.slug, "babymonster-novo-album");
  assert.equal(result.title_en,"");
  assert.equal(result.category,"official_announcements");
});
test("manual slug preserves a valid explicit identifier", () => {
  assert.equal(parseArticle(fields({slug:"new-release"})).slug,"new-release");
  assert.equal(parseArticle(fields({slug:"INVALID SLUG"})),null);
  assert.equal(slugify("Apresentação / Edição #2"),"apresentacao-edicao-2");
});
test("reject missing title, unsupported category and oversize text", () => {
  assert.equal(parseArticle(fields({title_pt:"",title_en:""})),null);
  assert.equal(parseArticle(fields({category:"unknown"})),null);
  assert.equal(parseArticle(fields({title_pt:"x".repeat(201)})),null);
  assert.equal(parseArticle(fields({body_en:"x".repeat(20001)})),null);
});
test("reject invalid era IDs and invalid boolean values", () => {
  assert.equal(parseArticle(fields({era_id:"not-a-uuid"})),null);
  assert.equal(parseArticle(fields({is_featured:"true"})),null);
  assert.ok(parseArticle(fields({era_id:"12345678-abcd-1234-abcd-123456789012"})));
});
test("only ordinary public web URL schemes are accepted", () => {
  for(const url of ["javascript:alert(1)","data:text/html,something","file:///tmp/a","https://user:password@example.com","https://example.com/a b","https://"]){
    assert.equal(publicUrl(url),null);
    assert.equal(parseArticle(fields({cover_image_url:url})),null);
  }
  assert.equal(publicUrl(" https://EXAMPLE.com/image.png "), "https://example.com/image.png");
  assert.equal(parseArticle(fields({cover_image_source_url:"https://example.com/media"})).cover_image_source_url,"https://example.com/media");
});
test("canonical URLs remove common tracking parameters and fragments, preserving meaningful query values", () => {
  assert.equal(canonicalSourceUrl("https://EXAMPLE.com/a?utm_source=test&id=42&b=2&fbclid=abc#ref"),"https://example.com/a?b=2&id=42");
  assert.notEqual(canonicalSourceUrl("https://example.com/?id=1"),canonicalSourceUrl("https://example.com/?id=2"));
  assert.equal(canonicalSourceUrl("https://example.com/?utm_campaign=1"),"https://example.com/");
});
test("workflow never permits draft to publish, nor approved content editing directly", () => {
  assert.deepEqual(allowedTransitions("draft"),["in_review"]);
  assert.equal(canTransition("draft","published"),false);
  assert.equal(canTransition("in_review","published"),false);
  assert.equal(canTransition("in_review","approved"),true);
  assert.equal(canTransition("approved","published"),true);
  assert.equal(canTransition("published","draft"),true);
  assert.equal(canTransition("published","archived"),true);
  assert.equal(canTransition("unknown","draft"),false);
  assert.equal(canTransition("draft","draft"),false);
  assert.equal(editableStatus("approved"),false);
});
test("approval requires both languages and at least one source", () => {
  const complete=fields({title_en:"New album",summary_pt:"Resumo",summary_en:"Summary"});
  assert.equal(reviewReady(complete,1),true);
  assert.equal(reviewReady(complete,0),false);
  assert.equal(reviewReady({...complete,summary_en:"  "},1),false);
  assert.equal(reviewReady({...complete,title_pt:""},1),false);
});
test("only known article fields are persisted, not client-supplied publication state", () => {
  const parsed=parseArticle(fields({status:"published",approved_at:"2026-11-25",published_at:"2026-11-25",id:"not-allowed"}));
  const db=toDatabaseFields(parsed);
  assert.equal(db.era_id,null);
  assert.equal(db.is_featured,false);
  assert.equal(db.body_en,null);
  assert.equal("status" in db,false);
  assert.equal("published_at" in db,false);
  assert.equal("id" in db,false);
});
test("search normalization avoids filter punctuation while preserving bilingual names", () => {
  assert.equal(searchText("Álbum, (new) - DRIP"),"Álbum new - DRIP");
  assert.equal(searchText("x".repeat(200)).length,100);
  assert.equal(searchText(null),"");
});
