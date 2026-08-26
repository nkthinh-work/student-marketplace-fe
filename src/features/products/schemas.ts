import { z } from 'zod';

export const productCreateSchema = z.object({
  category_id: z.coerce
    .number({ invalid_type_error: 'Vui lòng chọn danh mục' })
    .min(1, 'Vui lòng chọn danh mục'),
  title: z
    .string()
    .min(1, 'Tiêu đề không được để trống')
    .max(255, 'Tiêu đề không được vượt quá 255 ký tự'),
  description: z.string().max(2000, 'Mô tả không được vượt quá 2000 ký tự').optional(),
  price: z.coerce
    .number({ invalid_type_error: 'Giá sản phẩm không hợp lệ' })
    .min(0, 'Giá sản phẩm không thể âm'),
  stock: z.coerce
    .number({ invalid_type_error: 'Số lượng không hợp lệ' })
    .int('Số lượng phải là số nguyên')
    .min(1, 'Số lượng tối thiểu là 1'),
});

export type ProductCreateForm = z.infer<typeof productCreateSchema>;

export const productUpdateSchema = z.object({
  category_id: z.coerce.number().min(1).optional(),
  title: z.string().min(1, 'Tiêu đề không được để trống').max(255).optional(),
  description: z.string().max(2000).optional(),
  price: z.coerce.number().min(0, 'Giá sản phẩm không thể âm').optional(),
  stock: z.coerce.number().int().min(0, 'Số lượng không thể âm').optional(),
  status: z.enum(['AVAILABLE', 'HIDDEN']).optional(),
});

export type ProductUpdateForm = z.infer<typeof productUpdateSchema>;
