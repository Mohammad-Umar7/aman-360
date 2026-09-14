import { describe, expect, it } from "vitest";
import { DEFAULT_CONSTRAINTS, trace } from "@/lib/ai/provider";

describe("trace", () => {
  it("gives every trace its own constraints array", () => {
    const a = trace({ task: "t", inputs: [], rationale: "r", confidence: 0.9 });
    const b = trace({ task: "t", inputs: [], rationale: "r", confidence: 0.9 });
    a.constraints.push("mutated");
    expect(b.constraints).toEqual([...DEFAULT_CONSTRAINTS]);
    expect(DEFAULT_CONSTRAINTS).not.toContain("mutated");
  });
  it("clamps confidence to 0..1", () => {
    expect(trace({ task: "t", inputs: [], rationale: "r", confidence: 1.4 }).confidence).toBe(1);
    expect(trace({ task: "t", inputs: [], rationale: "r", confidence: -2 }).confidence).toBe(0);
    expect(trace({ task: "t", inputs: [], rationale: "r", confidence: Number.NaN }).confidence).toBe(0);
  });
});
