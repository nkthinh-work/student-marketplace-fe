export interface PreviewProduct {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  category: string;
}

/**
 * Preview product cards for landing page presentation.
 * Phase 1: mock data only, no backend integration.
 * Phase 2: will be replaced by real Products API.
 */
export const previewProducts: PreviewProduct[] = [
  {
    id: 'preview-1',
    title: 'Honda Winner X',
    price: 45_000_000,
    imageUrl: 'https://placehold.co/400x300/F5E6E0/722F37?text=Honda+Winner+X',
    category: 'vehicles',
  },
  {
    id: 'preview-2',
    title: 'Sony 55" 4K TV',
    price: 12_000_000,
    imageUrl: 'https://placehold.co/400x300/F5E6E0/722F37?text=Sony+4K+TV',
    category: 'electronics',
  },
  {
    id: 'preview-3',
    title: 'MacBook Air M2',
    price: 19_000_000,
    imageUrl: 'https://placehold.co/400x300/F5E6E0/722F37?text=MacBook+Air',
    category: 'electronics',
  },
  {
    id: 'preview-4',
    title: 'Xe đạp Giant',
    price: 3_000_000,
    imageUrl: 'https://placehold.co/400x300/F5E6E0/722F37?text=Xe+Dap+Giant',
    category: 'vehicles',
  },
  {
    id: 'preview-5',
    title: 'Giáo trình Toán cao cấp',
    price: 200_000,
    imageUrl: 'https://placehold.co/400x300/F5E6E0/722F37?text=Giao+Trinh',
    category: 'textbooks',
  },
  {
    id: 'preview-6',
    title: 'Bàn học gấp gọn',
    price: 450_000,
    imageUrl: 'https://placehold.co/400x300/F5E6E0/722F37?text=Ban+Hoc',
    category: 'daily',
  },
];

/**
 * Format VND price for display.
 */
export function formatVND(price: number): string {
  if (price >= 1_000_000) {
    const millions = price / 1_000_000;
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M VNĐ`;
  }
  if (price >= 1_000) {
    const thousands = price / 1_000;
    return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}k VNĐ`;
  }
  return `${price.toLocaleString('vi-VN')} VNĐ`;
}
