import { DeliveryPreference } from "../types.js";

export interface ParsedOrderText {
  keyword?: string;
  quantity?: number;
  maxUnitPrice?: number;
  requiredWords?: string[];
  excludeWords?: string[];
  preferredDelivery?: DeliveryPreference;
}

const deliveryMap: Array<[RegExp, DeliveryPreference]> = [
  [/rocket|로켓/i, "rocket"],
  [/seller\s*rocket|판매자\s*로켓/i, "sellerRocket"],
  [/standard|일반/i, "standard"]
];

export function parseOrderText(text: string): ParsedOrderText {
  const result: ParsedOrderText = {};
  const trimmed = text.trim();
  if (!trimmed) return result;

  const quantityMatch = trimmed.match(/(\d+)\s*(?:개|ea|pcs|수량)/i) ?? trimmed.match(/수량\s*[:：]?\s*(\d+)/i);
  if (quantityMatch) result.quantity = Number(quantityMatch[1]);

  const priceMatch = trimmed.match(/(?:개당|unit|max|이하|under)?\s*([0-9][0-9,]{3,})\s*(?:원|krw)?/i);
  if (priceMatch) result.maxUnitPrice = Number(priceMatch[1].replace(/,/g, ""));

  const excludeMatch = trimmed.match(/(?:제외|exclude)\s*[:：]?\s*([^,]+)/i);
  if (excludeMatch) result.excludeWords = splitWords(excludeMatch[1]);

  const requiredMatch = trimmed.match(/(?:필수|include|required)\s*[:：]?\s*([^,]+)/i);
  if (requiredMatch) result.requiredWords = splitWords(requiredMatch[1]);

  for (const [pattern, delivery] of deliveryMap) {
    if (pattern.test(trimmed)) result.preferredDelivery = delivery;
  }

  result.keyword = trimmed
    .replace(/\d+\s*(?:개|ea|pcs|수량)/gi, "")
    .replace(/(?:개당|unit|max|이하|under)?\s*[0-9][0-9,]{3,}\s*(?:원|krw)?/gi, "")
    .replace(/(?:제외|exclude|필수|include|required)\s*[:：]?\s*[^,]+/gi, "")
    .replace(/로켓배송|로켓|판매자로켓|일반배송/gi, "")
    .replace(/[,，]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return result;
}

function splitWords(value: string): string[] {
  return value.split(/[\s,，]+/).map((word) => word.trim()).filter(Boolean);
}
