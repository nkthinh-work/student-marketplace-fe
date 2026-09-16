export type NotificationType =
  | 'NEW_ORDER'
  | 'ORDER_STATUS'
  | 'NEW_MESSAGE'
  | 'NEW_REVIEW'
  | 'AUCTION_BID'
  | 'AUCTION_OUTBID'
  | 'AUCTION_WON'
  | 'AUCTION_ENDED'
  | 'SYSTEM';

export interface NotificationItem {
  notification_id: number;
  type: NotificationType;
  title: string;
  body: string | null;
  ref_type: string | null;
  ref_id: number | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface UnreadCountResponse {
  count: number;
}
