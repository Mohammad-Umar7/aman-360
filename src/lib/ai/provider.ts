/**
 * AI Communication Intelligence layer — provider boundary.
 *
 * The prototype ships with a simulated model so the demo is deterministic and
 * runs offline. A production deployment would plug an LLM provider in behind
 * this same interface; the deterministic safety layer never depends on it.
 */

import type { AiTrace } from "@/lib/types";

export interface CommsModelInfo {
  id: string;
  label: string;
  simulated: boolean;
  version: string;
}

export const MODEL: CommsModelInfo = {
  id: "aman-comms-v2",
  label: "AMAN communication model",
  simulated: true,
  version: "2.3 (simulated)",
};

export function trace(opts: {
  task: string;
  inputs: string[];
  constraints?: string[];
  rationale: string;
  confidence: number;
  reviewRequired?: boolean;
  reviewReason?: string;
}): AiTrace {
  return {
    model: `${MODEL.id} · ${MODEL.version}`,
    task: opts.task,
    inputs: opts.inputs,
    constraints: opts.constraints ?? DEFAULT_CONSTRAINTS,
    rationale: opts.rationale,
    confidence: opts.confidence,
    reviewRequired: opts.reviewRequired ?? false,
    reviewReason: opts.reviewReason,
  };
}

export const DEFAULT_CONSTRAINTS = [
  "Instruction locked to the approved action — the model adapts wording only",
  "Approved-phrase list SOP-FF-03 v4.1 enforced; no speculation on cause or duration",
  "Only verified facts may be referenced (source + timestamp attached)",
  "Reading level ≤ grade 6; one action per sentence",
  "Arabic ↔ English parity check on facts, numbers and place names",
];
