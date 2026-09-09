import Link from "next/link";
import { ArrowRight, Flame, GitCompareArrows, Languages, ListChecks, MapPinned, MessageSquareText, Radio, ShieldCheck, Siren, Sparkles, Sun, Users, Wind } from "lucide-react";
import { BrandMark } from "@/components/shell/BrandMark";
import { STEPS } from "@/lib/simulation/steps";

function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[1180px] px-6 ${className}`}>{children}</div>;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="eyebrow text-brand-2 mb-3">{children}</div>;
}

export function Answers() {
  const items = [
    { q: "Who is actually affected?", a: "Deterministic checks of every registered person and active route against the verified hazard polygon and closures.", icon: Users },
    { q: "What should that specific person do?", a: "One approved action from the SOP catalogue — reroute, shelter in place, accessible assistance, or move to a safe point.", icon: MapPinned },
    { q: "How should it be communicated?", a: "Clear, bilingual, accessibility-aware wording adapted to each channel by the AI layer — without changing the instruction.", icon: MessageSquareText },
    { q: "Did the person respond?", a: "Delivery, read and acknowledgement tracked per channel; replies classified; silence escalated by rule.", icon: ListChecks },
    { q: "Who still needs help?", a: "Assistance requests scored with explainable priorities, units assigned, outcomes recorded.", icon: Siren },
    { q: "Are all channels consistent and verified?", a: "Contradictions between official sources resolved through an approved hierarchy; every published channel checked against the verified statement.", icon: GitCompareArrows },
  ];
  return (
    <section id="answers" className="py-24 border-t border-line">
      <Container>
        <Eyebrow>After the hazard is known</Eyebrow>
        <h2 className="text-[34px] md:text-[40px] font-semibold tracking-tight leading-tight max-w-[760px]">AMAN is not a prediction engine, a weather model or a mass alert app. It starts where detection ends.</h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <div key={it.q} className="panel p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="h-9 w-9 rounded-lg bg-brand/15 border border-brand/25 text-brand-2 flex items-center justify-center">
                    <Icon size={17} />
                  </span>
                  <span className="mono text-[12px] text-ink-4">0{i + 1}</span>
                </div>
                <h3 className="text-[17px] font-semibold leading-snug">{it.q}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{it.a}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export function Layers() {
  return (
    <section id="layers" className="py-24 border-t border-line">
      <Container>
        <Eyebrow>Architecture</Eyebrow>
        <h2 className="text-[34px] md:text-[40px] font-semibold tracking-tight leading-tight max-w-[760px]">Two intelligence layers, one clear boundary.</h2>
        <p className="mt-4 text-[16px] text-ink-2 max-w-[720px] leading-relaxed">Safety-critical logic never depends on a language model. The AI layer only decides how to say something, never what applies.</p>
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="panel p-7 border-teal/25">
            <div className="flex items-center gap-2.5 text-teal-2 font-semibold text-[15px]">
              <ShieldCheck size={18} /> Deterministic safety layer
            </div>
            <p className="mt-2 text-[14px] text-ink-2 leading-relaxed">Rule-based and geospatial. Traceable, auditable, repeatable.</p>
            <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-[14px] text-ink">
              {["Hazard polygons", "Road closure status", "Safe / unsafe route decisions", "Route × closure intersection", "Affected-area checks", "Shelter-in-place logic", "Approved action selection", "Accessibility-safe route filtering", "Escalation rules", "Source hierarchy & contradictions", "Channel consistency checks", "Triage scoring"].map((x) => (
                <li key={x} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal" /> {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="panel p-7 border-violet/25">
            <div className="flex items-center gap-2.5 text-violet-2 font-semibold text-[15px]">
              <Sparkles size={18} /> AI communication intelligence
            </div>
            <p className="mt-2 text-[14px] text-ink-2 leading-relaxed">Used only where language adds value. Every output carries a visible trace and its constraints.</p>
            <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-[14px] text-ink">
              {["Personalised instructions", "Arabic and English", "Simplified explanations", "Accessibility-aware messaging", "Operator situation summaries", "Contradiction explanations", "Communication consistency hints", "Citizen-response classification", "Prioritisation suggestions", "Multi-channel adaptation", "Reply drafting (approved)", "Grouping of responses"].map((x) => (
                <li key={x} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet" /> {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function Storyline() {
  return (
    <section id="demo" className="py-24 border-t border-line">
      <Container>
        <Eyebrow>End-to-end scenario</Eyebrow>
        <h2 className="text-[34px] md:text-[40px] font-semibold tracking-tight leading-tight max-w-[760px]">Flash flood in the Al Majaz underpass — nine steps, one coherent loop.</h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map((s) => (
            <div key={s.id} className="panel-raised p-5 flex gap-4">
              <div className="num text-[22px] font-semibold text-ink-4 leading-none w-8 shrink-0">{s.index}</div>
              <div>
                <div className="text-[15px] font-semibold leading-snug">{s.title}</div>
                <p className="mt-1.5 text-[13.5px] text-ink-2 leading-relaxed">{s.caption}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/command/twin" className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 h-11 text-[14.5px] font-medium text-white hover:bg-[#5f98ff]">
            Open the digital twin <ArrowRight size={15} />
          </Link>
          <span className="text-[13px] text-ink-3">Autoplay runs the whole storyline in about two minutes. Keys 0–8 jump to any step.</span>
        </div>
      </Container>
    </section>
  );
}

export function Channels() {
  const channels = [
    { n: "SMS", d: "Sender AMAN-UAE, keyword replies SAFE / HELP" },
    { n: "Mobile app", d: "Critical alert with one-tap actions" },
    { n: "Voice / IVR", d: "Slow-paced call for residents without smartphones" },
    { n: "Public website", d: "Verified banner replacing stale content" },
    { n: "Digital signage", d: "Three-line VMS message on the approach road" },
    { n: "Call centre", d: "Agent script with the verified status and questions to log" },
  ];
  return (
    <section className="py-24 border-t border-line">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div>
            <Eyebrow>One truth, many channels</Eyebrow>
            <h2 className="text-[34px] md:text-[40px] font-semibold tracking-tight leading-tight">A single verified statement, adapted — never rewritten — for every channel.</h2>
            <p className="mt-4 text-[16px] text-ink-2 leading-relaxed">
              Source hierarchy resolves what is true. Deterministic checks confirm every channel names the same road, the same status and the same alternative, in Arabic and English. The AI layer adapts tone, length and accessibility.
            </p>
            <div className="mt-6 flex items-center gap-3 text-[13.5px] text-ink-2">
              <Languages size={16} className="text-brand-2" /> Arabic and English parity checked on facts, numbers and place names.
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {channels.map((c) => (
              <div key={c.n} className="panel-raised p-4">
                <div className="flex items-center gap-2 text-[14px] font-semibold">
                  <Radio size={14} className="text-teal-2" /> {c.n}
                </div>
                <div className="mt-1 text-[13px] text-ink-2 leading-relaxed">{c.d}</div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

export function Twin() {
  const shots = [
    { src: "/renders/district_overview.png", cap: "Al Majaz district — normal operations" },
    { src: "/renders/underpass_flooded.png", cap: "Underpass flooded, closure and patrol deployed" },
    { src: "/renders/hospital_response.png", cap: "Al Majaz Medical Centre — dispatch origin" },
  ];
  return (
    <section className="py-24 border-t border-line">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow>Digital twin</Eyebrow>
            <h2 className="text-[34px] md:text-[40px] font-semibold tracking-tight leading-tight max-w-[760px]">A district built to tell the story, not just to look good.</h2>
          </div>
          <p className="text-[15px] text-ink-2 max-w-[440px] leading-relaxed">Procedurally generated in Blender — roads, the sunken underpass, residences with Gulf architectural cues, a medical centre, mosque, signage and vehicles — with the water rise animated in Blender and scrubbed live by the simulation.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {shots.map((s) => (
            <figure key={s.src} className="panel overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.src} alt={s.cap} className="w-full aspect-video object-cover" loading="lazy" />
              <figcaption className="px-4 py-3 text-[13px] text-ink-2">{s.cap}</figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-2 text-[13px] text-ink-3">
          <MapPinned size={14} className="text-teal-2" /> The same coordinates drive the 2D operational map, the 3D twin and every routing and polygon check.
        </div>
      </Container>
    </section>
  );
}

export function Privacy() {
  return (
    <section id="privacy" className="py-24 border-t border-line">
      <Container>
        <div className="panel p-8 md:p-10 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8">
          <div>
            <Eyebrow>Privacy, ethics, demo safety</Eyebrow>
            <h2 className="text-[30px] font-semibold tracking-tight leading-tight">Not a surveillance system.</h2>
          </div>
          <ul className="space-y-3 text-[15px] text-ink-2 leading-relaxed">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-teal shrink-0" /> All user profiles and locations shown in this prototype are synthetic.
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-teal shrink-0" /> Real deployment would rely only on authorised institutional data (building registries, vulnerable-persons registries, cell broadcast) and/or user-consented data.
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-teal shrink-0" /> No continuous individual tracking. Road users are matched by consented navigation session or cell-broadcast segment, never by identity.
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-teal shrink-0" /> Every decision carries a rule trace; every AI output carries its inputs, constraints and confidence. Prototype figures are illustrative, not validated claims.
            </li>
          </ul>
        </div>
      </Container>
    </section>
  );
}

export function Future() {
  const items = [
    { n: "Structure fire", icon: Flame, d: "Evacuation routing by floor and stairwell access" },
    { n: "Gas leak", icon: Wind, d: "Wind-aware exclusion zones and shelter guidance" },
    { n: "Extreme heat", icon: Sun, d: "Targeted outreach to registered vulnerable residents" },
  ];
  return (
    <section className="py-20 border-t border-line">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow>Extensible by design</Eyebrow>
            <h2 className="text-[26px] font-semibold tracking-tight">Same loop, other hazards — roadmap only.</h2>
          </div>
          <div className="text-[13px] text-ink-3 max-w-[420px]">The prototype fully demonstrates the flash-flood scenario. Other scenarios reuse the same engines with new polygons, SOP actions and channel rules.</div>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.n} className="panel-raised p-5 opacity-80">
                <div className="flex items-center gap-2 text-[14.5px] font-semibold">
                  <Icon size={15} className="text-ink-3" /> {it.n}
                  <span className="ml-auto rounded-md border border-line px-1.5 py-0.5 text-[10.5px] text-ink-3">roadmap</span>
                </div>
                <div className="mt-1.5 text-[13px] text-ink-3">{it.d}</div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line py-10">
      <Container className="flex flex-wrap items-center justify-between gap-4 text-[13px] text-ink-3">
        <div className="flex items-center gap-3">
          <BrandMark size={24} />
          <span className="text-ink">AMAN 360</span>
          <span>Emergency Communication Assurance & Response Intelligence</span>
        </div>
        <div>Prototype · synthetic data · Blender-built digital twin · Next.js + React Three Fiber</div>
      </Container>
    </footer>
  );
}
