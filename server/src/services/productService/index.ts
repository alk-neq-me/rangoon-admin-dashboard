import fs from "fs";
import AppError, { StatusCode } from "../../utils/appError";
import Result, { as_result_async, Err, Ok } from "../../utils/result";

import { OperationAction, ProductStatus, Resource, User } from "@prisma/client";
import { CreateMultiProductsInput } from "../../schemas/product.schema";
import { convertPrismaErrorToAppError } from "../../utils/convertPrismaErrorToAppError";
import { db } from "../../utils/db";
import { parseExcel } from "../../utils/parseExcel";
import { AppService, MetaAppService, Pagination } from "../type";

/**
 * ProductService class provides methods for managing product data.
 *
 * @remarks
 * This class implements the AppService interface and is designed to handle operations related to products.
 */
export class ProductService extends MetaAppService implements AppService {
  private repository = db.product;

  constructor() {
    super(Resource.Product, { action: OperationAction.Read, resourceIds: [] });
  }

  /**
   * Creates a new instance of ProductService.
   * @returns A new instance of ProductService.
   */
  static new() {
    return new ProductService();
  }

  async tryCount(): Promise<Result<number, AppError>> {
    const opt = as_result_async(this.repository.count);

    const result = (await opt()).map_err(convertPrismaErrorToAppError);

    this.log = {
      action: OperationAction.Read,
      resourceIds: [],
    };
    return result;
  }

  async tryFindManyWithCount(
    ...args: [{ pagination: Pagination; }, ...Parameters<typeof this.repository.findMany>]
  ): Promise<
    Result<[number, Awaited<ReturnType<typeof this.repository.findMany>>], AppError>
  > {
    const [{ pagination }, arg] = args;
    const { page = 1, pageSize = 10 } = pagination;
    const offset = (page - 1) * pageSize;

    const opt = as_result_async(this.repository.findMany);

    const count = await this.tryCount();
    if (count.is_err()) return Err(count.unwrap_err());

    const result = (await opt({ ...arg, skip: offset, take: pageSize })).map_err(convertPrismaErrorToAppError);
    if (result.is_err()) return Err(result.unwrap_err());

    this.log = {
      action: OperationAction.Read,
      resourceIds: result.ok_or_throw().map(x => x.id),
    };
    return Ok([count.ok_or_throw(), result.ok_or_throw()]);
  }

  async tryFindUnique(...args: Parameters<typeof this.repository.findUnique>): Promise<
    Result<Awaited<ReturnType<typeof this.repository.findUnique>>, AppError>
  > {
    const [arg] = args;

    const opt = as_result_async(this.repository.findUnique);

    const result = (await opt(arg)).map_err(convertPrismaErrorToAppError);

    const _res = result.ok();
    if (!_res) return Err(AppError.new(StatusCode.NotFound, `${this.resource} not found.`));

    if (_res) {
      this.log = {
        action: OperationAction.Read,
        resourceIds: [_res.id],
      };
    }
    return result;
  }

  async tryFindFirst(...args: Parameters<typeof this.repository.findFirst>): Promise<
    Result<Awaited<ReturnType<typeof this.repository.findFirst>>, AppError>
  > {
    const [arg] = args;

    const opt = as_result_async(this.repository.findFirst);

    const result = (await opt(arg)).map_err(convertPrismaErrorToAppError);

    const _res = result.ok();
    if (!_res) return Err(AppError.new(StatusCode.NotFound, `${this.resource} not found.`));

    if (_res) {
      this.log = {
        action: OperationAction.Read,
        resourceIds: [_res.id],
      };
    }
    return result;
  }

  async tryCreate(...args: Parameters<typeof this.repository.create>): Promise<
    Result<Awaited<ReturnType<typeof this.repository.create>>, AppError>
  > {
    const [arg] = args;

    const opt = as_result_async(this.repository.create);

    const result = (await opt(arg)).map_err(convertPrismaErrorToAppError);

    this.log = {
      action: OperationAction.Create,
      resourceIds: [result.ok_or_throw().id],
    };
    return result;
  }

  async tryUpdate(...args: Parameters<typeof this.repository.update>): Promise<
    Result<Awaited<ReturnType<typeof this.repository.update>>, AppError>
  > {
    const [arg] = args;

    const opt = as_result_async(this.repository.update);

    const result = (await opt(arg)).map_err(convertPrismaErrorToAppError);

    this.log = {
      action: OperationAction.Update,
      resourceIds: [result.ok_or_throw().id],
    };
    return result;
  }

  async tryDelete(...args: Parameters<typeof this.repository.delete>): Promise<
    Result<Awaited<ReturnType<typeof this.repository.delete>>, AppError>
  > {
    const [arg] = args;

    const opt = as_result_async(this.repository.delete);

    const result = (await opt(arg)).map_err(convertPrismaErrorToAppError);

    this.log = {
      action: OperationAction.Delete,
      resourceIds: [result.ok_or_throw().id],
    };
    return result;
  }

  async tryDeleteMany(...args: Parameters<typeof this.repository.deleteMany>): Promise<
    Result<Awaited<ReturnType<typeof this.repository.deleteMany>>, AppError>
  > {
    const [arg] = args;

    const opt = as_result_async(this.repository.deleteMany);

    const result = (await opt(arg)).map_err(convertPrismaErrorToAppError);

    const _res = (arg?.where?.id as any)?.in;
    if (Array.isArray(_res) && _res.length) {
      this.log = {
        action: OperationAction.Delete,
        resourceIds: _res,
      };
    }
    return result;
  }

  // Data create by uploading excel
  // Update not affected
  async tryExcelUpload(file: Express.Multer.File, uploadBy: User): Promise<
    Result<Awaited<ReturnType<typeof this.repository.upsert>>[], AppError>
  > {
    const buf = fs.readFileSync(file.path);
    const data = parseExcel(buf) as CreateMultiProductsInput;

    const opt = as_result_async(this.repository.upsert);

    const opts = async (product: CreateMultiProductsInput[number]) => {
      const sale = (product["sales.name"] && product["sales.discount"])
        ? {
          name: product["sales.name"].toString(),
          startDate: product["sales.startDate"] || new Date(),
          get endDate() {
            return product["sales.endDate"] || new Date(new Date(this.startDate).getTime() + 1000 * 60 * 60 * 24 * 5);
          }, // default: 5 days
          discount: product["sales.discount"],
          isActive: product["sales.isActive"] || true,
          description: product["sales.description"],
        }
        : null;

      const result = (await opt({
        where: {
          itemCode: product.itemCode,
          status: ProductStatus.Draft,
          creator: {
            shopownerProviderId: uploadBy.isSuperuser ? undefined : uploadBy.shopownerProviderId,
          },
        },
        create: {
          itemCode: product.itemCode,
          title: product.title,
          overview: product.overview,
          instockStatus: product.instockStatus,
          description: product.description,
          price: product.price,
          dealerPrice: product.dealerPrice,
          marketPrice: product.marketPrice,
          priceUnit: product.priceUnit,
          images: (product?.images || "")?.split("\n").filter(Boolean),
          quantity: product.quantity,
          discount: product.discount,
          isDiscountItem: product.isDiscountItem,
          brand: {
            connectOrCreate: {
              where: { name: product["brand.name"] },
              create: { name: product["brand.name"] },
            },
          },
          creator: {
            connect: {
              id: uploadBy.id,
            },
          },
          salesCategory: {
            create: sale
              ? {
                salesCategory: {
                  connectOrCreate: {
                    where: { name: sale.name },
                    create: {
                      name: sale.name,
                      startDate: sale.startDate,
                      endDate: sale.endDate,
                      isActive: sale.isActive,
                      description: sale.description,
                    },
                  },
                },
                discount: sale.discount,
              }
              : undefined,
          },
          specification: product.specification
            ? {
              createMany: {
                data: product.specification.split("\n").filter(Boolean).map(spec => ({
                  name: spec.split(": ")[0],
                  value: spec.split(": ")[1],
                })),
              },
            }
            : undefined,
          categories: {
            create: (product.categories || "").split("\n").filter(Boolean).map(name => ({
              category: {
                connectOrCreate: {
                  where: { name },
                  create: { name },
                },
              },
            })),
          },
        },
        update: {
          title: product.title,
          price: product.price,
          discount: product.discount,
          isDiscountItem: product.isDiscountItem,
          dealerPrice: product.dealerPrice,
          marketPrice: product.marketPrice,
          salesCategory: {
            create: sale
              ? {
                salesCategory: {
                  connectOrCreate: {
                    where: { name: sale.name },
                    create: {
                      name: sale.name,
                      startDate: sale.startDate,
                      endDate: sale.endDate,
                      isActive: sale.isActive,
                      description: sale.description,
                    },
                  },
                },
                discount: sale.discount,
              }
              : undefined,
          },
          updatedAt: new Date(),
        },
      })).map_err(convertPrismaErrorToAppError);
      return result.ok_or_throw();
    };

    const result = await Promise.all(data.map(opts));

    this.log = {
      action: OperationAction.Create,
      resourceIds: result.map(x => x.id),
    };
    return Ok(result);
  }
}
