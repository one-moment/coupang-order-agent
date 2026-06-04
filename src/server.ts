import express from "express";
import { z } from "zod";
import { prepareCoupangOrder } from "./coupang.js";
import { JsonOrderStore } from "./orders/orderStore.js";
import { OrderQueue } from "./queue/orderQueue.js";
import { OrderRequest } from "./types.js";

const prepareSchema = z.object({
  keyword: z.string().min(1),
  quantity: z.number().int().min(1),
  maxUnitPrice: z.number().positive(),
  requiredWords: z.array(z.string()).default([]),
  excludeWords: z.array(z.string()).default([]),
  preferredDelivery: z.enum(["rocket", "sellerRocket", "standard", "any"]).default("any"),
  memo: z.string().optional()
});

export function createServer(store = new JsonOrderStore(), queue = new OrderQueue()) {
  const app = express();
  app.use(express.json());
  app.get("/health", (_req, res) => res.json({ ok: true, queue: { running: queue.isRunning, size: queue.size } }));
  app.post("/orders/prepare", async (req, res, next) => {
    try {
      const input = prepareSchema.parse(req.body);
      const now = new Date();
      const order: OrderRequest = { ...input, requestId: `order-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${now.getTime()}`, stopBeforePayment: true, createdAt: now.toISOString() };
      const record = await store.create(order);
      queue.enqueue(async () => {
        try {
          await store.updateStatus(order.requestId, "BROWSER_RUNNING");
          const result = await prepareCoupangOrder(order);
          await store.setProduct(order.requestId, result.product);
          await store.updateStatus(order.requestId, result.manualIntervention ? "NEEDS_MANUAL_INTERVENTION" : "READY_FOR_HUMAN_CONFIRMATION");
        } catch (error: any) {
          await store.updateStatus(order.requestId, "FAILED").catch(() => undefined);
          await store.appendLog(order.requestId, { at: new Date().toISOString(), message: error.message ?? "Unknown error" }).catch(() => undefined);
        }
      });
      res.status(202).json(record);
    } catch (error) { next(error); }
  });
  app.post("/orders/confirm", async (req, res, next) => { try { await store.updateStatus(req.body.requestId, "CONFIRMED_BY_HUMAN"); res.json({ ok: true }); } catch (error) { next(error); } });
  app.post("/orders/cancel", async (req, res, next) => { try { await store.updateStatus(req.body.requestId, "CANCELLED"); res.json({ ok: true }); } catch (error) { next(error); } });
  app.get("/orders/:requestId", async (req, res, next) => { try { const record = await store.get(req.params.requestId); if (!record) return res.status(404).json({ error: "not found" }); res.json(record); } catch (error) { next(error); } });
  app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => res.status(400).json({ error: error.message ?? "Bad request" }));
  return app;
}
