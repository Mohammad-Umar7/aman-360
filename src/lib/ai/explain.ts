/** AI Communication Intelligence — plain-language explanations for operators (simulated model). */

import { trace } from "@/lib/ai/provider";
import { sourceById } from "@/lib/data/sources";
import type { AiTrace, Contradiction } from "@/lib/types";

export function explainContradiction(ctr: Contradiction): { text: string; textAr: string; ai: AiTrace } {
  const winner = ctr.claims.find((c) => c.id === ctr.winningClaimId)!;
  const loser = ctr.claims.find((c) => c.id !== ctr.winningClaimId)!;
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
