import type { View } from "@slack/types";
import { ParsedOrderText } from "../orders/orderParser.js";

export function orderModal(triggerId: string, seed: ParsedOrderText = {}): { trigger_id: string; view: View } {
  return {
    trigger_id: triggerId,
    view: {
      type: "modal",
      callback_id: "coupang_order_submit",
      title: { type: "plain_text", text: "Coupang order" },
      submit: { type: "plain_text", text: "Prepare" },
      close: { type: "plain_text", text: "Cancel" },
      blocks: [
        input("keyword", "Product keyword", seed.keyword),
        input("quantity", "Quantity", seed.quantity?.toString() ?? "1"),
        input("maxUnitPrice", "Max unit price", seed.maxUnitPrice?.toString()),
        input("requiredWords", "Required words", seed.requiredWords?.join(", "), true),
        input("excludeWords", "Exclude words", seed.excludeWords?.join(", "), true),
        { type: "input", block_id: "preferredDelivery", label: { type: "plain_text", text: "Preferred delivery" }, element: { type: "static_select", action_id: "value", initial_option: option(seed.preferredDelivery ?? "any", label(seed.preferredDelivery ?? "any")), options: [option("rocket", "Rocket"), option("sellerRocket", "Seller rocket"), option("standard", "Standard"), option("any", "Any")] } },
        input("memo", "Memo", undefined, true, true),
        { type: "input", block_id: "safetyConfirm", label: { type: "plain_text", text: "Safety confirmation" }, element: { type: "checkboxes", action_id: "value", options: [{ text: { type: "plain_text", text: "Do not automate final payment" }, value: "stopBeforePayment" }] } }
      ]
    }
  };
}

function input(blockId: string, text: string, initialValue?: string, optional = false, multiline = false): any {
  return { type: "input", block_id: blockId, optional, label: { type: "plain_text", text }, element: { type: "plain_text_input", action_id: "value", initial_value: initialValue, multiline } };
}
function option(value: string, text: string): any { return { text: { type: "plain_text", text }, value }; }
function label(value: string): string { return value === "rocket" ? "Rocket" : value === "sellerRocket" ? "Seller rocket" : value === "standard" ? "Standard" : "Any"; }
