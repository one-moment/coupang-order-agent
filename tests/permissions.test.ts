import { afterEach, describe, expect, it } from "vitest";
import { isAllowedSlackRequest } from "../src/slack/permissions.js";

describe("isAllowedSlackRequest", () => {
  afterEach(() => {
    delete process.env.SLACK_ALLOWED_USER_IDS;
    delete process.env.SLACK_ALLOWED_CHANNEL_IDS;
  });

  it("allows all when allowlists are empty", () => {
    expect(isAllowedSlackRequest("U1", "C1")).toBe(true);
  });

  it("checks user and channel allowlists", () => {
    process.env.SLACK_ALLOWED_USER_IDS = "U1";
    process.env.SLACK_ALLOWED_CHANNEL_IDS = "C1";
    expect(isAllowedSlackRequest("U1", "C1")).toBe(true);
    expect(isAllowedSlackRequest("U2", "C1")).toBe(false);
    expect(isAllowedSlackRequest("U1", "C2")).toBe(false);
  });
});
