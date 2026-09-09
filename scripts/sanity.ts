/* Quick engine sanity check: `npx tsx scripts/sanity.ts` */
import { buildScenario } from "../src/lib/simulation/scenario";
import { STEPS } from "../src/lib/simulation/steps";

for (const step of STEPS) {
  const s = buildScenario(step.index);
  const line = [
    `#${step.index} ${step.short.padEnd(8)} ${s.clock}`,
    `claims=${s.claims.length}`,
    `ctr=${s.contradictions.length}`,
    `facts=${s.facts.length}`,
    `affected=${s.people.filter((p) => p.impact?.affected).length}`,
    `msgs=${s.people.filter((p) => p.message).length}`,
    `deliv=${s.people.reduce((n, p) => n + p.deliveries.length, 0)}`,
    `resp=${s.responses.length}`,
    `triage=${s.triage.length}`,
    `consistency=${s.kpis.consistency}`,
    `checks=${s.channelChecks.map((c) => `${c.channel}:${c.consistent ? "ok" : "X"}${c.published ? "" : "(unpub)"}`).join(",")}`,
  ];
  console.log(line.join("  "));
}

const fin = buildScenario(8);
for (const p of fin.people) {
  const i = p.impact!;
  console.log(
    `${p.person.id.padEnd(7)} affected=${i.affected} action=${i.action.padEnd(16)} sev=${i.severity.padEnd(6)} status=${p.status.padEnd(18)} ch=${i.channels.join("+")} ` +
      (i.route ? `delay=${i.route.delayMinutes}min via=${i.route.viaRoads.join(">")} km=${i.route.originalKm.toFixed(1)}->${i.route.alternativeKm?.toFixed(1)}` : "") +
      (i.assemblyPointId ? ` ap=${i.assemblyPointId}` : "")
  );
}
console.log("\nContradiction:", JSON.stringify(fin.contradictions[0], null, 1).slice(0, 600));
console.log("\nFacts:", fin.facts.map((f) => `${f.label} => ${f.value} (${f.assurance})`).join("\n"));
console.log("\nAhmed EN:", fin.people[0].message?.en);
console.log("Ahmed AR:", fin.people[0].message?.ar);
console.log("Layla EN:", fin.people.find((p) => p.person.id === "layla")?.message?.en);
console.log("Layla AR:", fin.people.find((p) => p.person.id === "layla")?.message?.ar);
console.log("\nTriage:", fin.triage.map((t) => `${t.priority}. ${t.personId} score=${t.score} ${t.status} ${t.unit ?? ""}`).join("\n"));
console.log("\nResponses:", fin.responses.map((r) => `${r.at} ${r.personId} -> ${r.classification.category} (${r.classification.confidence}) u=${r.classification.urgency} [${r.classification.entities.join("; ")}]`).join("\n"));
console.log("\nSummary:", fin.summary?.headline);
