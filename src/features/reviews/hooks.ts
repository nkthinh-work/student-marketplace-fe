import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createOrderReview,
  getOrderReview,
  getPublicSellerReviews,
  updateOrderReview,
} from "./api";
import type { ReviewCreateRequest, ReviewUpdateRequest } from "./types";

export const reviewKeys = {
  all: ["reviews"] as const,
  orderReview: (orderId: number) =>
    [...reviewKeys.all, "order", orderId] as const,
  userReviews: (sellerId: string) =>
    [...reviewKeys.all, "user", sellerId] as const,
};

export function useOrderReview(orderId: number, enabled: boolean = true) {
  return useQuery({
    queryKey: reviewKeys.orderReview(orderId),
    queryFn: () => getOrderReview(orderId),
    enabled: Boolean(orderId) && enabled,
    staleTime: 30 * 1000,
  });
}

export function useCreateOrderReview(orderId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReviewCreateRequest) => createOrderReview(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.orderReview(orderId),
      });
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
      queryClient.invalidateQueries({ queryKey: ["publicUser"] });
      queryClient.invalidateQueries({ queryKey: ["userSoldProducts"] });
      queryClient.invalidateQueries({ queryKey: ["products", "detail"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useUpdateOrderReview(orderId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReviewUpdateRequest) => updateOrderReview(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.orderReview(orderId),
      });
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
      queryClient.invalidateQueries({ queryKey: ["publicUser"] });
      queryClient.invalidateQueries({ queryKey: ["userSoldProducts"] });
      queryClient.invalidateQueries({ queryKey: ["products", "detail"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useSellerReviewsInfinite(sellerId: string) {
  return useInfiniteQuery({
    queryKey: reviewKeys.userReviews(sellerId),
    queryFn: ({ pageParam }) =>
      getPublicSellerReviews(sellerId, pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.has_more && lastPage.next_cursor ? lastPage.next_cursor : undefined,
    enabled: Boolean(sellerId && sellerId.trim()),
    staleTime: 60 * 1000,
  });
}

export function useSellerRecentReviews(sellerId: string, limit: number = 5) {
  return useQuery({
    queryKey: [...reviewKeys.userReviews(sellerId), "recent", limit],
    queryFn: () => getPublicSellerReviews(sellerId, null, limit),
    enabled: Boolean(sellerId && sellerId.trim()),
    staleTime: 60 * 1000,
  });
}

