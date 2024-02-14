import { number, object, string, z } from "zod";
import { potentialOrderStatus } from ".";
import { orderAddressType } from "../../orders/forms";


const paymentMethodProvider = [
  "Cash",
  "AYAPay",
  "CBPay",
  "KBZPay",
  "OnePay",
  "UABPay",
  "WavePay",
  "BankTransfer",
] as const


const updatePotentialOrderSchema = object({
  id: string().optional(),
  status: z.enum(potentialOrderStatus).default("Processing"),
  // orderItems: object({
  //   price: number().min(0),
  //   quantity: number(),
  //   productId: string(),
  //   totalPrice: number().min(0),
  //   saving: number()
  // }).array(),
  deliveryAddressId: string().optional(),
  totalPrice: number().min(0),
  pickupAddress: string().optional(),
  billingAddressId: string({ required_error: "billingAddressId is required" }),
  paymentMethodProvider: z.enum(paymentMethodProvider, { required_error: "paymentMethodProvider is required" }),
  remark: string().optional(),
  addressType: z.enum(orderAddressType, { required_error: "Order address type is required" })
})

export type UpdatePotentialOrderInput = z.infer<typeof updatePotentialOrderSchema>

export interface UpdatePotentialOrderProps {}


/**
 * not support yet
 */
export function UpdatePotentialOrderForm(props: UpdatePotentialOrderProps) {
  const {} = props
  return "not support yet!"
}
