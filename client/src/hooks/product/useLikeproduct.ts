import AppError, { AppErrorKind } from "@/libs/exceptions";
import Result, { Err, Ok } from "@/libs/result";

import { queryClient } from "@/components";
import { CacheResource } from "@/context/cacheKey";
import { playSoundEffect } from "@/libs/playSound";
import { ProductApiService } from "@/services/productsApi";
import { useMutation } from "@tanstack/react-query";
import { useStore } from "..";

const apiService = ProductApiService.new();

export function useLikeProduct() {
  const { dispatch } = useStore();

  const mutation = useMutation({
    mutationFn: (...args: Parameters<typeof apiService.like>) => apiService.like(...args),
    onError(err: any) {
      dispatch({
        type: "OPEN_TOAST",
        payload: {
          message: `failed: ${err?.response?.data?.message || err?.message || "Unknown error"}`,
          severity: err.response.data.status === 400 ? "warning" : "error",
        },
      });
      playSoundEffect(err.response.data.status === 400 ? "denied" : "error");
    },
    onSuccess() {
      dispatch({
        type: "OPEN_TOAST",
        payload: {
          message: "Success update product.",
          severity: "success",
        },
      });
      dispatch({ type: "CLOSE_ALL_MODAL_FORM" });
      queryClient.invalidateQueries({
        queryKey: [CacheResource.Product],
      });
      playSoundEffect("success");
    },
  });

  const try_data: Result<typeof mutation.data, AppError> = !!mutation.error && mutation.isError
    ? Err(
      AppError.new((mutation.error as any).kind || AppErrorKind.ApiError, mutation.error.message),
    )
    : Ok(mutation.data);

  return {
    ...mutation,
    try_data,
  };
}
