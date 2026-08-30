import { apiClient } from '@/services/apiClient';
import type {
  AuctionBidCursorPage,
  AuctionBidResponse,
  AuctionCreatePayload,
  AuctionDetailResponse,
  PlaceBidPayload,
  WinnerCheckoutPayload,
  WonAuctionResponse,
} from './types';
import type { OrderDetailResponse } from '@/features/orders/types';

export async function getAuctionByProduct(productId: number): Promise<AuctionDetailResponse> {
  const response = await apiClient.get<AuctionDetailResponse>(
    `/api/v1/auctions/by-product/${productId}`
  );
  return response.data;
}

export async function getAuctionDetail(auctionId: number): Promise<AuctionDetailResponse> {
  const response = await apiClient.get<AuctionDetailResponse>(
    `/api/v1/auctions/${auctionId}`
  );
  return response.data;
}

export async function getAuctionBids(
  auctionId: number,
  params?: { cursor?: string; limit?: number }
): Promise<AuctionBidCursorPage> {
  const response = await apiClient.get<AuctionBidCursorPage>(
    `/api/v1/auctions/${auctionId}/bids`,
    { params }
  );
  return response.data;
}

export async function createAuction(
  payload: AuctionCreatePayload
): Promise<AuctionDetailResponse> {
  const response = await apiClient.post<AuctionDetailResponse>(
    '/api/v1/auctions',
    payload
  );
  return response.data;
}

export async function cancelAuction(
  auctionId: number
): Promise<AuctionDetailResponse> {
  const response = await apiClient.post<AuctionDetailResponse>(
    `/api/v1/auctions/${auctionId}/cancel`
  );
  return response.data;
}

export async function placeBid(
  auctionId: number,
  payload: PlaceBidPayload
): Promise<AuctionBidResponse> {
  const response = await apiClient.post<AuctionBidResponse>(
    `/api/v1/auctions/${auctionId}/bids`,
    payload
  );
  return response.data;
}

export async function checkoutAuctionWinner(
  auctionId: number,
  payload: WinnerCheckoutPayload
): Promise<OrderDetailResponse> {
  const response = await apiClient.post<OrderDetailResponse>(
    `/api/v1/auctions/${auctionId}/checkout`,
    payload
  );
  return response.data;
}

export async function convertProductToFixedPrice(
  productId: number
): Promise<void> {
  await apiClient.post(
    `/api/v1/auctions/products/${productId}/convert-fixed-price`
  );
}

export async function getMyWonAuctions(): Promise<WonAuctionResponse[]> {
  const response = await apiClient.get<WonAuctionResponse[]>(
    '/api/v1/auctions/me/won'
  );
  return response.data;
}
