import AppError, { AppErrorKind } from "@/libs/exceptions";
import Result, { Err, Ok } from "@/libs/result";

import { useQuery } from "@tanstack/react-query";
import { Pagination } from "@/services/types";
import { CacheKey, CacheResource } from "@/context/cacheKey";
import { RoleApiService } from "@/services/rolesApi";
import { RoleWhereInput } from "@/context/role";


const apiService = RoleApiService.new()


export function useGetRoles({
  filter,
  pagination,
  include,
}: {
  filter?: RoleWhereInput["where"],
  include?: RoleWhereInput["include"],
  pagination: Pagination,
}) {
  const query = useQuery({
    queryKey: [CacheResource.Role, { filter, pagination, include }] as CacheKey<"roles">["list"],
    queryFn: args => apiService.findMany(args, {
      filter,
      pagination,
      include
    }),
    select: data => data
  })


  const try_data: Result<typeof query.data, AppError> = !!query.error && query.isError
    ? Err(AppError.new((query.error as any).kind || AppErrorKind.ApiError, query.error.message))
    : Ok(query.data)


  return {
    ...query,
    try_data
  }
}

