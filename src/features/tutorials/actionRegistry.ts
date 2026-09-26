export interface TutorialActionMeta {
  key: string;
  label: string;
  path: string;
}

export const TUTORIAL_ACTIONS: TutorialActionMeta[] = [
  {
    key: 'HOME',
    label: 'Mở trang chủ',
    path: '/',
  },
  {
    key: 'CREATE_PRODUCT',
    label: 'Mở đăng bán sản phẩm',
    path: '/products/new',
  },
  {
    key: 'MY_LISTINGS',
    label: 'Mở quản lý tin đăng',
    path: '/my-products',
  },
  {
    key: 'FAVORITES',
    label: 'Mở tin đã lưu',
    path: '/favorites',
  },
  {
    key: 'BUYER_ORDERS',
    label: 'Mở đơn mua hàng',
    path: '/orders/buying',
  },
  {
    key: 'SELLER_ORDERS',
    label: 'Mở đơn bán hàng',
    path: '/orders/selling',
  },
  {
    key: 'MESSAGES',
    label: 'Mở tin nhắn',
    path: '/messages',
  },
  {
    key: 'NOTIFICATIONS',
    label: 'Mở thông báo',
    path: '/notifications',
  },
  {
    key: 'FEEDBACK',
    label: 'Mở trang Feedback',
    path: '/feedback',
  },
  {
    key: 'PROFILE',
    label: 'Mở hồ sơ cá nhân',
    path: '/profile',
  },
];

export const ACTION_MAP = new Map<string, TutorialActionMeta>(
  TUTORIAL_ACTIONS.map((a) => [a.key, a])
);

export function getActionMeta(key?: string | null): TutorialActionMeta | null {
  if (!key) return null;
  return ACTION_MAP.get(key) || null;
}
