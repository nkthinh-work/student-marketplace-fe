import { apiClient } from "@/services/apiClient";
import type {
  CancelOrderRequest,
  ConfirmOrderRequest,
  CreateOrderRequest,
  OrderCursorPage,
  OrderDetailResponse,
  UpdateOrderTransactionTermsRequest,
} from "./types";

export async function createOrder(
  payload: CreateOrderRequest
): Promise<OrderDetailResponse> {
  const response = await apiClient.post<OrderDetailResponse>(
    "/api/v1/orders",
    payload
  );
  return response.data;
}

export async function getBuyingOrders(params?: {
  status?: string;
  cursor?: string;
  limit?: number;
}): Promise<OrderCursorPage> {
  const response = await apiClient.get<OrderCursorPage>(
    "/api/v1/orders/me/buying",
    { params }
  );
  return response.data;
}

export async function getSellingOrders(params?: {
  status?: string;
  cursor?: string;
  limit?: number;
}): Promise<OrderCursorPage> {
  const response = await apiClient.get<OrderCursorPage>(
    "/api/v1/orders/me/selling",
    { params }
  );
  return response.data;
}

export async function getOrderDetail(
  orderId: number
): Promise<OrderDetailResponse> {
  const response = await apiClient.get<OrderDetailResponse>(
    `/api/v1/orders/${orderId}`
  );
  return response.data;
}

export async function confirmOrder(
  orderId: number,
  payload: ConfirmOrderRequest
): Promise<OrderDetailResponse> {
  const response = await apiClient.post<OrderDetailResponse>(
    `/api/v1/orders/${orderId}/confirm`,
    payload
  );
  return response.data;
}

export async function uploadReceipt(
  orderId: number,
  file: File
): Promise<OrderDetailResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post<OrderDetailResponse>(
    `/api/v1/orders/${orderId}/receipt`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

export async function confirmPayment(
  orderId: number
): Promise<OrderDetailResponse> {
  const response = await apiClient.post<OrderDetailResponse>(
    `/api/v1/orders/${orderId}/confirm-payment`
  );
  return response.data;
}

export async function markDelivering(
  orderId: number
): Promise<OrderDetailResponse> {
  const response = await apiClient.post<OrderDetailResponse>(
    `/api/v1/orders/${orderId}/deliver`
  );
  return response.data;
}

export async function completeOrder(
  orderId: number
): Promise<OrderDetailResponse> {
  const response = await apiClient.post<OrderDetailResponse>(
    `/api/v1/orders/${orderId}/complete`
  );
  return response.data;
}

export async function cancelOrder(
  orderId: number,
  payload: CancelOrderRequest
): Promise<OrderDetailResponse> {
  const response = await apiClient.post<OrderDetailResponse>(
    `/api/v1/orders/${orderId}/cancel`,
    payload
  );
  return response.data;
}

export async function updateTransactionTerms(
  orderId: number,
  payload: UpdateOrderTransactionTermsRequest
): Promise<OrderDetailResponse> {
  const response = await apiClient.patch<OrderDetailResponse>(
    `/api/v1/orders/${orderId}/transaction-terms`,
    payload
  );
  return response.data;
}
