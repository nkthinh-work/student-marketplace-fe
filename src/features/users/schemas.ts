import { z } from 'zod';

export function normalizeVietnamPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;

  // Only allow digits, spaces, '.', '-', and optional leading '+'
  if (!/^\+?[0-9\s.-]+$/.test(trimmed)) {
    return null;
  }

  // Remove visual separators
  let cleaned = trimmed.replace(/[\s.-]/g, '');

  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('84') && cleaned.length === 11) {
    cleaned = '0' + cleaned.slice(2);
  }

  // Canonical valid VN mobile: exactly 10 digits starting with 03, 05, 07, 08, 09
  if (/^0[35789]\d{8}$/.test(cleaned)) {
    return cleaned;
  }
  return null;
}

export const userUpdateSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Họ và tên không được để trống')
    .max(100, 'Họ và tên tối đa 100 ký tự')
    .optional(),
  phone: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true;
        return normalizeVietnamPhone(val) !== null;
      },
      {
        message: 'Số điện thoại không hợp lệ. Vui lòng nhập số di động Việt Nam 10 chữ số.',
      }
    ),
  show_phone_publicly: z.boolean().optional(),
  social_links: z
    .array(
      z.object({
        platform: z.enum(['FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'ZALO', 'LINKEDIN']),
        url: z.string().url(),
      }),
    )
    .optional(),
  bio: z
    .string()
    .max(500, 'Tiểu sử tối đa 500 ký tự')
    .optional()
    .or(z.literal('')),
  delivery_area: z
    .string()
    .max(255, 'Phạm vi giao / nhận tối đa 255 ký tự')
    .optional()
    .or(z.literal('')),
  default_meetup_area: z
    .string()
    .max(255, 'Điểm hẹn tối đa 255 ký tự')
    .optional()
    .or(z.literal('')),
});

export type UserUpdateForm = z.infer<typeof userUpdateSchema>;

export function validateSocialUrl(
  platform: 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK' | 'ZALO' | 'LINKEDIN',
  url: string,
): { valid: boolean; error?: string } {
  const trimmed = url.trim();
  if (!trimmed) return { valid: false, error: 'Vui lòng nhập URL.' };
  if (!/^https?:\/\//i.test(trimmed)) {
    return { valid: false, error: 'URL phải bắt đầu bằng https:// hoặc http://' };
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();

    switch (platform) {
      case 'FACEBOOK':
        if (
          !['facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.com', 'www.fb.com'].includes(
            host,
          )
        ) {
          return { valid: false, error: 'Liên kết không thuộc Facebook.' };
        }
        break;
      case 'INSTAGRAM':
        if (!['instagram.com', 'www.instagram.com', 'instagr.am'].includes(host)) {
          return { valid: false, error: 'Liên kết không thuộc Instagram.' };
        }
        break;
      case 'TIKTOK':
        if (!['tiktok.com', 'www.tiktok.com', 'vt.tiktok.com'].includes(host)) {
          return { valid: false, error: 'Liên kết không thuộc TikTok.' };
        }
        break;
      case 'ZALO':
        if (!['zalo.me', 'chat.zalo.me'].includes(host)) {
          return { valid: false, error: 'Liên kết không thuộc Zalo.' };
        }
        break;
      case 'LINKEDIN':
        if (!['linkedin.com', 'www.linkedin.com', 'vn.linkedin.com'].includes(host)) {
          return { valid: false, error: 'Liên kết không thuộc LinkedIn.' };
        }
        break;
      default:
        return { valid: false, error: 'Nền tảng không được hỗ trợ.' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Định dạng URL không hợp lệ.' };
  }
}

export const bankAccountSchema = z.object({
  bank_bin: z.string().min(1, 'Vui lòng chọn ngân hàng'),
  account_number: z
    .string()
    .trim()
    .min(4, 'Số tài khoản tối thiểu 4 chữ số')
    .max(30, 'Số tài khoản tối đa 30 chữ số')
    .regex(/^\d+$/, 'Số tài khoản chỉ được chứa chữ số (0-9)'),
  account_name: z
    .string()
    .trim()
    .min(2, 'Tên chủ tài khoản tối thiểu 2 ký tự')
    .max(100, 'Tên chủ tài khoản tối đa 100 ký tự')
    .refine(
      (val) => /[a-zA-ZÀ-ỹ]/.test(val),
      'Tên chủ tài khoản phải chứa chữ cái'
    )
    .refine(
      (val) => !Array.from(val).some((ch) => ch.charCodeAt(0) <= 31 || ch.charCodeAt(0) === 127),
      'Tên chủ tài khoản không được chứa ký tự điều khiển'
    )
    .refine(
      (val) => /^[\p{L}\s.'-]+$/u.test(val),
      'Tên chủ tài khoản chỉ được chứa chữ cái, khoảng trắng và dấu tên hợp lệ'
    ),
});

export type BankAccountFormValues = z.infer<typeof bankAccountSchema>;
