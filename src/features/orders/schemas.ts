import { z } from "zod";

export const createOrderSchema = z
  .object({
    product_id: z.number(),
    quantity: z.number().int().min(1, "Số lượng phải lớn hơn hoặc bằng 1"),
    payment_method: z.enum(["CASH_ON_MEETUP", "BANK_TRANSFER"]).optional(),
    fulfillment_method: z.enum(["MEETUP", "SHIPPING"]),
    meetup_place: z.string().max(255).optional().or(z.literal("")),
    meetup_time: z.string().optional().or(z.literal("")),
    shipping_address: z.string().max(500).optional().or(z.literal("")),
    shipping_expected_at: z.string().optional().or(z.literal("")),
    contact_name: z.string().min(1, "Vui lòng nhập tên người liên hệ").max(100),
    contact_phone: z
      .string()
      .min(1, "Vui lòng nhập số điện thoại")
      .max(20, "Số điện thoại quá dài"),
    buyer_note: z.string().max(500).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillment_method === "MEETUP" && (!data.meetup_place || !data.meetup_place.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng nhập địa điểm hẹn gặp",
        path: ["meetup_place"],
      });
    }

    if (data.fulfillment_method === "SHIPPING" && (!data.shipping_address || !data.shipping_address.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng nhập địa chỉ giao hàng",
        path: ["shipping_address"],
      });
    }
  });

export type CreateOrderFormValues = z.infer<typeof createOrderSchema>;

export const updateTransactionTermsSchema = z
  .object({
    fulfillment_method: z.enum(["MEETUP", "SHIPPING"]).optional(),
    payment_method: z.enum(["CASH_ON_MEETUP", "BANK_TRANSFER"]).optional(),
    meetup_place: z.string().max(255).optional().or(z.literal("")),
    meetup_time: z.string().optional().or(z.literal("")),
    shipping_address: z.string().max(500).optional().or(z.literal("")),
    shipping_expected_at: z.string().optional().or(z.literal("")),
    payment_note: z.string().max(255).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillment_method === "MEETUP" && (!data.meetup_place || !data.meetup_place.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng nhập địa điểm hẹn gặp",
        path: ["meetup_place"],
      });
    }

    if (data.fulfillment_method === "SHIPPING" && (!data.shipping_address || !data.shipping_address.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng nhập địa chỉ giao hàng",
        path: ["shipping_address"],
      });
    }
  });

export type UpdateTransactionTermsFormValues = z.infer<
  typeof updateTransactionTermsSchema
>;

export const confirmOrderSchema = z.object({
  payment_note: z.string().max(255, "Ghi chú chuyển khoản tối đa 255 ký tự").optional().or(z.literal("")),
});

export type ConfirmOrderFormValues = z.infer<typeof confirmOrderSchema>;

export const cancelOrderSchema = z.object({
  cancel_reason: z
    .string()
    .min(1, "Vui lòng nhập lý do hủy đơn hàng")
    .max(255, "Lý do hủy đơn tối đa 255 ký tự"),
});

export type CancelOrderFormValues = z.infer<typeof cancelOrderSchema>;
