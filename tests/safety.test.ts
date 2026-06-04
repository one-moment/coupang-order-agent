import { describe, expect, it } from "vitest";
import { validateCandidate } from "../src/safety.js";

describe("validateCandidate", () => {
  it("blocks excluded words and price overruns", () => {
    const failures = validateCandidate({ title: "water ria", unitPrice: 3000, totalPrice: 3000 }, [], ["ria"], 2000);
    expect(failures.join(" ")).toContain("excluded");
    expect(failures.join(" ")).toContain("exceeds");
  });
});
