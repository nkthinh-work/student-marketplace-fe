import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { favoriteKeys } from '@/features/favorites/hooks';
import type { FavoriteListResponse } from '@/features/favorites/types';
import {
  getProducts,
  getProduct,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  deleteProductImage,
  setProductThumbnail,
  reorderProductImages,
  submitProductReview,
  getAdminProductApprovals,
  getAdminProductApprovalDetail,
  decideAdminProductApproval,
} from './api';
import type {
  ProductFilterParams,
  SellerProductFilterParams,
  ProductCreatePayload,
  ProductUpdatePayload,
  ImageReorderRequest,
  ProductListResponse,
  AdminApprovalDecisionRequest,
} from './types';

// Query key factory cho Products
export const productKeys = {
  all: ['products'] as const,
  publicLists: () => [...productKeys.all, 'public'] as const,
  publicList: (filters: ProductFilterParams) => [...productKeys.publicLists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
  myLists: () => [...productKeys.all, 'me'] as const,
  myProducts: (params?: SellerProductFilterParams) => [...productKeys.myLists(), params || {}] as const,
  adminApprovals: () => [...productKeys.all, 'admin-approvals'] as const,
  adminApprovalList: (params?: { state?: string; limit?: number; cursor?: string }) =>
    [...productKeys.adminApprovals(), 'list', params || {}] as const,
  adminApprovalDetail: (id: number) => [...productKeys.adminApprovals(), 'detail', id] as const,
};

// Hook infinite scroll danh sách sản phẩm public theo cursor
export function useProducts(filters: ProductFilterParams) {
  return useInfiniteQuery({
    queryKey: productKeys.publicList(filters),
    queryFn: ({ pageParam }) =>
      getProducts({
        ...filters,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
    staleTime: 60 * 1000,
  });
}

// Hook lấy chi tiết sản phẩm
export function useProduct(productId?: number) {
  return useQuery({
    queryKey: productKeys.detail(productId!),
    queryFn: () => getProduct(productId!),
    enabled: !!productId && !isNaN(productId),
    staleTime: 60 * 1000,
  });
}

// Hook lấy danh sách sản phẩm của seller hiện tại
export function useMyProducts(params?: SellerProductFilterParams) {
  const queryParams = { limit: 50, ...params };
  return useQuery({
    queryKey: productKeys.myProducts(queryParams),
    queryFn: () => getMyProducts(queryParams),
    staleTime: 30 * 1000,
  });
}

// Mutation tạo sản phẩm mới
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProductCreatePayload) => createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.publicLists() });
      queryClient.invalidateQueries({ queryKey: productKeys.myLists() });
    },
  });
}

// Mutation cập nhật sản phẩm
export function useUpdateProduct(productId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProductUpdatePayload) => updateProduct(productId, payload),
    onSuccess: (updatedProduct) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.publicLists() });
      queryClient.invalidateQueries({ queryKey: productKeys.myLists() });
      queryClient.setQueryData(productKeys.detail(productId), updatedProduct);
    },
  });
}

// Mutation xóa sản phẩm
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => deleteProduct(productId),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: productKeys.publicLists() });
      queryClient.invalidateQueries({ queryKey: productKeys.myLists() });
      queryClient.removeQueries({ queryKey: productKeys.detail(productId) });
    },
  });
}

// Mutation upload ảnh sản phẩm
export function useUploadProductImage(productId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadProductImage(productId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.myLists() });
      queryClient.invalidateQueries({ queryKey: productKeys.publicLists() });
    },
  });
}

// Mutation xóa ảnh sản phẩm
export function useDeleteProductImage(productId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageId: number) => deleteProductImage(productId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.myLists() });
      queryClient.invalidateQueries({ queryKey: productKeys.publicLists() });
    },
  });
}

// Mutation chọn ảnh làm thumbnail
export function useSetThumbnail(productId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageId: number) => setProductThumbnail(productId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.myLists() });
      queryClient.invalidateQueries({ queryKey: productKeys.publicLists() });
    },
  });
}

// Mutation đổi thứ tự ảnh
export function useReorderImages(productId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ImageReorderRequest) => reorderProductImages(productId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.myLists() });
      queryClient.invalidateQueries({ queryKey: productKeys.publicLists() });
    },
  });
}

/**
 * Narrowly patches view_count in active TanStack Query cached product feeds (Home, Search, Categories,
 * Public Seller Profile, Favorites) with the server-returned view count after successful view registration.
 * Leaves sorting, ordering, and all other fields/items completely untouched.
 */
export function patchProductViewCountInQueryCaches(
  queryClient: QueryClient,
  productId: number,
  serverViewCount: number,
) {
  // 1. Narrowly patch public product list caches
  queryClient.setQueriesData<InfiniteData<ProductListResponse> | ProductListResponse>(
    { queryKey: productKeys.publicLists() },
    (oldData) => {
      if (!oldData) return oldData;

      // InfiniteData from useInfiniteQuery (useProducts)
      if ('pages' in oldData && Array.isArray(oldData.pages)) {
        let hasChanged = false;
        const newPages = oldData.pages.map((page) => {
          if (!page || !Array.isArray(page.items)) return page;
          let pageChanged = false;
          const newItems = page.items.map((item) => {
            if (item?.product_id === productId) {
              if (item.view_count !== serverViewCount) {
                pageChanged = true;
                hasChanged = true;
                return { ...item, view_count: serverViewCount };
              }
            }
            return item;
          });
          return pageChanged ? { ...page, items: newItems } : page;
        });
        return hasChanged ? { ...oldData, pages: newPages } : oldData;
      }

      // Plain ProductListResponse from useQuery (e.g. HomeDiscoveryCarousel)
      if ('items' in oldData && Array.isArray(oldData.items)) {
        let hasChanged = false;
        const newItems = oldData.items.map((item) => {
          if (item?.product_id === productId) {
            if (item.view_count !== serverViewCount) {
              hasChanged = true;
              return { ...item, view_count: serverViewCount };
            }
          }
          return item;
        });
        return hasChanged ? { ...oldData, items: newItems } : oldData;
      }

      return oldData;
    },
  );

  // 2. Narrowly patch favorites list caches
  queryClient.setQueriesData<InfiniteData<FavoriteListResponse> | FavoriteListResponse>(
    { queryKey: favoriteKeys.lists() },
    (oldData) => {
      if (!oldData) return oldData;

      // InfiniteData from useInfiniteQuery (useFavorites)
      if ('pages' in oldData && Array.isArray(oldData.pages)) {
        let hasChanged = false;
        const newPages = oldData.pages.map((page) => {
          if (!page || !Array.isArray(page.items)) return page;
          let pageChanged = false;
          const newItems = page.items.map((item) => {
            if (item?.product_id === productId) {
              if (item.view_count !== serverViewCount) {
                pageChanged = true;
                hasChanged = true;
                return { ...item, view_count: serverViewCount };
              }
            }
            return item;
          });
          return pageChanged ? { ...page, items: newItems } : page;
        });
        return hasChanged ? { ...oldData, pages: newPages } : oldData;
      }

      // Plain FavoriteListResponse
      if ('items' in oldData && Array.isArray(oldData.items)) {
        let hasChanged = false;
        const newItems = oldData.items.map((item) => {
          if (item?.product_id === productId) {
            if (item.view_count !== serverViewCount) {
              hasChanged = true;
              return { ...item, view_count: serverViewCount };
            }
          }
          return item;
        });
        return hasChanged ? { ...oldData, items: newItems } : oldData;
      }

      return oldData;
    },
  );
}

export function useSubmitProductReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) => submitProductReview(productId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: productKeys.myLists() });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(data.product_id) });
    },
  });
}

export function useAdminProductApprovals(params?: {
  state?: string;
  limit?: number;
  cursor?: string;
}) {
  return useQuery({
    queryKey: productKeys.adminApprovalList(params),
    queryFn: () => getAdminProductApprovals(params),
    staleTime: 10 * 1000,
  });
}

export function useAdminProductApprovalDetail(productId?: number) {
  return useQuery({
    queryKey: productKeys.adminApprovalDetail(productId || 0),
    queryFn: () => getAdminProductApprovalDetail(productId!),
    enabled: Boolean(productId),
    staleTime: 10 * 1000,
  });
}

export function useDecideAdminProductApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: number;
      data: AdminApprovalDecisionRequest;
    }) => decideAdminProductApproval(productId, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: productKeys.adminApprovals() });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(updated.product_id) });
      queryClient.invalidateQueries({ queryKey: productKeys.publicLists() });
      queryClient.invalidateQueries({ queryKey: productKeys.myLists() });
    },
  });
}
