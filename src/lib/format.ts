/** Incident clock helpers. The demo incident starts at 14:02:00 Gulf Standard Time (UTC+4). */

export const T0 = { h: 14, m: 2, s: 0 };
export const INCIDENT_DATE = "Tue 9 Sep 2026";

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
  const m = Math.floor(offsetSec / 60);
  const s = Math.round(offsetSec % 60);
  return `T+${pad(m)}:${pad(s)}`;
}

export const pad = (n: number) => n.toString().padStart(2, "0");

export const fmtInt = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));

export const pct = (n: number, digits = 0) => `${(n * 100).toFixed(digits)}%`;

export const fmtSec = (s: number) => (s < 60 ? `${s.toFixed(1)} s` : `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`);

export const arabicDigits = (s: string) => s.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
