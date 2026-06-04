import { describe, expect, it } from "vitest";
import { validateView } from "../src/slack/handlers.js";

describe("validateView", () => {
  it("requires keyword, quantity, price and safety checkbox", () => {
    const errors = validateView({});
    expect(errors.keyword).toBeTruthy();
    expect(errors.quantity).toBeTruthy();
    expect(errors.maxUnitPrice).toBeTruthy();
    expect(errors.safetyConfirm).toBeTruthy();
  });

  it("accepts valid modal values", () => {
    const errors = validateView({
      keyword: { value: { value: "water" } },
      quantity: { value: { value: "3" } },
      maxUnitPrice: { value: { value: "25000" } },
      safetyConfirm: { value: { selected_options: [{ value: "stopBeforePayment" }] } }
    });
    expect(errors).toEqual({});
  });
});
