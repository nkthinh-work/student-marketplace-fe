import { apiClient } from '@/services/apiClient';
import type {
  ProductListResponse,
  ProductDetailResponse,
  SellerProductListResponse,
  ProductFilterParams,
  SellerProductFilterParams,
  ProductCreatePayload,
  ProductUpdatePayload,
  ProductImageResponse,
  ImageReorderRequest,
} from './types';

// Lấy danh sách sản phẩm public (hỗ trợ cursor pagination, tìm kiếm, lọc)
export async function getProducts(params?: ProductFilterParams): Promise<ProductListResponse> {
  const queryParams: Record<string, string | number> = {};

  if (params?.category_id !== undefined && params.category_id !== null) {
    queryParams.category_id = params.category_id;
  }
  if (params?.listing_type) {
    queryParams.listing_type = params.listing_type;
  }
  if (params?.min_price !== undefined && params.min_price !== null) {
    queryParams.min_price = params.min_price;
  }
  if (params?.max_price !== undefined && params.max_price !== null) {
    queryParams.max_price = params.max_price;
  }
  if (params?.q?.trim()) {
    queryParams.q = params.q.trim();
  }
  if (params?.limit) {
    queryParams.limit = params.limit;
  }
  if (params?.cursor) {
    queryParams.cursor = params.cursor;
  }

  const response = await apiClient.get<ProductListResponse>('/api/v1/products', {
    params: queryParams,
  });
  return response.data;
}

// Lấy chi tiết sản phẩm public
export async function getProduct(productId: number): Promise<ProductDetailResponse> {
  const response = await apiClient.get<ProductDetailResponse>(`/api/v1/products/${productId}`);
  return response.data;
}

// Lấy danh sách sản phẩm của seller hiện tại
export async function getMyProducts(params?: SellerProductFilterParams): Promise<SellerProductListResponse> {
  const queryParams: Record<string, string | number> = {};
  if (params?.status) {
    queryParams.status = params.status;
  }
  if (params?.limit) {
    queryParams.limit = params.limit;
  }
  if (params?.cursor) {
    queryParams.cursor = params.cursor;
  }

  const response = await apiClient.get<SellerProductListResponse>('/api/v1/products/me', {
    params: queryParams,
  });
  return response.data;
}

// Đăng sản phẩm mới
export async function createProduct(payload: ProductCreatePayload): Promise<ProductDetailResponse> {
  const response = await apiClient.post<ProductDetailResponse>('/api/v1/products', payload);
  return response.data;
}

// Cập nhật sản phẩm (chỉ chủ sở hữu)
export async function updateProduct(
  productId: number,
  payload: ProductUpdatePayload,
): Promise<ProductDetailResponse> {
  const response = await apiClient.patch<ProductDetailResponse>(
    `/api/v1/products/${productId}`,
    payload,
  );
  return response.data;
}

// Xóa mềm sản phẩm (chỉ chủ sở hữu)
export async function deleteProduct(productId: number): Promise<void> {
  await apiClient.delete(`/api/v1/products/${productId}`);
}

// Upload ảnh sản phẩm lên Cloudinary qua backend
export async function uploadProductImage(
  productId: number,
  file: File,
): Promise<ProductImageResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<ProductImageResponse>(
    `/api/v1/products/${productId}/images/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return response.data;
}

// Xóa ảnh sản phẩm
export async function deleteProductImage(productId: number, imageId: number): Promise<void> {
  await apiClient.delete(`/api/v1/products/${productId}/images/${imageId}`);
}

// Chọn ảnh làm thumbnail
export async function setProductThumbnail(
  productId: number,
  imageId: number,
): Promise<ProductImageResponse> {
  const response = await apiClient.patch<ProductImageResponse>(
    `/api/v1/products/${productId}/images/${imageId}/thumbnail`,
  );
  return response.data;
}

// Cập nhật thứ tự sắp xếp ảnh
export async function reorderProductImages(
  productId: number,
  payload: ImageReorderRequest,
): Promise<ProductImageResponse[]> {
  const response = await apiClient.put<ProductImageResponse[]>(
    `/api/v1/products/${productId}/images/reorder`,
    payload,
  );
  return response.data;
}
