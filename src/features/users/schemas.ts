import { z } from 'zod';

export const userUpdateSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Họ và tên không được để trống')
    .max(100, 'Họ và tên tối đa 100 ký tự')
    .optional(),
  phone: z
    .string()
    .max(20, 'Số điện thoại tối đa 20 ký tự')
    .optional()
    .or(z.literal('')),
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
    .min(4, 'Số tài khoản tối thiểu 4 ký tự')
    .max(30, 'Số tài khoản tối đa 30 ký tự')
    .regex(/^[a-zA-Z0-9]+$/, 'Số tài khoản chỉ gồm chữ cái và chữ số'),
  account_name: z
    .string()
    .trim()
    .min(2, 'Tên chủ tài khoản tối thiểu 2 ký tự')
    .max(100, 'Tên chủ tài khoản tối đa 100 ký tự'),
});

export type BankAccountFormValues = z.infer<typeof bankAccountSchema>;
