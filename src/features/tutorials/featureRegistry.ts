import React from 'react';
import {
  Home,
  Heart,
  PlusCircle,
  Package,
  ShoppingBag,
  Store,
  Bell,
  MessageSquare,
  User,
  MessageSquareQuote,
  HelpCircle,
} from 'lucide-react';

export interface NavigationSection {
  id: string;
  label: string;
}

export const NAVIGATION_SECTIONS: NavigationSection[] = [
  { id: 'HOME', label: 'Trang chủ' },
  { id: 'LISTINGS', label: 'TIN ĐĂNG' },
  { id: 'TRANSACTIONS', label: 'GIAO DỊCH' },
  { id: 'COMMUNICATION', label: 'LIÊN LẠC' },
  { id: 'ACCOUNT', label: 'TÀI KHOẢN' },
];

export interface TutorialFeatureMeta {
  key: string;
  label: string;
  section: string;
  icon: React.ComponentType<{ className?: string }>;
  order: number;
  route: string;
  defaultActionKey?: string;
  routeMatchers?: RegExp[];
}

export const TUTORIAL_FEATURES: TutorialFeatureMeta[] = [
  // Trang chủ
  {
    key: 'HOME',
    label: 'Trang chủ',
    section: 'Trang chủ',
    icon: Home,
    order: 10,
    route: '/',
    defaultActionKey: 'HOME',
    routeMatchers: [/^\/$/],
  },
  // TIN ĐĂNG
  {
    key: 'FAVORITES',
    label: 'Tin đã lưu',
    section: 'TIN ĐĂNG',
    icon: Heart,
    order: 20,
    route: '/favorites',
    defaultActionKey: 'HOME',
    routeMatchers: [/^\/favorites/],
  },
  {
    key: 'CREATE_PRODUCT',
    label: 'Đăng tin bán',
    section: 'TIN ĐĂNG',
    icon: PlusCircle,
    order: 30,
    route: '/products/new',
    defaultActionKey: 'CREATE_PRODUCT',
    routeMatchers: [/^\/products\/new/],
  },
  {
    key: 'MY_LISTINGS',
    label: 'Quản lý tin đăng',
    section: 'TIN ĐĂNG',
    icon: Package,
    order: 40,
    route: '/my-products',
    defaultActionKey: 'MY_LISTINGS',
    routeMatchers: [/^\/my-products/],
  },
  // GIAO DỊCH
  {
    key: 'BUYER_ORDERS',
    label: 'Đơn mua',
    section: 'GIAO DỊCH',
    icon: ShoppingBag,
    order: 50,
    route: '/orders/buying',
    defaultActionKey: 'BUYER_ORDERS',
    routeMatchers: [/^\/orders\/buying/],
  },
  {
    key: 'SELLER_ORDERS',
    label: 'Đơn bán',
    section: 'GIAO DỊCH',
    icon: Store,
    order: 60,
    route: '/orders/selling',
    defaultActionKey: 'SELLER_ORDERS',
    routeMatchers: [/^\/orders\/selling/],
  },
  // LIÊN LẠC
  {
    key: 'NOTIFICATIONS',
    label: 'Thông báo',
    section: 'LIÊN LẠC',
    icon: Bell,
    order: 70,
    route: '/notifications',
    defaultActionKey: 'NOTIFICATIONS',
    routeMatchers: [/^\/notifications/],
  },
  {
    key: 'MESSAGES',
    label: 'Tin nhắn',
    section: 'LIÊN LẠC',
    icon: MessageSquare,
    order: 80,
    route: '/messages',
    defaultActionKey: 'MESSAGES',
    routeMatchers: [/^\/messages/],
  },
  // TÀI KHOẢN
  {
    key: 'PROFILE',
    label: 'Hồ sơ cá nhân',
    section: 'TÀI KHOẢN',
    icon: User,
    order: 90,
    route: '/profile',
    defaultActionKey: 'PROFILE',
    routeMatchers: [/^\/profile/, /^\/users/],
  },
  {
    key: 'FEEDBACK',
    label: 'Feedback',
    section: 'TÀI KHOẢN',
    icon: MessageSquareQuote,
    order: 100,
    route: '/feedback',
    defaultActionKey: 'FEEDBACK',
    routeMatchers: [/^\/feedback/],
  },
];

export const FEATURE_MAP = new Map<string, TutorialFeatureMeta>(
  TUTORIAL_FEATURES.map((f) => [f.key, f])
);

export function getFeatureMeta(key: string): TutorialFeatureMeta {
  return (
    FEATURE_MAP.get(key) || {
      key,
      label: key,
      section: 'Khác',
      icon: HelpCircle,
      order: 999,
      route: '/',
    }
  );
}

export function matchFeatureFromPathname(pathname: string): string | null {
  for (const feature of TUTORIAL_FEATURES) {
    if (feature.routeMatchers) {
      for (const matcher of feature.routeMatchers) {
        if (matcher.test(pathname)) {
          return feature.key;
        }
      }
    }
  }
  return null;
}
