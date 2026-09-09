# AMAN 360 — Demo walkthrough

Target length: 6–8 minutes live, plus questions. Run `npm run dev`, open the landing page, and use a 1440px-wide or larger window. Keep the EN/AR toggle in reach.

## Opening (30 s) — landing page

**Say:** "Every emirate already has systems that detect hazards: weather, GIS, police feeds. The gap is the last mile — making sure the right person gets the right verified instruction, and knowing what happened next. That is AMAN 360."

Point at the live 3D district behind the headline. Click **Run the flash-flood demo**.

## Step 0 — Normal city (20 s)

Digital twin, camera on Auto. A calm district, six feeds connected, all KPIs at zero.

**Say:** "A synthetic Sharjah-style district. Every person and location here is synthetic; a real deployment uses only institutional and consented data."

Press **Space** (or *Simulate flash flood*). Autoplay runs the whole storyline in about two minutes; pause with Space whenever you want to talk.

## Step 1 — Flash flood onset (40 s)

Rain starts, the sky darkens, water rises in the underpass (animated in Blender), the police patrol closes the road.

**Say:** "Existing systems do their job: the meteorology alert, the municipality flood polygon, the police closure. AMAN's job starts now."

## Step 2 — Communication assurance (60 s) — switch to *Source assurance*

Show the six source cards. The **public portal still says OPEN** (last updated 26 August) while **Police Operations say CLOSED**.

**Say:** "Two official channels disagree. AMAN detects the contradiction and resolves it through an approved source hierarchy — police rank 1 for road status beats a stale web page — then publishes one verified fact with an assurance score. The web page is flagged for correction automatically. The AI layer only explains the decision in plain language; it never makes it."

Point at the channel-consistency table: the portal is inconsistent until it is corrected.

## Step 3 — Impact analysis (60 s) — switch to *Affected people*

**Say:** "Who is actually affected? Not everyone in the city. Deterministic checks: does the route cross a closed segment, is the location inside the hazard polygon, are there accessibility needs?"

Open **Ahmed**: his route crosses the closed underpass; the route engine verifies an alternative via King Faisal Street, +6 minutes. Open **Omar**: outside the polygon, no route conflict — **no alert**. Alert fatigue is a safety problem too.

Show the affected-population breakdown (registries, daytime occupants, road users approaching the closure).

## Step 4 — Personalised communication (60 s) — switch to *Communication*

Show Ahmed's core message and the AI trace: inputs from the deterministic layer, constraints (instruction locked to the approved action, approved-phrase list, reading level, Arabic/English parity), rationale, confidence.

Toggle **AR**. Show **Sara** (wheelchair user): the accessible-assistance wording with a one-tap request path. Show **Layla**: the outdoor instruction is held for operator confirmation.

**Say:** "The AI decides how to say it. It never decides what applies."

## Step 5 — Multi-channel delivery (40 s)

Still in Communication: SMS, app push, voice/IVR script, call-centre script, then **Public channels**: the portal banner and the VMS-07 sign. Switch to the twin: the roadside sign in the 3D district now shows the same verified statement.

**Say:** "One truth, many channels. Every variant is checked for the road name, the verified status, no contradiction, Arabic–English parity and channel limits."

## Step 6 — Citizen response loop (60 s) — switch to *Response triage*

Responses arrive: Ahmed and Fatima confirm safe; **Sara requests assistance** (water under the lobby door, ramp flooded); **Layla** reports a different situation; **Noura** asks a question; **Yusuf** is silent.

**Say:** "Silence is tracked as carefully as replies. The AI classifies and extracts the situation; the operator always sees the original text."

## Step 7 — Triage & government intelligence (50 s)

Priority queue with explainable scores: Sara first (urgency 5, vulnerable registry, wheelchair, in zone) — accessible ambulance A-07 dispatched; watch it drive to Building C in the twin. Escalations for Yusuf: SMS unread → voice call → welfare check via building management.

## Step 8 — Operational picture (30 s) — switch to *Overview*

Final KPIs: affected, reached, confirmed safe, assistance, clarification, no response; contradictions resolved; channel consistency 100%; average delivery time; operator queue nearly clear.

**Say:** "This is what government gets back: not just that an alert was sent, but who was reached, who is safe, who still needs help, and proof that every channel said the same verified thing."

## Likely questions

- **Is the AI making safety decisions?** No. Hazard polygons, closures, route checks, approved actions, escalation and triage scoring are deterministic and traceable. The AI layer adapts wording, language and channels, classifies responses and summarises for operators — each output with a visible trace and review flag.
- **Where does the data come from?** Institutional feeds (police, municipality GIS, meteorology, transport, civil defence SOPs) plus registries and consented app users. Nothing in the prototype implies tracking individuals.
- **Why only flash flood?** One excellent end-to-end scenario. The engines, SOP catalogue and channel rules are generic; fire, gas leak or extreme heat reuse the same loop with new polygons and actions (roadmap only).
- **Are the numbers real?** They are prototype figures for demonstration, not validated claims.
