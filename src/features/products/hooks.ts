import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
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
} from './api';
import type {
  ProductFilterParams,
  SellerProductFilterParams,
  ProductCreatePayload,
  ProductUpdatePayload,
  ImageReorderRequest,
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
  return useQuery({
    queryKey: productKeys.myProducts(params),
    queryFn: () => getMyProducts(params),
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
