import { describe, expect, it } from "vitest";
import { parseOrderText } from "../src/orders/orderParser.js";

describe("parseOrderText", () => {
  it("extracts quantity, price, exclusions and delivery", () => {
    const parsed = parseOrderText("bottled water 70ml 3ea under 25000, exclude ria, rocket");
    expect(parsed.quantity).toBe(3);
    expect(parsed.maxUnitPrice).toBe(25000);
    expect(parsed.excludeWords).toContain("ria");
    expect(parsed.preferredDelivery).toBe("rocket");
  });
});
