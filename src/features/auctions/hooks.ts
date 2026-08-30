import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelAuction,
  checkoutAuctionWinner,
  convertProductToFixedPrice,
  createAuction,
  getAuctionBids,
  getAuctionByProduct,
  getAuctionDetail,
  getMyWonAuctions,
  placeBid,
} from './api';
import type {
  AuctionCreatePayload,
  AuctionRealtimeEvent,
  PlaceBidPayload,
  WinnerCheckoutPayload,
} from './types';

export const AUCTION_QUERY_KEYS = {
  all: ['auctions'] as const,
  byProduct: (productId: number) => ['auctions', 'byProduct', productId] as const,
  detail: (auctionId: number) => ['auctions', 'detail', auctionId] as const,
  bids: (auctionId: number) => ['auctions', 'bids', auctionId] as const,
  myWon: () => ['auctions', 'me', 'won'] as const,
};

export function useMyWonAuctions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: AUCTION_QUERY_KEYS.myWon(),
    queryFn: () => getMyWonAuctions(),
    enabled: options?.enabled !== false,
  });
}

export function useAuctionByProduct(productId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: AUCTION_QUERY_KEYS.byProduct(productId),
    queryFn: () => getAuctionByProduct(productId),
    enabled: options?.enabled !== false && productId > 0,
    retry: false,
  });
}

export function useAuctionDetail(auctionId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: AUCTION_QUERY_KEYS.detail(auctionId),
    queryFn: () => getAuctionDetail(auctionId),
    enabled: options?.enabled !== false && auctionId > 0,
  });
}

export function useAuctionBids(auctionId: number, cursor?: string | null, limit: number = 20) {
  return useQuery({
    queryKey: [...AUCTION_QUERY_KEYS.bids(auctionId), cursor, limit],
    queryFn: () => getAuctionBids(auctionId, { cursor: cursor || undefined, limit }),
    enabled: auctionId > 0,
  });
}

export function useCreateAuction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AuctionCreatePayload) => createAuction(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: AUCTION_QUERY_KEYS.byProduct(data.product_id) });
      queryClient.invalidateQueries({ queryKey: ['products', 'detail', data.product_id] });
    },
  });
}

export function useCancelAuction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (auctionId: number) => cancelAuction(auctionId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: AUCTION_QUERY_KEYS.byProduct(data.product_id) });
      queryClient.invalidateQueries({ queryKey: AUCTION_QUERY_KEYS.detail(data.auction_id) });
      queryClient.invalidateQueries({ queryKey: ['products', 'detail', data.product_id] });
    },
  });
}

export function usePlaceBid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ auctionId, payload }: { auctionId: number; payload: PlaceBidPayload }) =>
      placeBid(auctionId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: AUCTION_QUERY_KEYS.detail(variables.auctionId) });
      queryClient.invalidateQueries({ queryKey: AUCTION_QUERY_KEYS.bids(variables.auctionId) });
      queryClient.invalidateQueries({ queryKey: ['auctions', 'byProduct'] });
    },
  });
}

export function useWinnerCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      auctionId,
      payload,
    }: {
      auctionId: number;
      payload: WinnerCheckoutPayload;
    }) => checkoutAuctionWinner(auctionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUCTION_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useConvertToFixedPrice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) => convertProductToFixedPrice(productId),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: AUCTION_QUERY_KEYS.byProduct(productId) });
      queryClient.invalidateQueries({ queryKey: ['products', 'detail', productId] });
    },
  });
}

export function useAuctionWebSocket(
  auctionId: number,
  onEvent?: (event: AuctionRealtimeEvent) => void
) {
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const attemptRef = useRef<number>(0);

  useEffect(() => {
    if (!auctionId || auctionId <= 0 || isNaN(auctionId)) return;

    let isMounted = true;

    // Resolve base WebSocket URL
    const apiBase = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    let wsBaseUrl = import.meta.env.VITE_WS_URL;
    if (!wsBaseUrl) {
      const isHttps = apiBase.startsWith('https:') || window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      let host = apiBase.replace(/^https?:\/\//, '');
      if (host.includes(':3000')) {
        host = 'localhost:8000';
      }
      wsBaseUrl = `${wsProtocol}//${host}`;
    }
    const wsUrl = `${wsBaseUrl}/ws/auctions/${auctionId}`;

    function cleanupSocket() {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch {
          // ignore
        }
        socketRef.current = null;
      }
    }

    function scheduleReconnect() {
      if (!isMounted) return;
      const delay = Math.min(1000 * Math.pow(2, attemptRef.current), 30000);
      attemptRef.current += 1;
      reconnectTimeoutRef.current = window.setTimeout(() => {
        if (!isMounted) return;
        queryClient.invalidateQueries({ queryKey: AUCTION_QUERY_KEYS.detail(auctionId) });
        queryClient.invalidateQueries({ queryKey: AUCTION_QUERY_KEYS.bids(auctionId) });
        connect();
      }, delay);
    }

    function connect() {
      if (!isMounted) return;
      cleanupSocket();

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) {
            ws.close();
            return;
          }
          attemptRef.current = 0; // Reset backoff on successful connect
          pingIntervalRef.current = window.setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send('ping');
            }
          }, 30000);
        };

        ws.onmessage = (event) => {
          if (event.data === 'pong') return;
          try {
            const data: AuctionRealtimeEvent = JSON.parse(event.data);
            if (onEvent) {
              onEvent(data);
            }
            queryClient.invalidateQueries({ queryKey: AUCTION_QUERY_KEYS.detail(auctionId) });
            queryClient.invalidateQueries({ queryKey: AUCTION_QUERY_KEYS.bids(auctionId) });
            queryClient.invalidateQueries({ queryKey: ['auctions', 'byProduct'] });
          } catch (e) {
            console.error('Error parsing auction WS event:', e);
          }
        };

        ws.onclose = () => {
          cleanupSocket();
          scheduleReconnect();
        };

        ws.onerror = () => {
          cleanupSocket();
        };
      } catch (err) {
        console.warn('Failed to establish WebSocket connection, continuing with REST:', err);
        scheduleReconnect();
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      cleanupSocket();
    };
  }, [auctionId, queryClient, onEvent]);
}
