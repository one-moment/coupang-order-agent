import { describe, expect, it } from "vitest";
import { canTransition } from "../src/orders/orderStatus.js";

describe("canTransition", () => {
  it("allows forward transitions", () => {
    expect(canTransition("REQUESTED", "SEARCHING")).toBe(true);
  });

  it("prevents changes after terminal states", () => {
    expect(canTransition("CANCELLED", "SEARCHING")).toBe(false);
  });
});
