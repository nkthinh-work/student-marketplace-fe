import { z } from 'zod';

export const userUpdateSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Tên không được để trống')
    .max(100, 'Tên tối đa 100 ký tự')
    .optional(),
  phone: z
    .string()
    .max(20, 'Số điện thoại tối đa 20 ký tự')
    .optional()
    .or(z.literal('')),
  avatar_url: z
    .string()
    .max(500, 'URL ảnh tối đa 500 ký tự')
    .url('URL ảnh không hợp lệ')
    .optional()
    .or(z.literal('')),
  bio: z
    .string()
    .max(500, 'Tiểu sử tối đa 500 ký tự')
    .optional()
    .or(z.literal('')),
  default_meetup_area: z
    .string()
    .max(255, 'Điểm hẹn tối đa 255 ký tự')
    .optional()
    .or(z.literal('')),
});

export type UserUpdateForm = z.infer<typeof userUpdateSchema>;
