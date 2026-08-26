export interface HeroSlide {
  id: string;
  imageUrl: string;
  alt: string;
  enabled: boolean;
  sortOrder: number;
}

/**
 * Hero carousel configuration.
 * To update: add images to public/images/hero/ and update imageUrl here.
 * Carousel component reads from this config — no logic changes needed.
 */
export const heroSlides: HeroSlide[] = [
  {
    id: 'slide-1',
    imageUrl: '/images/hero/slide1.jpg',
    alt: 'Sinh viên PTIT trao đổi đồ cũ',
    enabled: true,
    sortOrder: 1,
  },
  {
    id: 'slide-2',
    imageUrl: '/images/hero/slide2.jpg',
    alt: 'Marketplace sinh viên PTIT',
    enabled: true,
    sortOrder: 2,
  },
  {
    id: 'slide-3',
    imageUrl: '/images/hero/slide3.jpg',
    alt: 'Cộng đồng sinh viên PTIT',
    enabled: true,
    sortOrder: 3,
  },
];
