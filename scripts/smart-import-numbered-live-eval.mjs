// Opt-in checks with synthetic editorial notes and catalog keys only.
import {
  constrainSharedImportSuggestion, createImportGatewayRequest,
  createNumberedImportGatewayRequest, decodeImportGatewayResponse,
  decodeNumberedImportGatewayResponse,
} from "../src/lib/admin/import/gateway-response.ts";
import { resolveImportGatewayConfig } from "../src/lib/admin/import/gateway-config.ts";
import { classifyGatewayError } from "../src/lib/admin/import/gateway-errors.ts";

if (process.env.VERCEL_ENV !== "preview" ||
    process.env.VERCEL_GIT_COMMIT_REF !== "feat/smart-import" ||
    process.env.SMART_IMPORT_AI_EVAL_ON_BUILD !== "numbered") process.exit(0);

const config = resolveImportGatewayConfig({
  enabled: process.env.SMART_IMPORT_AI_ENABLED === "true",
  envOidcToken: process.env.VERCEL_OIDC_TOKEN,
  apiKey: process.env.AI_GATEWAY_API_KEY,
  model: process.env.SMART_IMPORT_AI_MODEL,
});
if (!config) {
  console.log("MA_NUMBERED_EVAL", JSON.stringify({ status: "no_build_credentials" }));
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
const sameSet = (a, b) => Array.from(a).sort().join("|") === Array.from(b).sort().join("|");
async function request(body) {
  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(22000),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) return { status: response.status, kind: classifyGatewayError(response.status, payload).kind };
    return { status: response.status, payload, input: payload?.usage?.prompt_tokens, output: payload?.usage?.completion_tokens };
  } catch { return { status: 0, kind: "request_failed" }; }
}
const results = [];
const mixed = "Vídeos da era DRIP contendo programa de variedade, music show e tour";
const mixedResult = await request(createImportGatewayRequest(config.model, taxonomy, mixed, "pt-BR", "batch"));
if (mixedResult.payload) {
  const decoded = decodeImportGatewayResponse(mixedResult.payload, taxonomy);
  const safe = decoded.suggestion && constrainSharedImportSuggestion(decoded.suggestion, mixed, "pt-BR");
  results.push({ test: "mixed-common", status: mixedResult.status, kind: decoded.kind,
    passed: !!safe && safe.collectionId === null && safe.eraId === "DRIP" && !safe.memberIds.length,
    input: mixedResult.input, output: mixedResult.output });
} else results.push({ test: "mixed-common", status: mixedResult.status, kind: mixedResult.kind, passed: false });

const fixtures = [
  ["Performance em programa musical com todas as sete integrantes.", "stage", names],
  ["Apresentação em programa musical apenas com RORA e CHIQUITA.", "stage", ["RORA","CHIQUITA"]],
  ["Bastidores de um programa musical; integrantes não identificadas.", "behind", []],
  ["Registro ao vivo de concerto da turnê com as sete integrantes.", "events", names],
  ["Entrevista em programa de variedades com ASA.", "variety", ["ASA"]],
];
for (const count of [4, 20]) {
  if (results.some(r => r.status === 401 || r.status === 402 || r.status === 403 || r.status === 429)) break;
  await new Promise(resolve => setTimeout(resolve, 2500));
  const note = {
    sharedNote: "Todos os vídeos são da era DRIP.",
    entries: Array.from({ length: count }, (_, i) => ({ number: i + 1, note: fixtures[i % fixtures.length][0] })),
  };
  const result = await request(createNumberedImportGatewayRequest(config.model, taxonomy, note, "pt-BR"));
  if (!result.payload) {
    results.push({ test: `numbered-${count}`, status: result.status, kind: result.kind, passed: false });
    continue;
  }
  const decoded = decodeNumberedImportGatewayResponse(result.payload, taxonomy, note, "pt-BR");
  const mismatches = decoded.individual?.filter(item => {
    const expected = fixtures[(item.number - 1) % fixtures.length];
    return item.suggestion.collectionId !== expected[1] || item.suggestion.eraId !== "DRIP" ||
      !sameSet(item.suggestion.memberIds, expected[2]);
  }).map(item => item.number) ?? [];
  results.push({
    test: `numbered-${count}`, status: result.status, kind: decoded.kind, count: decoded.individual?.length ?? 0,
    commonEra: decoded.suggestion?.eraId === "DRIP", commonCollectionEmpty: decoded.suggestion?.collectionId === null,
    mismatches, passed: decoded.individual?.length === count && !mismatches.length &&
      decoded.suggestion?.eraId === "DRIP" && decoded.suggestion?.collectionId === null && !decoded.suggestion?.memberIds.length,
    input: result.input, output: result.output,
  });
}
console.log("MA_NUMBERED_EVAL", JSON.stringify({ model: config.model, results }));
