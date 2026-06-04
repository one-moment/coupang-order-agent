import { AllMiddlewareArgs, SlackViewMiddlewareArgs } from "@slack/bolt";
import { JsonOrderStore } from "../orders/orderStore.js";
import { OrderQueue } from "../queue/orderQueue.js";
import { prepareCoupangOrder } from "../coupang.js";
import { orderConfirmationBlocks } from "./blocks.js";
import { DeliveryPreference, OrderRequest } from "../types.js";

export const store = new JsonOrderStore();
export const queue = new OrderQueue();

export async function handleOrderSubmission({ ack, body, view, client }: SlackViewMiddlewareArgs & AllMiddlewareArgs): Promise<void> {
  const errors = validateView(view.state.values);
  if (Object.keys(errors).length > 0) return ack({ response_action: "errors", errors });
  await ack();

  const request = buildOrderRequest(view.state.values, body.user.id, body.view?.private_metadata || process.env.SLACK_DEFAULT_CHANNEL_ID || body.user.id);
  const record = await store.create(request);
  await client.chat.postMessage({ channel: request.slack!.channelId, text: `Order request received: ${request.requestId}`, thread_ts: request.slack?.threadTs });

  queue.enqueue(async () => {
    try {
      await store.updateStatus(request.requestId, "VALIDATING");
      await store.updateStatus(request.requestId, "BROWSER_RUNNING");
      await client.chat.postMessage({ channel: request.slack!.channelId, text: `Searching Coupang for ${request.keyword}`, thread_ts: request.slack?.threadTs });
      await store.updateStatus(request.requestId, "SEARCHING");
      const result = await prepareCoupangOrder(request);
      await store.setProduct(request.requestId, result.product);
      await store.updateStatus(request.requestId, result.manualIntervention ? "NEEDS_MANUAL_INTERVENTION" : "READY_FOR_HUMAN_CONFIRMATION");
      const fresh = await store.get(request.requestId);
      if (fresh) await client.chat.postMessage({ channel: request.slack!.channelId, text: `Coupang order confirmation: ${request.requestId}`, blocks: orderConfirmationBlocks(fresh), thread_ts: request.slack?.threadTs });
    } catch (error: any) {
      await store.updateStatus(request.requestId, "FAILED").catch(() => undefined);
      await store.appendLog(request.requestId, { at: new Date().toISOString(), message: error.message ?? "Unknown error" }).catch(() => undefined);
      await client.chat.postMessage({ channel: request.slack!.channelId, text: `Order failed: ${error.message ?? error}`, thread_ts: request.slack?.threadTs });
    }
  });
}

export function validateView(values: any): Record<string, string> {
  const errors: Record<string, string> = {};
  const keyword = field(values, "keyword");
  const quantity = Number(field(values, "quantity"));
  const maxUnitPrice = Number(field(values, "maxUnitPrice"));
  const safety = values.safetyConfirm?.value?.selected_options ?? [];
  if (!keyword) errors.keyword = "Product keyword is required.";
  if (!Number.isInteger(quantity) || quantity < 1) errors.quantity = "Quantity must be 1 or more.";
  if (!Number.isFinite(maxUnitPrice) || maxUnitPrice <= 0) errors.maxUnitPrice = "Max unit price must be a positive number.";
  if (!safety.some((option: any) => option.value === "stopBeforePayment")) errors.safetyConfirm = "You must confirm final payment will not be automated.";
  return errors;
}

function buildOrderRequest(values: any, userId: string, channelId: string): OrderRequest {
  const now = new Date();
  return {
    requestId: `order-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${now.getTime()}`,
    keyword: field(values, "keyword"),
    quantity: Number(field(values, "quantity")),
    maxUnitPrice: Number(field(values, "maxUnitPrice")),
    requiredWords: split(field(values, "requiredWords")),
    excludeWords: split(field(values, "excludeWords")),
    preferredDelivery: selected(values, "preferredDelivery") as DeliveryPreference,
    memo: field(values, "memo"),
    stopBeforePayment: true,
    slack: { userId, channelId },
    createdAt: now.toISOString()
  };
}

function field(values: any, blockId: string): string { return values[blockId]?.value?.value?.trim() ?? ""; }
function selected(values: any, blockId: string): string { return values[blockId]?.value?.selected_option?.value ?? "any"; }
function split(value: string): string[] { return value.split(/[\s,，]+/).map((word) => word.trim()).filter(Boolean); }
