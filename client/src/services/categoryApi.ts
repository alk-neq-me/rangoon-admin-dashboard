import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/components/content/categories/forms";
import { CacheResource } from "@/context/cacheKey";
import { CategoryWhereInput } from "@/context/category";
import { authApi } from "./authApi";
import { BaseApiService } from "./baseApiService";
import {
  Category,
  GenericResponse,
  HttpListResponse,
  HttpResponse,
  Pagination,
  QueryOptionArgs,
} from "./types";

export class CategoryApiService
  extends BaseApiService<CategoryWhereInput, Category>
{
  constructor(public repo: CacheResource) {
    super();
  }

  static new() {
    return new CategoryApiService(CacheResource.Category);
  }

  override async findMany(
    opt: QueryOptionArgs,
    where: {
      filter?: CategoryWhereInput["where"];
      pagination: Pagination;
      include?: CategoryWhereInput["include"];
    },
  ): Promise<HttpListResponse<Category>> {
    const url = `/${this.repo}`;
    const { filter, pagination, include } = where;

    const { data } = await authApi.get(url, {
      ...opt,
      params: {
        filter,
        pagination,
        include,
      },
    });
    return data;
  }

  override async find(
    opt: QueryOptionArgs,
    where: {
      filter: { id: string | undefined; };
      include?: CategoryWhereInput["include"];
    },
  ): Promise<GenericResponse<Category, "category"> | undefined> {
    const { filter: { id }, include } = where;
    const url = `/${this.repo}/detail/${id}`;

    if (!id) return;
    const { data } = await authApi.get(url, {
      ...opt,
      params: { include },
    });
    return data;
  }

  override async create(
    payload: CreateCategoryInput,
  ): Promise<GenericResponse<Category, "category">> {
    const url = `/${this.repo}`;

    const { data } = await authApi.post(url, payload);
    return data;
  }

  override async uploadExcel(
    buf: ArrayBuffer,
  ): Promise<HttpListResponse<Category>> {
    const url = `/${this.repo}/excel-upload`;

    const formData = new FormData();
    const blob = new Blob([buf], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    formData.append("excel", blob, `Categories_${Date.now()}.xlsx`);

    const { data } = await authApi.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return data;
  }

  override async update(
    arg: { id: string; payload: UpdateCategoryInput; },
  ): Promise<GenericResponse<Category, "category">> {
    const { id, payload } = arg;
    const url = `/${this.repo}/detail/${id}`;

    const { data } = await authApi.patch(url, payload);
    return data;
  }

  override async deleteMany(ids: string[]): Promise<HttpResponse> {
    const url = `/${this.repo}/multi`;

    const { data } = await authApi.delete(url, {
      data: { categoryIds: ids },
    });
    return data;
  }

  override async delete(
    id: string,
  ): Promise<GenericResponse<Category, "category">> {
    const url = `/${this.repo}/detail/${id}`;

    const { data } = await authApi.delete(url);
    return data;
  }
}
