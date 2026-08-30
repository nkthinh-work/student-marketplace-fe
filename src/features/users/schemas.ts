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
