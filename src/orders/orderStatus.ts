import { OrderStatus } from "../types.js";

export const orderStatuses: OrderStatus[] = [
  "REQUESTED",
  "VALIDATING",
  "BROWSER_RUNNING",
  "SEARCHING",
  "PRODUCT_FOUND",
  "READY_FOR_HUMAN_CONFIRMATION",
  "CONFIRMED_BY_HUMAN",
  "CANCELLED",
  "FAILED",
  "NEEDS_MANUAL_INTERVENTION"
];

export const terminalStatuses: OrderStatus[] = ["CONFIRMED_BY_HUMAN", "CANCELLED", "FAILED", "NEEDS_MANUAL_INTERVENTION"];

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (terminalStatuses.includes(from)) return false;
  if (from === to) return true;
  const fromIndex = orderStatuses.indexOf(from);
  const toIndex = orderStatuses.indexOf(to);
  return toIndex >= fromIndex || terminalStatuses.includes(to);
}
