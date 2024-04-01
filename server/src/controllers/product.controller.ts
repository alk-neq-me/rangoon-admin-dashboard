import AppError, { StatusCode } from "../utils/appError";

import { OperationAction, ProductStatus } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import {
  CreateProductInput,
  DeleteMultiProductsInput,
  GetProductInput,
  GetProductSaleCategoryInput,
  LikeProductByUserInput,
  UpdateProductInput,
} from "../schemas/product.schema";
import { UpdateProductSaleCategoryInput } from "../schemas/salesCategory.schema";
import { checkUser } from "../services/checkUser";
import { ProductSalesCategoryService } from "../services/productSalesCategory";
import { ProductService } from "../services/productService";
import {
  LifeCycleProductConcrate,
  LifeCycleState,
} from "../utils/auth/life-cycle-state";
import { convertNumericStrings } from "../utils/convertNumber";
import { convertStringToBoolean } from "../utils/convertStringToBoolean";
import { generateLabel } from "../utils/generateCouponLabel";
import {
  HttpDataResponse,
  HttpListResponse,
  HttpResponse,
} from "../utils/helper";

const service = ProductService.new();
const _saleService = ProductSalesCategoryService.new();

// TODO: specification filter
export async function getProductsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = convertNumericStrings(req.query);

    const {
      id,
      title,
      price,
      overview,
      instockStatus,
      description,
      discount,
      dealerPrice,
      marketPrice,
      status,
      priceUnit,
    } = query.filter ?? {};
    const { page, pageSize } = query.pagination ?? {};
    const {
      _count,
      likedUsers,
      salesCategory,
      brand,
      coupons,
      creator,
      reviews,
      orderItem,
      categories,
      availableSets,
      specification,
    } = convertStringToBoolean(query.include) ?? {};
    const orderBy = query.orderBy ?? {};

    const sessionUser = checkUser(req?.user).ok();
    const _isAccess = await service.checkPermissions(
      sessionUser,
      OperationAction.Read,
    );
    _isAccess.ok_or_throw();

    const [count, products] = (await service.tryFindManyWithCount(
      {
        pagination: { page, pageSize },
      },
      {
        where: {
          id,
          title,
          price,
          overview,
          instockStatus,
          description,
          discount,
          dealerPrice,
          marketPrice,
          status,
          priceUnit,
          creator: {
            shopownerProviderId: sessionUser?.isSuperuser
              ? undefined
              : sessionUser?.shopownerProviderId,
          },
        },
        include: {
          _count,
          likedUsers,
          salesCategory,
          brand,
          coupons,
          creator,
          reviews,
          orderItem,
          availableSets,
          categories,
          specification,
        },
        orderBy,
      },
    )).ok_or_throw();

    res.status(StatusCode.OK).json(
      HttpListResponse(products, count, {
        meta: {
          filter: {
            id,
            title,
            price,
            overview,
            instockStatus,
            description,
            discount,
            dealerPrice,
            marketPrice,
            status,
            priceUnit,
          },
          include: {
            _count,
            likedUsers,
            salesCategory,
            brand,
            coupons,
            creator,
            reviews,
            orderItem,
            availableSets,
            categories,
            specification,
          },
          page,
          pageSize,
        },
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function getProductHandler(
  req: Request<GetProductInput, {}, {}>,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = convertNumericStrings(req.query);

    const { productId } = req.params;
    const {
      _count,
      likedUsers,
      salesCategory,
      brand,
      coupons,
      creator,
      reviews,
      orderItem,
      categories,
      availableSets,
      specification,
    } = convertStringToBoolean(query.include) ?? {};

    const sessionUser = checkUser(req?.user).ok();
    const _isAccess = await service.checkPermissions(
      sessionUser,
      OperationAction.Read,
    );
    _isAccess.ok_or_throw();

    const product = (await service.tryFindUnique({
      where: {
        id: productId,
      },
      include: {
        _count,
        likedUsers,
        salesCategory,
        brand,
        coupons,
        creator,
        reviews,
        orderItem,
        categories,
        availableSets,
        specification,
      },
    })).ok_or_throw();

    if (!product) {
      return next(
        AppError.new(
          StatusCode.NotFound,
          `Product '${productId}' not found`,
        ),
      );
    }

    // Read event action audit log
    if (product && sessionUser) {
      (await service.audit(sessionUser)).ok_or_throw();
    }

    res.status(StatusCode.OK).json(
      HttpDataResponse({ product }, {
        meta: {
          id: product.id,
          include: {
            _count,
            likedUsers,
            salesCategory,
            brand,
            coupons,
            creator,
            reviews,
            orderItem,
            categories,
            availableSets,
            specification,
          },
        },
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function createProductHandler(
  req: Request<{}, {}, CreateProductInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const {
      price,
      brandId,
      title,
      specification,
      overview,
      instockStatus,
      description,
      dealerPrice,
      marketPrice,
      priceUnit,
      salesCategory,
      categories,
      quantity,
      discount,
      isDiscountItem,
      status,
      images,
    } = req.body;

    // @ts-ignore  for mocha testing
    const sessionUser = checkUser(req?.user).ok_or_throw();
    const _isAccess = await service.checkPermissions(
      sessionUser,
      OperationAction.Create,
    );
    _isAccess.ok_or_throw();

    const product = (await service.tryCreate({
      data: {
        price,
        brandId,
        title,
        specification: {
          create: specification,
        },
        overview,
        instockStatus,
        itemCode: generateLabel("Rangoon"),
        description,
        dealerPrice,
        marketPrice,
        status,
        priceUnit,
        categories: {
          create: categories.map(id => ({
            category: {
              connect: { id },
            },
          })),
        },
        salesCategory: {
          create: (salesCategory || []).map((
            { salesCategory: salesCategoryId, discount },
          ) => ({
            salesCategory: { connect: { id: salesCategoryId } },
            discount,
          })),
        },
        quantity,
        images,
        discount,
        isDiscountItem,
        creatorId: sessionUser.id,
      },
    })).ok_or_throw();

    // Create audit log
    const _auditLog = await service.audit(sessionUser);
    _auditLog.ok_or_throw();

    res.status(StatusCode.Created).json(
      HttpDataResponse({ product }, { meta: { id: product.id } }),
    );
  } catch (err) {
    next(err);
  }
}

export async function createMultiProductsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // @ts-ignore  for mocha testing
    const sessionUser = checkUser(req?.user).ok_or_throw();
    const _isAccess = await service.checkPermissions(
      sessionUser,
      OperationAction.Create,
    );
    _isAccess.ok_or_throw();

    const excelFile = req.file;
    if (!excelFile) return res.status(StatusCode.NoContent);

    const products = (await service.tryExcelUpload(excelFile, sessionUser))
      .ok_or_throw();

    // Create audit log
    const _auditLog = await service.audit(sessionUser);
    _auditLog.ok_or_throw();

    res.status(StatusCode.Created).json(HttpListResponse(products));
  } catch (err) {
    next(err);
  }
}

export async function deleteProductSaleCategoryHandler(
  req: Request<GetProductSaleCategoryInput["params"]>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { productId, productSaleCategoryId } = req.params;

    const sessionUser = checkUser(req?.user).ok_or_throw();
    const _isAccess = await service.checkPermissions(
      sessionUser,
      OperationAction.Delete,
    );
    _isAccess.ok_or_throw();

    const _deleteProductSalesCategory = await _saleService.tryDelete({
      where: {
        id: productSaleCategoryId,
        productId,
      },
    });
    _deleteProductSalesCategory.ok_or_throw();

    // It remove sale form product, it is update product
    // Create audit log
    const _auditLog = await service.audit(sessionUser, {
      action: OperationAction.Update,
      resourceIds: [productId],
    });
    _auditLog.ok_or_throw();

    res.status(StatusCode.OK).json(
      HttpResponse(StatusCode.OK, "Success delete"),
    );
  } catch (err) {
    next(err);
  }
}

export async function updateProductSalesCategoryHandler(
  req: Request<
    UpdateProductSaleCategoryInput["params"],
    {},
    UpdateProductSaleCategoryInput["body"]
  >,
  res: Response,
  next: NextFunction,
) {
  try {
    const { productSaleCategoryId } = req.params;
    const { discount } = req.body;

    const sessionUser = checkUser(req?.user).ok_or_throw();
    const _isAccess = await service.checkPermissions(
      sessionUser,
      OperationAction.Update,
    );
    _isAccess.ok_or_throw();

    const productSalesCategory = (await _saleService.tryUpdate({
      where: {
        id: productSaleCategoryId,
      },
      data: {
        discount,
      },
      include: {
        salesCategory: true,
      },
    })).ok_or_throw();

    // It update sale form product, it is update product
    // Update event action audit log
    const _auditLog = await service.audit(sessionUser, {
      action: OperationAction.Update,
      resourceIds: [productSalesCategory.productId],
    });
    _auditLog.ok_or_throw();

    res.status(StatusCode.OK).json(
      HttpDataResponse({ productSalesCategory }, {
        meta: { id: productSalesCategory.id },
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function deleteProductHandler(
  req: Request<GetProductInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { productId } = req.params;

    const _product = (await service.tryFindUnique({
      where: {
        id: productId,
      },
      select: {
        status: true,
      },
    })).ok_or_throw();
    if (_product?.status !== ProductStatus.Draft) {
      return next(
        AppError.new(
          StatusCode.BadRequest,
          `Deletion is restricted for product in non-drift states.`,
        ),
      );
    }

    const sessionUser = checkUser(req?.user).ok_or_throw();
    const _isAccess = await service.checkPermissions(
      sessionUser,
      OperationAction.Delete,
    );
    _isAccess.ok_or_throw();

    const product = (await service.tryDelete({
      where: {
        id: productId,
        status: ProductStatus.Draft,
        creator: {
          shopownerProviderId: sessionUser.isSuperuser
            ? undefined
            : sessionUser.shopownerProviderId,
        },
      },
    })).ok_or_throw();

    // Create Audit log
    const _auditLog = await service.audit(sessionUser);
    _auditLog.ok_or_throw();

    res.status(StatusCode.OK).json(
      HttpDataResponse({ product }, { meta: { id: product.id } }),
    );
  } catch (err) {
    next(err);
  }
}

export async function deleteMultiProductHandler(
  req: Request<{}, {}, DeleteMultiProductsInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { productIds } = req.body;

    const sessionUser = checkUser(req?.user).ok_or_throw();
    const _isAccess = await service.checkPermissions(
      sessionUser,
      OperationAction.Delete,
    );
    _isAccess.ok_or_throw();

    const _deleteProducts = await service.tryDeleteMany({
      where: {
        id: {
          in: productIds,
        },
        status: ProductStatus.Draft,
        creator: {
          shopownerProviderId: sessionUser.isSuperuser
            ? undefined
            : sessionUser.shopownerProviderId,
        },
      },
    });
    _deleteProducts.ok_or_throw();

    // Create Audit log
    const _auditLog = await service.audit(sessionUser);
    _auditLog.ok_or_throw();

    res.status(StatusCode.OK).json(
      HttpResponse(StatusCode.OK, "Success delete"),
    );
  } catch (err) {
    next(err);
  }
}

export async function updateProductHandler(
  req: Request<
    UpdateProductInput["params"],
    {},
    UpdateProductInput["body"]
  >,
  res: Response,
  next: NextFunction,
) {
  try {
    const { productId } = req.params;
    const {
      price,
      brandId,
      title,
      specification,
      overview,
      instockStatus,
      description,
      dealerPrice,
      marketPrice,
      priceUnit,
      categories,
      discount,
      isDiscountItem,
      status,
      quantity,
      images,
      itemCode,
    } = req.body;

    const originalProductState = (await service.tryFindUnique({
      where: {
        id: productId,
      },
      select: {
        status: true,
        creator: {
          select: {
            shopownerProviderId: true,
          },
        },
      },
    })).ok_or_throw();
    if (!originalProductState) {
      return next(
        AppError.new(
          StatusCode.NotFound,
          `Product ${productId} not found.`,
        ),
      );
    }

    const productLifeCycleState = new LifeCycleState<
      LifeCycleProductConcrate
    >({
      resource: "product",
      state: originalProductState.status,
    });
    const productState = productLifeCycleState.changeState(status);

    const sessionUser = checkUser(req?.user).ok_or_throw();
    const _isAccess = await service.checkPermissions(
      sessionUser,
      OperationAction.Update,
    );
    _isAccess.ok_or_throw();

    if (
      !sessionUser.isSuperuser && productState === ProductStatus.Published
    ) {
      return next(
        AppError.new(
          StatusCode.BadRequest,
          `You do not have permission to access this resource.`,
        ),
      );
    }

    const _deleteProductSpecifications = await service.tryUpdate({
      where: {
        id: productId,
        creator: {
          shopownerProviderId: sessionUser.isSuperuser
            ? undefined
            : sessionUser.shopownerProviderId,
        },
      },
      data: {
        specification: {
          deleteMany: {
            productId,
          },
        },
      },
    });
    _deleteProductSpecifications.ok_or_throw();

    const product = (await service.tryUpdate({
      where: { id: productId },
      data: {
        price,
        brandId,
        title,
        quantity,
        specification: {
          upsert: specification.map(spec => ({
            where: {
              name_productId: {
                name: spec.name,
                productId,
              },
            },
            create: {
              name: spec.name,
              value: spec.value,
            },
            update: {
              name: spec.name,
              value: spec.value,
            },
          })),
        },
        overview,
        instockStatus,
        description,
        dealerPrice,
        marketPrice,
        status: productState,
        discount,
        isDiscountItem,
        priceUnit,
        categories: {
          upsert: categories.map(categoryId => ({
            where: {
              categoryId_productId: {
                categoryId,
                productId,
              },
            },
            create: {
              categoryId,
            },
            update: {},
          })),
        },
        itemCode,
        images,
      },
    })).ok_or_throw();

    // Create Audit log
    const _auditLog = await service.audit(sessionUser);
    _auditLog.ok_or_throw();

    res.status(StatusCode.OK).json(
      HttpDataResponse({ product }, { meta: { id: product.id } }),
    );
  } catch (err) {
    next(err);
  }
}

// // FEAT: Upload image
// export async function uploadImagesProductHandler(
//   req: Request<GetProductInput, {}, UploadImagesProductInput>,
//   res: Response,
//   next: NextFunction
// ) {
//   try {
//     const { productId } = req.params
//     const { images } = req.body

//     const sessionUser = checkUser(req?.user).ok_or_throw()
//     const _isAccess = await service.checkPermissions(sessionUser, OperationAction.Update)
//     _isAccess.ok_or_throw()

//     const product = (await service.tryUpdate({
//       where: {
//         id: productId
//       },
//       data: {
//         images: {
//           push: images,
//         }
//       }
//     })).ok_or_throw()

//     // Create Audit log
//     const _auditLog = await service.audit(sessionUser)
//     _auditLog.ok_or_throw()

//     res.status(StatusCode.OK).json(HttpDataResponse({ product }))
//   } catch (err) {
//     next(err)
//   }
// }

// TODO: Remove
export async function likeProductByUserHandler(
  req: Request<
    LikeProductByUserInput["params"],
    {},
    LikeProductByUserInput["body"]
  >,
  res: Response,
  next: NextFunction,
) {
  try {
    const { productId } = req.params;
    const { userId } = req.body;

    const sessionUser = checkUser(req?.user).ok();
    const product = (await service.tryUpdate({
      where: { id: productId },
      data: {
        likedUsers: {
          create: {
            userId,
          },
        },
      },
    })).ok_or_throw();

    // Create Audit log
    if (sessionUser) {
      const _auditLog = await service.audit(sessionUser);
      _auditLog.ok_or_throw();
    }

    res.status(StatusCode.OK).json(
      HttpDataResponse({ product }, { meta: { id: product.id } }),
    );
  } catch (err) {
    next(err);
  }
}

export async function unLikeProductByUserHandler(
  req: Request<
    LikeProductByUserInput["params"],
    {},
    LikeProductByUserInput["body"]
  >,
  res: Response,
  next: NextFunction,
) {
  try {
    const { productId } = req.params;
    const { userId } = req.body;

    const sessionUser = checkUser(req?.user).ok();
    const _deleteFavorite = await service.tryUpdate({
      where: { id: productId },
      data: {
        likedUsers: {
          deleteMany: {
            userId,
            productId,
          },
        },
      },
    });
    _deleteFavorite.ok_or_throw();

    // Create Audit log
    if (sessionUser) {
      const _auditLog = await service.audit(sessionUser);
      _auditLog.ok_or_throw();
    }

    res.status(StatusCode.OK).json(
      HttpResponse(StatusCode.OK, "Success Unlike"),
    );
  } catch (err) {
    next(err);
  }
}
