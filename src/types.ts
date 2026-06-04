export type DeliveryPreference = "rocket" | "sellerRocket" | "standard" | "any";

export type OrderStatus =
  | "REQUESTED"
  | "VALIDATING"
  | "BROWSER_RUNNING"
  | "SEARCHING"
  | "PRODUCT_FOUND"
  | "READY_FOR_HUMAN_CONFIRMATION"
  | "CONFIRMED_BY_HUMAN"
  | "CANCELLED"
  | "FAILED"
  | "NEEDS_MANUAL_INTERVENTION";

export interface OrderRequest {
  requestId: string;
  keyword: string;
  quantity: number;
  maxUnitPrice: number;
  requiredWords: string[];
  excludeWords: string[];
  preferredDelivery: DeliveryPreference;
  memo?: string;
  stopBeforePayment: true;
  slack?: { userId: string; channelId: string; threadTs?: string };
  createdAt: string;
}

export interface ProductCandidate {
  title: string;
  unitPrice: number;
  totalPrice: number;
  seller?: string;
  deliveryText?: string;
  url?: string;
}

export interface OrderLog {
  at: string;
  status?: OrderStatus;
  message: string;
  data?: unknown;
}

export interface OrderRecord {
  request: OrderRequest;
  status: OrderStatus;
  product?: ProductCandidate;
  logs: OrderLog[];
  updatedAt: string;
}
