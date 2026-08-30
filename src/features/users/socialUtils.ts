import type { SocialPlatform } from './types';

export interface SocialOption {
  platform: SocialPlatform;
  label: string;
  placeholder: string;
  domain: string;
}

export const SOCIAL_OPTIONS: SocialOption[] = [
  {
    platform: 'FACEBOOK',
    label: 'Facebook',
    placeholder: 'https://facebook.com/username',
    domain: 'facebook.com',
  },
  {
    platform: 'INSTAGRAM',
    label: 'Instagram',
    placeholder: 'https://instagram.com/username',
    domain: 'instagram.com',
  },
  {
    platform: 'TIKTOK',
    label: 'TikTok',
    placeholder: 'https://tiktok.com/@username',
    domain: 'tiktok.com',
  },
  {
    platform: 'ZALO',
    label: 'Zalo',
    placeholder: 'https://zalo.me/0352866196',
    domain: 'zalo.me',
  },
  {
    platform: 'LINKEDIN',
    label: 'LinkedIn',
    placeholder: 'https://linkedin.com/in/username',
    domain: 'linkedin.com',
  },
];

export function formatSocialDisplay(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    const pathname = parsed.pathname === '/' ? '' : parsed.pathname;
    return `${host}${pathname}`;
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, '').split('?')[0] || url;
  }
}
