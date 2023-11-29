import { object, string, z } from "zod";
import { Pagination } from "./types";

export type BrandFilterPagination = {
  filter?: any,
  pagination?: Pagination,
}

const params = {
  params: object({
    brandId: string({ required_error: "brandId is required" })
  })
}

export const createBrandSchema = object({
  body: object({
    name: string({ required_error: "Name is required" })
      .min(1).max(128)
  })
})

export const createMultiBrandsSchema = object({
  body: object({
    name: string({ required_error: "Name is required" })
      .min(1).max(128)
  }).array()
})

export const deleteMultiBrandsSchema = object({
  body: object({
    id: string({ required_error: "Name is required" })
  }).array()
})

export const getBrandSchema = object({
  ...params
})

export type CreateBrandInput = z.infer<typeof createBrandSchema>["body"]
export type CreateMultiBrandsInput = z.infer<typeof createMultiBrandsSchema>["body"]
export type GetBrandInput = z.infer<typeof getBrandSchema>
export type DeleteMultiBrandInput = z.infer<typeof deleteMultiBrandsSchema>["body"]