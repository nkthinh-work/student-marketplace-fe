import type { ComponentType, SVGProps } from 'react';
import {
  BookOpen,
  Smartphone,
  Laptop,
  Radio,
  BedDouble,
  CookingPot,
  Bike,
  Shirt,
  Dumbbell,
  Shapes,
  type LucideIcon,
} from 'lucide-react';
import type { CategoryResponse, CategorySummary } from './types';

export interface CategoryPresentationMeta {
  slug: string;
  label: string;
  icon: LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;
  helper: string;
}

/**
 * Canonical taxonomy presentation metadata keyed by canonical slug.
 */
export const CATEGORY_META_BY_SLUG: Record<string, CategoryPresentationMeta> = {
  'giao-trinh-sach': {
    slug: 'giao-trinh-sach',
    label: 'Giáo trình & Sách',
    icon: BookOpen,
    helper: 'Giáo trình, sách học, tài liệu và sách đọc',
  },
  'dien-thoai-phu-kien': {
    slug: 'dien-thoai-phu-kien',
    label: 'Điện thoại & Phụ kiện',
    icon: Smartphone,
    helper: 'Điện thoại, ốp, sạc và phụ kiện mobile',
  },
  'may-tinh-phu-kien': {
    slug: 'may-tinh-phu-kien',
    label: 'Máy tính & Phụ kiện',
    icon: Laptop,
    helper: 'Laptop, màn hình, chuột, bàn phím và linh kiện',
  },
  'thiet-bi-dien-tu-khac': {
    slug: 'thiet-bi-dien-tu-khac',
    label: 'Thiết bị điện tử khác',
    icon: Radio,
    helper: 'Loa, camera, smartwatch và thiết bị điện tử khác',
  },
  'noi-that-do-phong-tro': {
    slug: 'noi-that-do-phong-tro',
    label: 'Nội thất & Đồ phòng trọ',
    icon: BedDouble,
    helper: 'Bàn, ghế, kệ, đệm và đồ dùng phòng trọ',
  },
  'do-gia-dung': {
    slug: 'do-gia-dung',
    label: 'Đồ gia dụng',
    icon: CookingPot,
    helper: 'Quạt, nồi, ấm điện và thiết bị gia dụng',
  },
  'xe-dap-xe-may': {
    slug: 'xe-dap-xe-may',
    label: 'Xe đạp & Xe máy',
    icon: Bike,
    helper: 'Xe đạp, xe máy và phụ kiện xe',
  },
  'thoi-trang-phu-kien': {
    slug: 'thoi-trang-phu-kien',
    label: 'Thời trang & Phụ kiện',
    icon: Shirt,
    helper: 'Quần áo, giày dép, balo và phụ kiện',
  },
  'the-thao-giai-tri': {
    slug: 'the-thao-giai-tri',
    label: 'Thể thao & Giải trí',
    icon: Dumbbell,
    helper: 'Dụng cụ thể thao, bóng, vợt, board game...',
  },
  'khac': {
    slug: 'khac',
    label: 'Khác',
    icon: Shapes,
    helper: 'Mặt hàng không phù hợp với các danh mục trên',
  },
};

/**
 * Legacy/alternative slug alias mappings for backward compatibility.
 */
const SLUG_ALIASES: Record<string, string> = {
  'sach-giao-trinh': 'giao-trinh-sach',
  'do-dien-tu': 'thiet-bi-dien-tu-khac',
  'thiet-bi-dien-tu': 'thiet-bi-dien-tu-khac',
  'do-phong-tro-ktx': 'noi-that-do-phong-tro',
  'phong-tro-ktx': 'noi-that-do-phong-tro',
  'xe-co': 'xe-dap-xe-may',
  'thoi-trang': 'thoi-trang-phu-kien',
};

/**
 * Preferred canonical display order for category navigation & selects.
 */
export const CANONICAL_CATEGORY_SLUG_ORDER: string[] = [
  'giao-trinh-sach',
  'dien-thoai-phu-kien',
  'may-tinh-phu-kien',
  'thiet-bi-dien-tu-khac',
  'noi-that-do-phong-tro',
  'do-gia-dung',
  'xe-dap-xe-may',
  'thoi-trang-phu-kien',
  'the-thao-giai-tri',
  'khac',
];

/**
 * Normalizes a raw slug through known aliases to canonical slug.
 */
export function normalizeCategorySlug(rawSlug?: string | null): string {
  if (!rawSlug) return '';
  const trimmed = rawSlug.trim().toLowerCase();
  return SLUG_ALIASES[trimmed] || trimmed;
}

/**
 * Resolves category presentation metadata with defensive fallback for unknown categories.
 */
export function getCategoryMeta(
  categoryOrSlug?: string | CategoryResponse | CategorySummary | { slug?: string; name?: string } | null,
): {
  slug: string;
  label?: string;
  icon: LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;
  helper?: string;
} {
  if (!categoryOrSlug) {
    return {
      slug: '',
      icon: Shapes,
    };
  }

  const rawSlug = typeof categoryOrSlug === 'string' ? categoryOrSlug : categoryOrSlug.slug;
  const canonicalSlug = normalizeCategorySlug(rawSlug);
  const meta = CATEGORY_META_BY_SLUG[canonicalSlug];

  if (meta) {
    return {
      slug: meta.slug,
      label: typeof categoryOrSlug === 'object' && categoryOrSlug?.name ? categoryOrSlug.name : meta.label,
      icon: meta.icon,
      helper: meta.helper,
    };
  }

  // Defensive fallback for unexpected/unknown categories: no crash, display backend name + neutral icon
  const fallbackLabel = typeof categoryOrSlug === 'object' ? categoryOrSlug?.name : undefined;
  return {
    slug: rawSlug || '',
    label: fallbackLabel,
    icon: Shapes,
  };
}

/**
 * Sorts category list according to canonical order.
 * Unknown categories are appended at the end without crashing or dropping data.
 */
export function sortCategories<T extends { slug: string; name?: string }>(categories: T[]): T[] {
  return [...categories].sort((a, b) => {
    const slugA = normalizeCategorySlug(a.slug);
    const slugB = normalizeCategorySlug(b.slug);

    const indexA = CANONICAL_CATEGORY_SLUG_ORDER.indexOf(slugA);
    const indexB = CANONICAL_CATEGORY_SLUG_ORDER.indexOf(slugB);

    // If both in canonical list, sort by canonical order
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // Canonical categories come before unknown categories
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    // Sort unknown categories alphabetically by name/slug
    const nameA = a.name || a.slug;
    const nameB = b.name || b.slug;
    return nameA.localeCompare(nameB, 'vi');
  });
}
