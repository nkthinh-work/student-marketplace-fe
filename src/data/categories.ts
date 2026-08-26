export interface Category {
  id: string;
  label: string;
  icon: string;
}

/**
 * Category bar items — UI scaffold only.
 * Phase 1: no backend integration.
 * Phase 2: will connect to Categories API.
 */
export const categories: Category[] = [
  { id: 'for-you', label: 'Dành cho bạn', icon: '🏠' },
  { id: 'textbooks', label: 'Giáo trình', icon: '📚' },
  { id: 'electronics', label: 'Đồ điện tử', icon: '💻' },
  { id: 'housing', label: 'Phòng trọ / KTX', icon: '🏢' },
  { id: 'vehicles', label: 'Xe đạp / xe máy', icon: '🏍️' },
  { id: 'daily', label: 'Đồ sinh hoạt', icon: '🧺' },
];
