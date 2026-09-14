/** AI Communication Intelligence — plain-language explanations for operators (simulated model). */

import { trace } from "@/lib/ai/provider";
import { sourceById } from "@/lib/data/sources";
import type { AiTrace, Contradiction } from "@/lib/types";

export function explainContradiction(ctr: Contradiction): { text: string; textAr: string; ai: AiTrace } {
  const winner = ctr.claims.find((c) => c.id === ctr.winningClaimId);
  if (!winner) return explainUnresolved(ctr);
  const loser = ctr.claims.find((c) => c.id !== winner.id) ?? winner;
  const ws = sourceById(winner.sourceId);
  const ls = sourceById(loser.sourceId);
  const text = `${ls.name.split(" — ")[0]} still shows the underpass as open because the page was last edited on 26 August and is not connected to the closure feed. ${ws.org} reported the closure at ${winner.observedAt} from a patrol on site, and the GIS flood model independently confirms severe flooding at the underpass. AMAN publishes CLOSED as the verified status, annotates the public page with it, and asks the web team to correct the page.`;
  const textAr = `لا يزال الموقع العام يعرض النفق على أنه مفتوح لأن الصفحة عُدّلت آخر مرة في 26 أغسطس وليست مرتبطة ببث الإغلاقات. أبلغت غرفة عمليات الشرطة عن الإغلاق في ${winner.observedAt} من دورية في الموقع، ويؤكد نموذج الفيضان في نظام المعلومات الجغرافية بشكل مستقل وجود فيضان شديد عند النفق. ينشر «أمان» حالة «مغلق» كحالة موثّقة، ويضيف ملاحظة على الصفحة العامة، ويطلب من فريق الموقع تصحيحها.`;
  return {
    text,
    textAr,
    ai: trace({
      task: "Explain a resolved contradiction to the duty operator in plain language",
      inputs: [`Contradiction ${ctr.id}`, `Winning claim: ${winner.id} (${ws.name})`, `Losing claim: ${loser.id} (${ls.name}, stale)`, "Resolution rationale from the deterministic layer"],
      constraints: ["Must not alter the resolved outcome", "Cite sources and timestamps exactly as verified", "No speculation about why the page is stale beyond the recorded update date"],
      rationale: "Operators act faster when the disagreement, the decision and the follow-up action are stated in one paragraph.",
      confidence: 0.95,
    }),
  };
}

function explainUnresolved(ctr: Contradiction): { text: string; textAr: string; ai: AiTrace } {
  const names = ctr.claims.map((c) => sourceById(c.sourceId).org);
  const text = `${names.join(" and ")} disagree about ${ctr.subject} and hold equal authority with observations at the same time, so the source hierarchy cannot decide automatically. AMAN has published nothing for this subject and is holding every channel until the duty operator confirms which observation stands.`;
  const textAr = `تتعارض ${names.join(" و")} بشأن ${ctr.subject} وتتساوى في الصلاحية وتوقيت الرصد، لذا لا يمكن للتسلسل الهرمي للمصادر الحسم تلقائياً. لم ينشر «أمان» أي حالة لهذا الموضوع وأوقف جميع القنوات حتى يؤكد المشغّل المناوب الرصد المعتمد.`;
  return {
    text,
    textAr,
    ai: trace({
      task: "Explain an unresolved contradiction to the duty operator in plain language",
      inputs: [`Contradiction ${ctr.id}`, ...ctr.claims.map((c) => `Claim ${c.id} (${sourceById(c.sourceId).name})`), "No winning claim from the deterministic layer"],
      constraints: ["Must not suggest which claim is correct", "State clearly that nothing has been published"],
      rationale: "The operator must know that the hold is deliberate and what unblocks it.",
      confidence: 0.9,
      reviewRequired: true,
      reviewReason: "Automatic resolution failed — human decision required",
    }),
  };
}
