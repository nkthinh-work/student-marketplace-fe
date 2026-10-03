export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "DELIVERING"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "VERIFYING" | "PAID";

export type PaymentMethod = "CASH_ON_MEETUP" | "BANK_TRANSFER" | "OTHER";

export type FulfillmentMethod = "MEETUP" | "SHIPPING";

export type CancelledBy = "BUYER" | "SELLER" | "SYSTEM";

export interface OrderItemResponse {
  order_item_id: number;
  product_id: number;
  product_title: string;
  product_image_url: string | null;
  quantity: number;
  price_at_purchase: number | string;
}

export interface OrderStatusHistoryResponse {
  history_id: number;
  from_status: string | null;
  to_status: string;
  changed_by: number | null;
  note: string | null;
  created_at: string;
}

export interface OrderPaymentBankResponse {
  bank_bin: string;
  bank_code: string;
  bank_name: string;
  bank_short_name: string;
  account_number: string;
  account_name: string;
  qr_url?: string | null;
}

export interface OrderSummaryResponse {
  order_id: number;
  order_code: string;
  buyer_id: number;
  seller_id: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  fulfillment_method: FulfillmentMethod;
  total_amount: number | string;
  item: OrderItemResponse;
  created_at: string;
  updated_at: string;
}

export interface OrderDetailResponse {
  order_id: number;
  order_code: string;
  buyer_id: number;
  buyer_public_id?: string | null;
  buyer_name: string;
  buyer_avatar_url: string | null;
  seller_id: number;
  seller_public_id?: string | null;
  seller_name: string;
  seller_avatar_url: string | null;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_receipt_url: string | null;
  receipt_uploaded_at: string | null;
  paid_confirmed_at: string | null;
  payment_note: string | null;
  payment_bank?: OrderPaymentBankResponse | null;
  fulfillment_method: FulfillmentMethod;
  meetup_place: string | null;
  meetup_time: string | null;
  shipping_address: string | null;
  shipping_expected_at: string | null;
  contact_name: string;
  contact_phone: string;
  buyer_note: string | null;
  total_amount: number | string;
  auto_cancel_at: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
  items: OrderItemResponse[];
  status_history: OrderStatusHistoryResponse[];
  created_at: string;
  updated_at: string;
}

export interface OrderCursorPage {
  items: OrderSummaryResponse[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface CreateOrderRequest {
  product_id: number;
  quantity: number;
  payment_method?: PaymentMethod;
  fulfillment_method: FulfillmentMethod;
  meetup_place?: string;
  meetup_time?: string;
  shipping_address?: string;
  shipping_expected_at?: string;
  contact_name: string;
  contact_phone: string;
  buyer_note?: string;
}

export interface ConfirmOrderRequest {
  payment_note?: string;
}

export interface CancelOrderRequest {
  cancel_reason: string;
}

export interface UpdateOrderTransactionTermsRequest {
  fulfillment_method?: FulfillmentMethod;
  payment_method?: PaymentMethod;
  meetup_place?: string;
  meetup_time?: string | null;
  shipping_address?: string;
  shipping_expected_at?: string | null;
  payment_note?: string;
}
