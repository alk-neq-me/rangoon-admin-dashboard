import { NextFunction, Request, Response } from "express";
import logging from "../middleware/logging/logging";
import AppError from "../utils/appError";
import { db } from "../utils/db";
import { HttpDataResponse, HttpListResponse, HttpResponse } from "../utils/helper";
import { CreateSalesCategoryInput, GetSalesCategoryInput } from "../schemas/salesCategory.schema";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";


export async function getSalesCategoriesHandler(
  _: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // TODO: filter
    const categories = await db.salesCategory.findMany({
      where: {}
    })

    res.status(200).json(HttpListResponse(categories))
  } catch (err: any) {
    const msg = err?.message || "internal server error"
    logging.error(msg)
    next(new AppError(500, msg))
  }
}


export async function getSalesCategoryHandler(
  req: Request<GetSalesCategoryInput["params"]>,
  res: Response,
  next: NextFunction
) {
  try {
    const { salesCategoryId } = req.params
    const salesCategory = await db.salesCategory.findUnique({
      where: {
        id: salesCategoryId
      }
    })

    res.status(200).json(HttpDataResponse({ salesCategory }))
  } catch (err: any) {
    const msg = err?.message || "internal server error"
    logging.error(msg)
    next(new AppError(500, msg))
  }
}


export async function createSalesCategoryHandler(
  req: Request<{}, {}, CreateSalesCategoryInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const { name } = req.body
    const category = await db.salesCategory.create({
      data: { name },
    })

    res.status(200).json(HttpDataResponse({ category }))
  } catch (err: any) {
    const msg = err?.message || "internal server error"
    logging.error(msg)

    if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") return next(new AppError(409, "Sales category already exists"))

    next(new AppError(500, msg))
  }
}


export async function deleteSalesCategoryHandler(
  req: Request<GetSalesCategoryInput["params"]>,
  res: Response,
  next: NextFunction
) {
  try {
    const { salesCategoryId } = req.params
    await db.salesCategory.delete({
      where: {
        id: salesCategoryId
      }
    })

    res.status(200).json(HttpResponse(200, "Success deleted"))
  } catch (err: any) {
    const msg = err?.message || "internal server error"
    logging.error(msg)
    next(new AppError(500, msg))
  }
}
