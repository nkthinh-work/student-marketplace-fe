import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelOrder,
  completeOrder,
  confirmOrder,
  confirmPayment,
  createOrder,
  getBuyingOrders,
  getOrderDetail,
  getSellingOrders,
  markDelivering,
  updateTransactionTerms,
  uploadReceipt,
} from "./api";
import type {
  CancelOrderRequest,
  ConfirmOrderRequest,
  CreateOrderRequest,
  UpdateOrderTransactionTermsRequest,
} from "./types";

export const ORDER_QUERY_KEYS = {
  all: ["orders"] as const,
  buying: (status?: string) => ["orders", "buying", status || "all"] as const,
  selling: (status?: string) => ["orders", "selling", status || "all"] as const,
  detail: (id: number) => ["orders", "detail", id] as const,
};

export function useBuyingOrders(status?: string) {
  return useQuery({
    queryKey: ORDER_QUERY_KEYS.buying(status),
    queryFn: () => getBuyingOrders({ status: status === "ALL" ? undefined : status }),
  });
}

export function useSellingOrders(status?: string) {
  return useQuery({
    queryKey: ORDER_QUERY_KEYS.selling(status),
    queryFn: () => getSellingOrders({ status: status === "ALL" ? undefined : status }),
  });
}

export function useOrderDetail(orderId: number) {
  return useQuery({
    queryKey: ORDER_QUERY_KEYS.detail(orderId),
    queryFn: () => getOrderDetail(orderId),
    enabled: !!orderId && !isNaN(orderId),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderRequest) => createOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useConfirmOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: number; payload: ConfirmOrderRequest }) =>
      confirmOrder(orderId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all });
      queryClient.setQueryData(ORDER_QUERY_KEYS.detail(data.order_id), data);
    },
  });
}

export function useUploadReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, file }: { orderId: number; file: File }) =>
      uploadReceipt(orderId, file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all });
      queryClient.setQueryData(ORDER_QUERY_KEYS.detail(data.order_id), data);
    },
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) => confirmPayment(orderId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all });
      queryClient.setQueryData(ORDER_QUERY_KEYS.detail(data.order_id), data);
    },
  });
}

export function useMarkDelivering() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) => markDelivering(orderId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all });
      queryClient.setQueryData(ORDER_QUERY_KEYS.detail(data.order_id), data);
    },
  });
}

export function useCompleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) => completeOrder(orderId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.setQueryData(ORDER_QUERY_KEYS.detail(data.order_id), data);
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: number; payload: CancelOrderRequest }) =>
      cancelOrder(orderId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.setQueryData(ORDER_QUERY_KEYS.detail(data.order_id), data);
    },
  });
}

export function useUpdateTransactionTerms() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: number;
      payload: UpdateOrderTransactionTermsRequest;
    }) => updateTransactionTerms(orderId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all });
      queryClient.setQueryData(ORDER_QUERY_KEYS.detail(data.order_id), data);
    },
  });
}
