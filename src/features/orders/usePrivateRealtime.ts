import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ORDER_QUERY_KEYS } from './hooks';
import { AUCTION_QUERY_KEYS } from '@/features/auctions/hooks';

export interface PrivateRealtimeEvent {
  type: 'ORDER_CREATED' | 'ORDER_UPDATED' | 'AUCTION_WINNER_CHECKED_OUT' | string;
  order_id?: number;
  auction_id?: number;
  reason?: string;
  [key: string]: unknown;
}

export function usePrivateRealtime() {
  const { firebaseUser, initializing } = useAuth();
  const queryClient = useQueryClient();

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const attemptRef = useRef<number>(0);
  const currentUidRef = useRef<string | null>(null);

  useEffect(() => {
    // If still initializing auth or not logged in, ensure socket is closed
    if (initializing || !firebaseUser) {
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch {
          // ignore
        }
        socketRef.current = null;
      }
      currentUidRef.current = null;
      return;
    }

    const currentUser = firebaseUser;
    const uid = currentUser.uid;
    currentUidRef.current = uid;
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
      if (!isMounted || currentUidRef.current !== uid) return;
      const delay = Math.min(1000 * Math.pow(2, attemptRef.current), 30000);
      attemptRef.current += 1;
      reconnectTimeoutRef.current = window.setTimeout(() => {
        if (!isMounted || currentUidRef.current !== uid) return;
        // On reconnect, invalidate active order queries to reconcile state
        queryClient.invalidateQueries({
          queryKey: ORDER_QUERY_KEYS.all,
          refetchType: 'active',
        });
        connect();
      }, delay);
    }

    async function connect() {
      if (!isMounted || currentUidRef.current !== uid) return;
      cleanupSocket();

      try {
        const token = await currentUser.getIdToken();
        if (!isMounted || currentUidRef.current !== uid) return;

        const wsUrl = `${wsBaseUrl}/ws/me?token=${encodeURIComponent(token)}`;
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!isMounted || currentUidRef.current !== uid) {
            ws.close();
            return;
          }
          attemptRef.current = 0; // Reset backoff
          pingIntervalRef.current = window.setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send('ping');
            }
          }, 30000);
        };

        ws.onmessage = (event) => {
          if (event.data === 'pong') return;
          try {
            const data: PrivateRealtimeEvent = JSON.parse(event.data);

            if (data.type === 'ORDER_UPDATED') {
              if (data.order_id) {
                queryClient.invalidateQueries({
                  queryKey: ORDER_QUERY_KEYS.detail(data.order_id),
                });
              }
              queryClient.invalidateQueries({
                queryKey: ORDER_QUERY_KEYS.all,
                refetchType: 'active',
              });
            } else if (data.type === 'ORDER_CREATED') {
              queryClient.invalidateQueries({
                queryKey: ORDER_QUERY_KEYS.all,
                refetchType: 'active',
              });
            } else if (data.type === 'AUCTION_WINNER_CHECKED_OUT') {
              if (data.auction_id) {
                queryClient.invalidateQueries({
                  queryKey: AUCTION_QUERY_KEYS.detail(data.auction_id),
                });
              }
              queryClient.invalidateQueries({
                queryKey: AUCTION_QUERY_KEYS.all,
                refetchType: 'active',
              });
              queryClient.invalidateQueries({
                queryKey: ORDER_QUERY_KEYS.all,
                refetchType: 'active',
              });
              queryClient.invalidateQueries({
                queryKey: ['products'],
                refetchType: 'active',
              });
            }
          } catch (e) {
            console.error('Error parsing private WS event:', e);
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
        console.warn('Failed to establish private user WebSocket, continuing with REST:', err);
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
  }, [firebaseUser, initializing, queryClient]);
}
