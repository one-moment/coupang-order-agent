import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JsonOrderStore } from "../src/orders/orderStore.js";
import { OrderRequest } from "../src/types.js";

let dir: string;
let store: JsonOrderStore;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "orders-"));
  store = new JsonOrderStore(path.join(dir, "orders.json"));
});

afterEach(async () => rm(dir, { recursive: true, force: true }));

function request(id: string): OrderRequest {
  return { requestId: id, keyword: "water", quantity: 1, maxUnitPrice: 1000, requiredWords: [], excludeWords: [], preferredDelivery: "any", stopBeforePayment: true, createdAt: new Date().toISOString() };
}

describe("JsonOrderStore", () => {
  it("rejects duplicate request ids", async () => {
    await store.create(request("order-1"));
    await expect(store.create(request("order-1"))).rejects.toThrow(/duplicate/);
  });
});
