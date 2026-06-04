import type { KnownBlock } from "@slack/types";
import { OrderRecord } from "../types.js";

export function orderConfirmationBlocks(record: OrderRecord): KnownBlock[] {
  const product = record.product;
  return [
    { type: "section", text: { type: "mrkdwn", text: `*[Coupang order confirmation]*\nRequest: ${record.request.requestId}\nRequester: <@${record.request.slack?.userId ?? "unknown"}>` } },
    { type: "section", fields: [
      { type: "mrkdwn", text: `*Product*\n${product?.title ?? record.request.keyword}` },
      { type: "mrkdwn", text: `*Quantity*\n${record.request.quantity}` },
      { type: "mrkdwn", text: `*Unit price*\n${product?.unitPrice.toLocaleString() ?? record.request.maxUnitPrice.toLocaleString()} KRW` },
      { type: "mrkdwn", text: `*Estimated total*\n${product?.totalPrice.toLocaleString() ?? "-"} KRW` },
      { type: "mrkdwn", text: `*Delivery*\n${product?.deliveryText ?? record.request.preferredDelivery}` },
      { type: "mrkdwn", text: `*Seller*\n${product?.seller ?? "-"}` }
    ] },
    { type: "section", text: { type: "mrkdwn", text: "Current state: the browser is stopped before final payment. The final order/payment button is never clicked automatically." } },
    { type: "actions", elements: [
      { type: "button", text: { type: "plain_text", text: "Confirm complete" }, style: "primary", action_id: "coupang_confirm", value: record.request.requestId },
      { type: "button", text: { type: "plain_text", text: "Cancel" }, style: "danger", action_id: "coupang_cancel", value: record.request.requestId },
      { type: "button", text: { type: "plain_text", text: "Search again" }, action_id: "coupang_retry", value: record.request.requestId },
      { type: "button", text: { type: "plain_text", text: "Need browser screen" }, action_id: "coupang_screenshot", value: record.request.requestId }
    ] }
  ];
}
