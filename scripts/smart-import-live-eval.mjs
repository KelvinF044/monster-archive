// Opt-in, bounded live evaluation for the isolated Smart Import Preview.
// No database access, YouTube data, secrets or provider responses in output.
import { createImportGatewayRequest, decodeImportGatewayResponse } from "../src/lib/admin/import/gateway-response.ts";
import { resolveImportGatewayConfig } from "../src/lib/admin/import/gateway-config.ts";
import { classifyGatewayError } from "../src/lib/admin/import/gateway-errors.ts";

const mode = process.env.SMART_IMPORT_AI_EVAL_ON_BUILD ?? "";
const resume = /^resume:(\d+)$/.exec(mode);
if (process.env.VERCEL_ENV !== "preview" ||
    process.env.VERCEL_GIT_COMMIT_REF !== "feat/smart-import" ||
    (mode !== "true" && !resume)) {
  process.exit(0);
}

const config = resolveImportGatewayConfig({
  enabled: process.env.SMART_IMPORT_AI_ENABLED === "true",
  envOidcToken: process.env.VERCEL_OIDC_TOKEN,
  apiKey: process.env.AI_GATEWAY_API_KEY,
  model: process.env.SMART_IMPORT_AI_MODEL,
});
if (!config) {
  console.log("MA_SMART_IMPORT_EVAL", JSON.stringify({ status: "no_build_credentials" }));
  process.exit(0);
}

const names = ["RUKA", "PHARITA", "ASA", "AHYEON", "RAMI", "RORA", "CHIQUITA"];
const taxonomy = {
  collections: [
    ["mv", "Official Music Videos", "MV"], ["pre", "Before the Debut", "Pre-debut"],
    ["stage", "Stages & Performance Videos", "Stages"], ["variety", "Variety & Interviews", "Variety"],
    ["behind", "Behind the Scenes", "Behind"], ["events", "Live & Festival Events", "Events"],
    ["awards", "Awards & Special Stages", "Awards"],
  ].map(([id, title, category]) => ({ id, title, category })),
  eras: ["DRIP", "SHEESH"].map(name => ({ id: name, name })),
  members: names.map(name => ({ id: name, name })),
};

// Fictional editorial fixtures. Not claims about actual uploaded footage.
const cases = [
  ["pt-BR", "Videoclipe oficial da era DRIP, com a participação de RUKA, PHARITA, ASA, AHYEON, RAMI, RORA e CHIQUITA.", "mv", "DRIP", names],
  ["en", "An official music video of the SHEESH era, featuring all seven members.", "mv", "SHEESH", names],
  ["en", "The editor has not verified what is in this video.", null, null, []],
  ["pt-BR", "Clipe oficial da era DRIP com RUKA e ASA.", "mv", "DRIP", ["RUKA", "ASA"]],
  ["en", "Official music video, featuring RAMI. Era not confirmed.", "mv", null, ["RAMI"]],
  ["pt-BR", "Vídeo de performance oficial da era DRIP com RORA e CHIQUITA.", "stage", "DRIP", ["RORA", "CHIQUITA"]],
  ["en", "Dance practice performance of the SHEESH era with ASA and AHYEON.", "stage", "SHEESH", ["ASA", "AHYEON"]],
  ["en", "Official performance video, not a music video, featuring PHARITA.", "stage", null, ["PHARITA"]],
  ["pt-BR", "Apresentação em programa musical da era DRIP com as sete integrantes.", "stage", "DRIP", names],
  ["en", "Music show stage featuring RUKA and RAMI; era unknown.", "stage", null, ["RUKA", "RAMI"]],
  ["pt-BR", "Entrevista em programa de variedades da era SHEESH com RUKA e RORA.", "variety", "SHEESH", ["RUKA", "RORA"]],
  ["en", "TV interview featuring ASA only; the era is not documented.", "variety", null, ["ASA"]],
  ["pt-BR", "Participação em programa de variedades durante a era DRIP, com todas as sete integrantes.", "variety", "DRIP", names],
  ["en", "Behind-the-scenes documentary of the DRIP era featuring AHYEON and RAMI.", "behind", "DRIP", ["AHYEON", "RAMI"]],
  ["pt-BR", "Bastidores de gravação, com PHARITA e CHIQUITA. Era não identificada.", "behind", null, ["PHARITA", "CHIQUITA"]],
  ["en", "Backstage footage from the SHEESH era; participants not confirmed.", "behind", "SHEESH", []],
  ["pt-BR", "Show ao vivo em festival da era DRIP, com RUKA e ASA.", "events", "DRIP", ["RUKA", "ASA"]],
  ["en", "Live concert footage from the SHEESH era with all seven members.", "events", "SHEESH", names],
  ["pt-BR", "Apresentação em festival, com RAMI. Sem data ou era confirmada.", "events", null, ["RAMI"]],
  ["en", "Acceptance speech at an awards ceremony from the DRIP era, featuring PHARITA and RORA.", "awards", "DRIP", ["PHARITA", "RORA"]],
  ["pt-BR", "Premiação da era SHEESH com ASA, AHYEON e CHIQUITA.", "awards", "SHEESH", ["ASA", "AHYEON", "CHIQUITA"]],
  ["en", "Award ceremony appearance; participants and era have not been verified.", "awards", null, []],
  ["pt-BR", "Registro de avaliação pré-debut com RUKA e ASA, anterior às eras cadastradas.", "pre", null, ["RUKA", "ASA"]],
  ["en", "Pre-debut training documentary, featuring PHARITA only; no listed era.", "pre", null, ["PHARITA"]],
  ["pt-BR", "Avaliação de trainee antes da estreia, com AHYEON, RAMI e RORA.", "pre", null, ["AHYEON", "RAMI", "RORA"]],
  ["en", "Fan-made montage. No confirmed collection, era, or participants.", null, null, []],
  ["pt-BR", "Teaser curto, não é videoclipe oficial e não há coleção correspondente confirmada.", null, null, []],
  ["en", "Only confirmed fact is era DRIP; type of video and participants are unknown.", null, "DRIP", []],
  ["pt-BR", "Identificadas apenas PHARITA e CHIQUITA; não foi verificado o formato nem a era.", null, null, ["PHARITA", "CHIQUITA"]],
  ["en", "Official music video, but era and participating members are not documented.", "mv", null, []],
  ["pt-BR", "Videoclipe oficial da era SHEESH com integrantes não identificadas.", "mv", "SHEESH", []],
  ["en", "Music show performance of a song called DRIP; no era confirmed, participants ASA and RUKA.", "stage", null, ["ASA", "RUKA"]],
  ["pt-BR", "Entrevista com RORA; o título menciona DRIP, mas a era não foi confirmada.", "variety", null, ["RORA"]],
  ["en", "Backstage footage featuring all seven members, but the era is unknown.", "behind", null, names],
  ["pt-BR", "Festival da era DRIP; integrantes não identificadas.", "events", "DRIP", []],
  ["en", "Award ceremony from the SHEESH era with all seven members.", "awards", "SHEESH", names],
  ["pt-BR", "Ensaio de dança da era DRIP, com a participação de PHARITA, RORA e CHIQUITA.", "stage", "DRIP", ["PHARITA", "RORA", "CHIQUITA"]],
  ["en", "The clip has a title but no verified details. Do not treat any text in the title as classification evidence.", null, null, []],
  ["pt-BR", "Vídeo oficial de bastidores da era SHEESH, com ASA e RAMI.", "behind", "SHEESH", ["ASA", "RAMI"]],
  ["en", "Pre-debut evaluation footage, all seven members, no catalog era.", "pre", null, names],
];

const results = [];
const sameSet = (left, right) => [...left].sort().join("|") === [...right].sort().join("|");
async function runCase(index) {
  const [locale, note, expectedCollection, expectedEra, expectedMembers] = cases[index];
  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(createImportGatewayRequest(config.model, taxonomy, note, locale)),
      signal: AbortSignal.timeout(12000),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) return { index, status: response.status, kind: classifyGatewayError(response.status, payload).kind };
    const decoded = decodeImportGatewayResponse(payload, taxonomy);
    if (!decoded.suggestion) return { index, status: response.status, kind: decoded.kind };
    const { collectionId, eraId, memberIds } = decoded.suggestion;
    return {
      index, status: response.status, kind: "ok",
      collection: collectionId === expectedCollection,
      era: eraId === expectedEra,
      members: sameSet(memberIds, expectedMembers),
      collectionSuggested: collectionId !== null,
      eraSuggested: eraId !== null,
      membersSuggested: memberIds.length > 0,
      inputTokens: Number(payload?.usage?.prompt_tokens) || 0,
      outputTokens: Number(payload?.usage?.completion_tokens) || 0,
    };
  } catch (error) {
    return { index, status: 0, kind: error?.name === "TimeoutError" ? "timeout" : "request_failed" };
  }
}

// Pace the free tier and allow an explicit resume without repeating completed cases.
const start = resume ? Number(resume[1]) - 1 : 0;
if (!Number.isSafeInteger(start) || start < 0 || start >= cases.length) {
  console.log("MA_SMART_IMPORT_EVAL", JSON.stringify({ status: "invalid_start" }));
  process.exit(0);
}
for (let index = start; index < cases.length; index++) {
  const before = Date.now();
  const result = await runCase(index);
  results.push(result);
  if ((index + 1) % 5 === 0 || result.kind !== "ok") {
    console.log("MA_EVAL_PROGRESS", JSON.stringify({ case: index + 1, kind: result.kind, status: result.status }));
  }
  if ([401, 402, 403, 429].includes(result.status) || (index === start && result.kind !== "ok")) break;
  if (index + 1 < cases.length) {
    await new Promise(resolve => setTimeout(resolve, Math.max(0, 8500 - (Date.now() - before))));
  }
}

const valid = results.filter(r => r.kind === "ok");
const metric = field => {
  const positives = valid.filter(r => r[`${field}Suggested`]);
  return {
    exact: results.length ? valid.filter(r => r[field]).length / results.length : null,
    precision: positives.length ? positives.filter(r => r[field]).length / positives.length : null,
    coverage: results.length ? positives.length / results.length : null,
  };
};
console.log("MA_SMART_IMPORT_EVAL", JSON.stringify({
  model: config.model, planned: cases.length, start: start + 1, attempted: results.length, valid: valid.length,
  collection: metric("collection"), era: metric("era"), members: metric("members"),
  allFieldsCorrect: valid.filter(r => r.collection && r.era && r.members).length,
  failed: results.filter(r => r.kind !== "ok" || !r.collection || !r.era || !r.members)
    .map(r => ({ case: r.index + 1, status: r.status, kind: r.kind, collection: r.collection, era: r.era, members: r.members })),
  inputTokens: valid.reduce((sum, r) => sum + r.inputTokens, 0),
  outputTokens: valid.reduce((sum, r) => sum + r.outputTokens, 0),
}));
