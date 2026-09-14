import { describe, expect, it } from "vitest";
import { arabicDigits, clockAt, clockShort, fmtInt, fmtSec, pct, tplus } from "@/lib/format";

describe("clockAt", () => {
  it("starts at the incident T0", () => {
    expect(clockAt(0)).toBe("14:02:00");
    expect(clockShort(0)).toBe("14:02");
  });
  it("carries minutes and hours", () => {
    expect(clockAt(58)).toBe("14:02:58");
    expect(clockAt(60)).toBe("14:03:00");
    expect(clockAt(3600)).toBe("15:02:00");
  });
  it("never produces a 60-second field from fractional offsets", () => {
    expect(clockAt(59.6)).toBe("14:03:00");
  });
  it("ignores negative offsets", () => {
    expect(clockAt(-30)).toBe("14:02:00");
  });
});

describe("tplus", () => {
  it("formats whole minutes and seconds", () => {
    expect(tplus(0)).toBe("T+00:00");
    expect(tplus(65)).toBe("T+01:05");
  });
  it("rounds fractional seconds without overflowing the seconds field", () => {
    expect(tplus(59.6)).toBe("T+01:00");
    expect(tplus(119.7)).toBe("T+02:00");
  });
  it("clamps negative offsets to zero", () => {
    expect(tplus(-5)).toBe("T+00:00");
  });
});

describe("fmtSec", () => {
  it("uses one decimal below a minute", () => {
    expect(fmtSec(4.8)).toBe("4.8 s");
  });
  it("splits minutes and seconds without a 60 s remainder", () => {
    expect(fmtSec(60)).toBe("1m 0s");
    expect(fmtSec(119.7)).toBe("2m 0s");
    expect(fmtSec(90.4)).toBe("1m 30s");
  });
});

describe("misc formatters", () => {
  it("formats integers with grouping", () => {
    expect(fmtInt(1284)).toBe("1,284");
    expect(fmtInt(1283.6)).toBe("1,284");
  });
  it("formats percentages", () => {
    expect(pct(0.93)).toBe("93%");
    expect(pct(0.9312, 1)).toBe("93.1%");
  });
  it("converts to Arabic-Indic digits", () => {
    expect(arabicDigits("14:02")).toBe("١٤:٠٢");
  });
});
