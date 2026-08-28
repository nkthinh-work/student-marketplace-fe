import { z } from 'zod';

// Preprocess price để phân biệt rõ giữa chuỗi rỗng ("" -> undefined) và số 0 hợp lệ
const pricePreprocess = (val: unknown) => {
  if (val === '' || val === null || val === undefined) return undefined;
  if (typeof val === 'string' && val.trim() === '') return undefined;
  const num = Number(val);
  return isNaN(num) ? val : num;
};

export const productCreateSchema = z.object({
  category_id: z.coerce
    .number({ invalid_type_error: 'Vui lòng chọn danh mục' })
    .min(1, 'Vui lòng chọn danh mục'),
  title: z
    .string()
    .min(1, 'Tiêu đề không được để trống')
    .max(255, 'Tiêu đề không được vượt quá 255 ký tự'),
  description: z.string().max(2000, 'Mô tả không được vượt quá 2000 ký tự').optional(),
  price: z.preprocess(
    pricePreprocess,
    z
      .number({
        required_error: 'Vui lòng nhập giá. Nhập 0 nếu muốn cho miễn phí.',
        invalid_type_error: 'Vui lòng nhập giá. Nhập 0 nếu muốn cho miễn phí.',
      })
      .min(0, 'Giá không được nhỏ hơn 0.'),
  ),
  stock: z.coerce
    .number({ invalid_type_error: 'Số lượng không hợp lệ' })
    .int('Số lượng phải là số nguyên')
    .min(1, 'Số lượng tối thiểu là 1'),
});

export type ProductCreateForm = z.infer<typeof productCreateSchema>;

export const productUpdateSchema = z.object({
  category_id: z.coerce.number().min(1, 'Vui lòng chọn danh mục').optional(),
  title: z.string().min(1, 'Tiêu đề không được để trống').max(255).optional(),
  description: z.string().max(2000).optional(),
  price: z.preprocess(
    pricePreprocess,
    z
      .number({
        required_error: 'Vui lòng nhập giá. Nhập 0 nếu muốn cho miễn phí.',
        invalid_type_error: 'Vui lòng nhập giá. Nhập 0 nếu muốn cho miễn phí.',
      })
      .min(0, 'Giá không được nhỏ hơn 0.'),
  ),
  stock: z.coerce
    .number({ invalid_type_error: 'Số lượng không hợp lệ' })
    .int('Số lượng phải là số nguyên')
    .min(0, 'Số lượng không thể âm')
    .optional(),
  status: z.enum(['AVAILABLE', 'HIDDEN']).optional(),
});

export type ProductUpdateForm = z.infer<typeof productUpdateSchema>;
