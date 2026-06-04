import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { OrderLog, OrderRecord, OrderRequest, OrderStatus, ProductCandidate } from "../types.js";
import { canTransition } from "./orderStatus.js";

export interface OrderStore {
  create(order: OrderRequest): Promise<OrderRecord>;
  updateStatus(requestId: string, status: OrderStatus): Promise<void>;
  setProduct(requestId: string, product: ProductCandidate): Promise<void>;
  get(requestId: string): Promise<OrderRecord | null>;
  appendLog(requestId: string, log: OrderLog): Promise<void>;
  list(): Promise<OrderRecord[]>;
}

export class JsonOrderStore implements OrderStore {
  constructor(private readonly filePath = path.resolve("data/orders.json")) {}

  async create(order: OrderRequest): Promise<OrderRecord> {
    const records = await this.readAll();
    if (records[order.requestId]) throw new Error(`duplicate requestId: ${order.requestId}`);
    const now = new Date().toISOString();
    const record: OrderRecord = { request: order, status: "REQUESTED", logs: [{ at: now, status: "REQUESTED", message: "Order request created" }], updatedAt: now };
    records[order.requestId] = record;
    await this.writeAll(records);
    return record;
  }

  async updateStatus(requestId: string, status: OrderStatus): Promise<void> {
    const records = await this.readAll();
    const record = records[requestId];
    if (!record) throw new Error(`unknown requestId: ${requestId}`);
    if (!canTransition(record.status, status)) throw new Error(`invalid transition ${record.status} -> ${status}`);
    record.status = status;
    record.updatedAt = new Date().toISOString();
    record.logs.push({ at: record.updatedAt, status, message: `Status changed to ${status}` });
    await this.writeAll(records);
  }

  async setProduct(requestId: string, product: ProductCandidate): Promise<void> {
    const records = await this.readAll();
    const record = records[requestId];
    if (!record) throw new Error(`unknown requestId: ${requestId}`);
    record.product = product;
    record.updatedAt = new Date().toISOString();
    await this.writeAll(records);
  }

  async get(requestId: string): Promise<OrderRecord | null> {
    const records = await this.readAll();
    return records[requestId] ?? null;
  }

  async appendLog(requestId: string, log: OrderLog): Promise<void> {
    const records = await this.readAll();
    const record = records[requestId];
    if (!record) throw new Error(`unknown requestId: ${requestId}`);
    record.logs.push(log);
    record.updatedAt = log.at;
    await this.writeAll(records);
  }

  async list(): Promise<OrderRecord[]> {
    return Object.values(await this.readAll());
  }

  private async readAll(): Promise<Record<string, OrderRecord>> {
    try {
      return JSON.parse(await readFile(this.filePath, "utf8"));
    } catch (error: any) {
      if (error?.code === "ENOENT") return {};
      throw error;
    }
  }

  private async writeAll(records: Record<string, OrderRecord>): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(records, null, 2), "utf8");
  }
}
