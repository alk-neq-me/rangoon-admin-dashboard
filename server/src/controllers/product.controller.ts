import { Request, Response, NextFunction } from 'express'
import { db } from '../utils/db'
import AppError from '../utils/appError';
import { CreateMultiProductsInput, CreateProductInput, GetProductInput, LikeProductByUserInput, ProductFilterPagination, UpdateProductInput, UploadImagesProductInput } from '../schemas/product.schema';
import logging from '../middleware/logging/logging';
import { HttpDataResponse, HttpListResponse, HttpResponse } from '../utils/helper';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { convertNumericStrings } from '../utils/convertNumber';
import { convertStringToBoolean } from '../utils/convertStringToBoolean';


// TODO: specification filter
export async function getProductsHandler(
  req: Request<{}, {}, {}, ProductFilterPagination>,
  res: Response,
  next: NextFunction
) {
  try {
    const { filter = {}, pagination, include: includes, orderBy } = convertNumericStrings(req.query)
    const include = convertStringToBoolean(includes)
    const {
      id,
      brand,
      brandId,
      title,
      price,
      overview,
      features,
      warranty,
      categories,
      colors,
      instockStatus,
      description,
      type,
      dealerPrice,
      marketPrice,
      discount,
      status,
      priceUnit,
      salesCategory,
      likedUsers,
    } = filter || { status: undefined }
    const { page, pageSize } = pagination ??  // ?? nullish coalescing operator, check only `null` or `undefied`
      { page: 1, pageSize: 10 }

    const offset = (page - 1) * pageSize

    const [ count, products ] = await db.$transaction([
      db.product.count(),
      db.product.findMany({
        where: {
          id,
          brand,
          brandId,
          title,
          price,
          overview,
          features,
          warranty,
          categories,
          colors,
          instockStatus,
          description,
          type,
          dealerPrice,
          marketPrice,
          discount,
          status,
          priceUnit,
          salesCategory,
          likedUsers,
        },
        orderBy,
        skip: offset,
        take: pageSize,
        // @ts-ignore
        include
      })
    ])

    res.status(200).json(HttpListResponse(products, count))
  } catch (err: any) {
    const msg = err?.message || "internal server error"
    logging.error(msg)
    next(new AppError(500, msg))
  }
}


export async function getProductHandler(
  req: Request<GetProductInput, {}, {}>,
  res: Response,
  next: NextFunction
) {
  try {
    const { productId } = req.params

    const { include: includes } = convertNumericStrings(req.query)
    const include = convertStringToBoolean(includes)

    const product = await db.product.findUnique({
      where: {
        id: productId
      },
      // @ts-ignore
      include
    })

    if (!product) return next(new AppError(404, "Product not found"))

    res.status(200).json(HttpDataResponse({ product }))
  } catch (err: any) {
    const msg = err?.message || "internal server error"
    logging.error(msg)
    next(new AppError(500, msg))
  }
}


export async function createProductHandler(
  req: Request<{}, {}, CreateProductInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const {
      price,
      brandId,
      title,
      specification,
      overview,
      features,
      warranty,
      colors,
      instockStatus,
      description,
      type,
      dealerPrice,
      marketPrice,
      discount,
      priceUnit,
      salesCategory,
      categories,
      quantity,
      status
    } = req.body;
    const new_product = await db.product.create({
      data: {
        price,
        brandId,
        title,
        specification: {
          create: specification
        },
        overview,
        features,
        warranty,
        colors,
        instockStatus,
        description,
        type,
        dealerPrice,
        marketPrice,
        discount,
        status,
        priceUnit,
        categories: {
          create: categories.map(id => ({
            category: {
              connect: { id }
            }
          }))
        },
        salesCategory: {
          create: salesCategory.map(id => ({
            salesCategory: {
              connect: { id }
            }
          }))
        },
        quantity,
      }
    })
    res.status(201).json(HttpDataResponse({ product: new_product }))
  } catch (err: any) {
    const msg = err?.message || "internal server error"
    logging.error(msg)

    if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") return next(new AppError(409, "Category name already exists"))

    next(new AppError(500, msg))
  }
}


export async function createMultiProductsHandler(
  req: Request<{}, {}, CreateMultiProductsInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const data = req.body

    await Promise.all(data.map(product => {
      return db.product.upsert({
        where: {
          id: product.id,
        },
        create: {
          id: product.id,
          price: product.price,
          title: product.title,
          overview: product.overview,
          features: product.features,
          warranty: product.warranty,
          colors: product.colors,
          instockStatus: product.instockStatus,
          description: product.description,
          // type: product.type,  // TODO: What is product type??
          dealerPrice: product.dealerPrice,
          marketPrice: product.marketPrice,
          discount: product.discount,
          status: product.status,
          priceUnit: product.priceUnit,
          quantity: product.quantity,
          brand: {
            connectOrCreate: {
              where: { name: product.brandName },
              create: { name: product.brandName }
            }
          },
          specification: {
            createMany: {
              data: product.specification.split("\n").map(spec => ({ name: spec.split(": ")[0], value: spec.split(": ")[1] })),
              skipDuplicates: true
            }
          },
          categories: {
            create: product.categories.split("\n").map(name => ({
              category: {
                connectOrCreate: {
                  where: { name },
                  create: { name }
                }
              }
            }))
          },
          salesCategory: {
            create: product.salesCategory.split("\n").map(name => ({
              salesCategory: {
                connectOrCreate: {
                  where: { name },
                  create: { name }
                }
              }
            }))
          },
        },
        update: {},
      })
    }))

    res.status(201).json(HttpResponse(201, "Success"))
  } catch (err: any) {
    const msg = err?.message || "internal server error"
    logging.error(msg)

    if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") return next(new AppError(409, "Exchange already exists"))

    next(new AppError(500, msg))
  }
}


export async function deleteProductHandler(
  req: Request<GetProductInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const { productId } = req.params

    const product = await db.product.findUnique({
      where: {
        id: productId
      }
    })

    if (!product) return next(new AppError(404,  `Product not found`))

    // logging.log(await db.specification.count())

    // remove association data: specifications
    await db.specification.deleteMany({
      where: {
        productId,
      }
    })

    // remove association data: favorites
    await db.favorites.deleteMany({
      where: {
        productId,
      }
    })

    // remove association data: productCategory
    await db.productCategory.deleteMany({
      where: {
        productId,
      }
    })

    // remove association data: productSalesCategory
    await db.productSalesCategory.deleteMany({
      where: {
        productId,
      }
    })

    await db.product.delete({
      where: {
        id: productId
      }
    })

    res.status(200).json(HttpResponse(200, "Success delete"))
  } catch (err: any) {
    const msg = err?.message || "internal server error"
    logging.error(msg)
    if (err?.code === "23505") next(new AppError(409, "data already exists"))
    next(new AppError(500, msg))
  }
}


export async function updateProductHandler(
  req: Request<UpdateProductInput["params"], {}, UpdateProductInput["body"]>,
  res: Response,
  next: NextFunction
) {
  try {
    const { productId } = req.params
    const {
      price,
      brandId,
      title,
      specification,
      overview,
      features,
      warranty,
      colors,
      instockStatus,
      description,
      type,
      dealerPrice,
      marketPrice,
      discount,
      priceUnit,
      salesCategory,
      categories,
      quantity,
      status
    } = req.body

    // remove association data: productCategory
    await db.productCategory.deleteMany({
      where: {
        productId,
      }
    })

    // remove association data: productSalesCategory
    await db.productSalesCategory.deleteMany({
      where: {
        productId,
      }
    })

    // remove association data: specifications
    await db.product.update({
      where: {
        id: productId
      },
      data: {
        specification: {
          deleteMany: {
            productId
          }
        }
      }
    })

    // UPDATE PRODUCT
    const product = await db.product.update({
      where: {
        id: productId
      },
      data: {
        price,
        brandId,
        title,
        specification: {
          create: specification.map(spec => ({ name: spec.name, value: spec.value }))
        },
        overview,
        features,
        warranty,
        colors,
        instockStatus,
        description,
        type,
        dealerPrice,
        marketPrice,
        discount,
        status,
        priceUnit,
        categories: {
          create: categories.map(id => ({
            category: {
              connect: { id }
            }
          }))
        },
        salesCategory: {
          create: salesCategory.map(id => ({
            salesCategory: {
              connect: { id }
            }
          }))
        },
        quantity,
      }
    })

    res.status(200).json(HttpDataResponse({ product }))
  } catch (err) {
    next(err)
  }
}


export async function uploadImagesProductHandler(
  req: Request<GetProductInput, {}, UploadImagesProductInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const { productId } = req.params
    const { images } = req.body

    await db.product.update({
      where: {
        id: productId
      },
      data: {
        images: {
          push: images,
        }
      }
    })

    res.status(200).json(HttpListResponse(images))
  } catch (err) {
    next(err)
  }
}


export async function likeProductByUserHandler(
  req: Request<LikeProductByUserInput["params"], {}, LikeProductByUserInput["body"]>,
  res: Response,
  next: NextFunction
) {
  try {
    const { productId } = req.params
    const { userId } = req.body

    const product = await db.product.update({
      where: { id: productId },
      data: {
        likedUsers: {
          create: {
            userId: userId
          }
        }
      }
    })

    res.status(200).json(HttpDataResponse({ product }))
  } catch (err) {
    next(err)
  }
}


export async function unLikeProductByUserHandler(
  req: Request<LikeProductByUserInput["params"], {}, LikeProductByUserInput["body"]>,
  res: Response,
  next: NextFunction
) {
  try {
    const { productId } = req.params
    const { userId } = req.body

    await db.favorites.deleteMany({
      where: {
        productId,
        userId
      }
    })

    // const product = await db.product.update({
    //   where: { id: productId },
    //   data: {
    //     likedUsers: {
    //       create: {
    //         userId: userId
    //       }
    //     }
    //   }
    // })

    res.status(200).json(HttpResponse(200, "Success Unlike"))
  } catch (err) {
    next(err)
  }
}
