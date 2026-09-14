/** Incident clock helpers. The demo incident starts at 14:02:00 Gulf Standard Time (UTC+4). */

export const T0 = { h: 14, m: 2, s: 0 };
export const INCIDENT_DATE = "Wed 9 Sep 2026";

export function clockAt(offsetSec: number): string {
  const total = T0.h * 3600 + T0.m * 60 + T0.s + Math.max(0, Math.round(offsetSec));
  const h = Math.floor(total / 3600) % 24;
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function clockShort(offsetSec: number): string {
  return clockAt(offsetSec).slice(0, 5);
}

export function tplus(offsetSec: number): string {
  const total = Math.max(0, Math.round(offsetSec));
  return `T+${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export const pad = (n: number) => n.toString().padStart(2, "0");

export const fmtInt = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));

/** Percentages are floored, never rounded up: a safety KPI with one failed check must not read 100%. */
export const pct = (n: number, digits = 0) => {
  const f = 10 ** digits;
  return `${(Math.floor(n * 100 * f + 1e-9) / f).toFixed(digits)}%`;
};

export const fmtSec = (s: number) => {
  if (s < 60) return `${s.toFixed(1)} s`;
  const total = Math.round(s);
  return `${Math.floor(total / 60)}m ${total % 60}s`;
};

export const arabicDigits = (s: string) => s.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
