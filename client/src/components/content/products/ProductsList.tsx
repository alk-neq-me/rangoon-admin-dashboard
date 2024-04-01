import { INITIAL_PAGINATION } from "@/context/store";
import { useStore } from "@/hooks";
import {
  useCreateMultiProducts,
  useDeleteMultiProducts,
  useDeleteProduct,
  useGetProducts,
  useUpdateProduct,
} from "@/hooks/product";
import { Product, ProductStatus } from "@/services/types";
import { Card } from "@mui/material";
import { ProductsListTable } from ".";

export function ProductsList() {
  const { state: { productFilter }, dispatch } = useStore();

  // Queries
  const productsQuery = useGetProducts({
    filter: productFilter.where,
    pagination: productFilter.pagination || INITIAL_PAGINATION,
    include: {
      specification: true,
      brand: true,
      categories: {
        include: {
          category: true,
        },
      },
      salesCategory: {
        include: {
          salesCategory: true,
        },
      },
      creator: {
        include: {
          shopownerProvider: true,
        },
      },
    },
  });

  // Mutations
  const createProductsMutation = useCreateMultiProducts();
  const deleteProductMutation = useDeleteProduct();
  const deleteProductsMutation = useDeleteMultiProducts();
  const statusChangeProductMutation = useUpdateProduct();

  // Extraction
  const data = productsQuery.try_data.ok_or_throw();

  function handleCreateManyProducts(data: ArrayBuffer) {
    createProductsMutation.mutate(data);
  }

  function handleDeleteProduct(id: string) {
    deleteProductMutation.mutate(id);
  }

  function handleDeleteMultiProducts(ids: string[]) {
    deleteProductsMutation.mutate(ids);
  }

  function handleChangeStatusProduct(
    product: Product,
    status: ProductStatus,
  ) {
    dispatch({ type: "OPEN_BACKDROP" });

    statusChangeProductMutation.mutate({
      id: product.id,
      payload: {
        ...product,
        overview: product.overview || undefined,
        description: product.description || undefined,
        status,
        categories: product.categories?.map(x => x.categoryId) || [],
        dealerPrice: product.dealerPrice ?? undefined,
        marketPrice: product.marketPrice ?? undefined,
        // TODO: fix type
        // @ts-ignore
        salesCategory: product.salesCategory?.map((
          { salesCategoryId, discount },
        ) => ({
          salesCategory: salesCategoryId,
          discount,
        })),
      },
    });
  }

  return (
    <Card>
      <ProductsListTable
        isLoading={productsQuery.isLoading}
        onStatusChange={handleChangeStatusProduct}
        products={data?.results ?? []}
        count={data?.count ?? 0}
        onCreateMany={handleCreateManyProducts}
        onDelete={handleDeleteProduct}
        onMultiDelete={handleDeleteMultiProducts}
      />
    </Card>
  );
}
