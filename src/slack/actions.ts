import { AllMiddlewareArgs, SlackActionMiddlewareArgs } from "@slack/bolt";
import { orderConfirmationBlocks } from "./blocks.js";
import { queue, store } from "./handlers.js";
import { prepareCoupangOrder } from "../coupang.js";

export async function handleConfirm({ ack, body, client, action }: SlackActionMiddlewareArgs & AllMiddlewareArgs): Promise<void> {
  await ack();
  const requestId = buttonValue(action);
  await store.updateStatus(requestId, "CONFIRMED_BY_HUMAN");
  await client.chat.postMessage({ channel: channel(body), text: "Human confirmation recorded. Please complete actual payment directly in the Coupang browser. No final payment button was clicked automatically." });
}

export async function handleCancel({ ack, body, client, action }: SlackActionMiddlewareArgs & AllMiddlewareArgs): Promise<void> {
  await ack();
  const requestId = buttonValue(action);
  await store.updateStatus(requestId, "CANCELLED");
  await client.chat.postMessage({ channel: channel(body), text: `Cancelled ${requestId}.` });
}

export async function handleRetry({ ack, body, client, action }: SlackActionMiddlewareArgs & AllMiddlewareArgs): Promise<void> {
  await ack();
  const requestId = buttonValue(action);
  const record = await store.get(requestId);
  if (!record) return client.chat.postMessage({ channel: channel(body), text: `Unknown request: ${requestId}` });
  queue.enqueue(async () => {
    const result = await prepareCoupangOrder(record.request);
    await store.setProduct(requestId, result.product);
    await store.updateStatus(requestId, "READY_FOR_HUMAN_CONFIRMATION");
    const fresh = await store.get(requestId);
    if (fresh) await client.chat.postMessage({ channel: channel(body), text: `New candidate found for ${requestId}`, blocks: orderConfirmationBlocks(fresh) });
  });
  return client.chat.postMessage({ channel: channel(body), text: `Retry queued for ${requestId}.` });
}

export async function handleScreenshot({ ack, body, client, action }: SlackActionMiddlewareArgs & AllMiddlewareArgs): Promise<void> {
  await ack();
  const requestId = buttonValue(action);
  await store.appendLog(requestId, { at: new Date().toISOString(), message: "Manual browser screen requested" }).catch(() => undefined);
  await client.chat.postMessage({ channel: channel(body), text: `Browser screen requested for ${requestId}. Check the local browser window or screenshots directory.` });
}

function buttonValue(action: any): string { return action.value; }
function channel(body: any): string { return body.channel?.id ?? body.container?.channel_id ?? process.env.SLACK_DEFAULT_CHANNEL_ID!; }
