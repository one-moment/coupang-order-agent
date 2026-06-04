import { ProductCandidate } from "./types.js";

export const stopBeforePayment = true as const;

export function assertFinalPurchaseDisabled(): void {
  if (process.env.ALLOW_FINAL_PURCHASE === "true") {
    throw new Error("Final purchase automation is disabled by design. Set ALLOW_FINAL_PURCHASE=false.");
  }
}

export function getMaxTotalOrderAmount(): number {
  return Number(process.env.MAX_TOTAL_ORDER_AMOUNT ?? 300000);
}

export function validateCandidate(candidate: ProductCandidate, requiredWords: string[], excludeWords: string[], maxUnitPrice: number): string[] {
  const title = candidate.title.toLowerCase();
  const failures: string[] = [];
  for (const word of requiredWords.filter(Boolean)) {
    if (!title.includes(word.toLowerCase())) failures.push(`required word missing: ${word}`);
  }
  for (const word of excludeWords.filter(Boolean)) {
    if (title.includes(word.toLowerCase())) failures.push(`excluded word present: ${word}`);
  }
  if (candidate.unitPrice > maxUnitPrice) failures.push(`unit price ${candidate.unitPrice} exceeds max ${maxUnitPrice}`);
  if (candidate.totalPrice > getMaxTotalOrderAmount()) failures.push(`total price ${candidate.totalPrice} exceeds safety cap ${getMaxTotalOrderAmount()}`);
  return failures;
}
