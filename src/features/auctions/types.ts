export type AuctionStatus = 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';

export type MoneyWire = string | number;

export interface AuctionDetailResponse {
  auction_id: number;
  product_id: number;
  status: AuctionStatus;
  starting_price: MoneyWire;
  bid_step: MoneyWire;
  current_price: MoneyWire;
  highest_bid: MoneyWire | null;
  bid_count: number;
  minimum_next_bid: MoneyWire;
  starts_at: string;
  ends_at: string;
  has_winner: boolean;
  final_price: MoneyWire | null;
  winner_checkout_deadline: string | null;
  is_current_user_winner: boolean;
  is_current_user_highest_bidder: boolean;
  highest_bidder_display?: string | null;
  server_time: string;
  winner_checkout_state?: 'NOT_APPLICABLE' | 'WAITING' | 'ORDER_CREATED' | 'EXPIRED' | 'NO_BIDS' | null;
  winner_order_id?: number | null;
}

export interface AuctionBidResponse {
  bid_id: number;
  auction_id: number;
  bidder_display: string;
  bidder_avatar_url?: string | null;
  amount: MoneyWire;
  created_at: string;
  is_current_user: boolean;
  is_highest?: boolean;
}

export interface AuctionBidCursorPage {
  items: AuctionBidResponse[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface AuctionCreatePayload {
  product_id: number;
  bid_step: number;
  duration_minutes?: number;
  starts_at?: string | null;
  ends_at?: string;
}

export interface PlaceBidPayload {
  amount: number;
}

export interface WinnerCheckoutPayload {
  payment_method: 'CASH_ON_MEETUP' | 'BANK_TRANSFER';
  fulfillment_method: 'MEETUP' | 'SHIPPING';
  meetup_place?: string;
  meetup_time?: string;
  shipping_address?: string;
  contact_name: string;
  contact_phone: string;
  buyer_note?: string;
}

export type AuctionRealtimeEvent =
  | {
      event: 'BID_PLACED';
      auction_id: number;
      current_price: string;
      highest_bid: string;
      bid_count: number;
      minimum_next_bid: string;
      server_time: string;
    }
  | {
      event: 'AUCTION_STARTED';
      auction_id: number;
      current_price: string;
      bid_count: number;
      server_time: string;
    }
  | {
      event: 'AUCTION_ENDED';
      auction_id: number;
      status: 'ENDED';
      final_price: string | null;
      has_winner: boolean;
      server_time: string;
    }
  | {
      event: 'AUCTION_CANCELLED';
      auction_id: number;
      server_time: string;
    };

export interface WonAuctionResponse {
  auction_id: number;
  product_id: number;
  product_title: string;
  product_image_url?: string | null;
  final_price: MoneyWire;
  winner_checkout_deadline: string;
  server_time: string;
}
