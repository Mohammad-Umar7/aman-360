/**
 * AI Communication Intelligence — citizen response classification.
 * Simulated model: transparent keyword scoring that behaves like a small classifier.
 */

import { trace } from "@/lib/ai/provider";
import type { AiTrace, Classification, Lang, ResponseCategory } from "@/lib/types";

const LEX: Record<ResponseCategory, string[]> = {
  safe: ["safe", "ok", "fine", "got it", "taking", "بخير", "شكرا", "شكراً", "تمام", "وصلت"],
  help: ["help", "stuck", "can't", "cannot", "water is coming", "entering", "trapped", "مساعدة", "تدخل", "لا أستطيع", "محاصر"],
  clarification: ["?", "should i", "can i", "is it", "هل", "ماذا", "كيف"],
  different: ["actually", "i'm not", "i am not", "different", "at the bus", "waiting", "أنا في", "أنتظر"],
  none: [],
};

const ENTITY_LEX: [RegExp, string][] = [
  [/water (is )?(coming|entering)|تدخل|المياه تدخل/i, "water entering premises"],
  [/ramp/i, "accessible ramp blocked"],
  [/lobby|الطابق الأرضي|ground floor/i, "ground floor affected"],
  [/can'?t get out|on my own|لا أستطيع/i, "cannot self-evacuate"],
  [/bus|الحافلة|محطة/i, "at bus stop"],
  [/school|المدرسة|أطفال/i, "children at school"],
  [/king faisal|الملك فيصل/i, "King Faisal Street"],
  [/son|ابني|alone|وحدي/i, "alone"],
];

export function classifyResponse(text: string, lang: Lang, hint?: ResponseCategory): Classification & { ai: AiTrace } {
  const lower = text.toLowerCase();
  const scores: Record<ResponseCategory, number> = { safe: 0, help: 0, clarification: 0, different: 0, none: 0 };
  for (const cat of Object.keys(LEX) as ResponseCategory[]) {
    for (const kw of LEX[cat]) if (lower.includes(kw)) scores[cat] += kw.length > 3 ? 2 : 1;
  }
  // A help signal outranks a question mark; a "different situation" narrative outranks a plain question.
  if (scores.help > 0) scores.help += 2;
  if (scores.different > 0 && scores.clarification > 0) scores.different += 1;
  let best = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0] as ResponseCategory) ?? "none";
  if (hint && scores[hint] > 0) best = hint;
  const competing = (Object.keys(scores) as ResponseCategory[]).filter((c) => c !== best && scores[c] > 0).length;
  const confidence = Math.max(0.55, Math.min(0.97, 0.7 + 0.06 * Math.min(4, scores[best]) - 0.07 * competing));
  const entities = ENTITY_LEX.filter(([re]) => re.test(text)).map(([, e]) => e);
  const urgency = urgencyFor(best, entities);
  const summary = summarise(best, entities, lang);
  return {
    category: best,
    confidence: Number(confidence.toFixed(2)),
    urgency,
    entities,
    summary,
    ai: trace({
      task: "Classify citizen response and extract situation entities",
      inputs: [`Text (${lang.toUpperCase()}): "${text}"`],
      constraints: ["Categories fixed: safe / help / clarification / different", "Urgency 1–5 from extracted entities, never from tone alone", "Operator sees original text alongside the label"],
      rationale: `Lexical evidence for "${best}" (${scores[best]} points); entities: ${entities.join(", ") || "none"}.`,
      confidence: Number(confidence.toFixed(2)),
      reviewRequired: best === "different" || confidence < 0.75,
      reviewReason: best === "different" ? "Situation differs from the modelled context — operator judgement required" : confidence < 0.75 ? "Low classifier confidence" : undefined,
    }),
  };
}

function urgencyFor(cat: ResponseCategory, entities: string[]): 1 | 2 | 3 | 4 | 5 {
  if (cat === "help") {
    if (entities.includes("cannot self-evacuate") || entities.includes("water entering premises")) return entities.includes("cannot self-evacuate") ? 5 : 4;
    return 3;
  }
  if (cat === "different") return 3;
  if (cat === "clarification") return 2;
  return 1;
}

function summarise(cat: ResponseCategory, entities: string[], lang: Lang): string {
  const ent = entities.length ? ` — ${entities.join(", ")}` : "";
  const l = lang === "ar" ? " (translated from Arabic)" : "";
  switch (cat) {
    case "safe":
      return `Confirms safe${ent}${l}`;
    case "help":
      return `Requests assistance${ent}${l}`;
    case "clarification":
      return `Asks a question about the instruction${ent}${l}`;
    case "different":
      return `Reports a situation different from the modelled context${ent}${l}`;
    case "none":
      return "No response";
  }
}
