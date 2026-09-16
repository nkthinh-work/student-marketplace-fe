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
  userReviews: (userId: number) =>
    [...reviewKeys.all, "user", userId] as const,
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

export function useSellerReviewsInfinite(userId: number) {
  return useInfiniteQuery({
    queryKey: reviewKeys.userReviews(userId),
    queryFn: ({ pageParam }) =>
      getPublicSellerReviews(userId, pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.has_more && lastPage.next_cursor ? lastPage.next_cursor : undefined,
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });
}

export function useSellerRecentReviews(userId: number, limit: number = 5) {
  return useQuery({
    queryKey: [...reviewKeys.userReviews(userId), "recent", limit],
    queryFn: () => getPublicSellerReviews(userId, null, limit),
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });
}

