import Result, { Err, Ok } from "@/libs/result"
import AppError, { AppErrorKind } from "@/libs/exceptions"

import { CacheResource } from "@/context/cacheKey"
import { UserAddressApiService } from "@/services/userAddressApi"
import { useMutation } from "@tanstack/react-query"
import { useStore } from ".."
import { playSoundEffect } from "@/libs/playSound"
import { queryClient } from "@/components"
import { useNavigate } from "react-router-dom"


const apiService = UserAddressApiService.new()


export function useCreateUserAddress() {
  const { state: { modalForm }, dispatch } = useStore()

  const navigate = useNavigate()
  const from = "/addresses"

  const mutation = useMutation({
    mutationFn: (...args: Parameters<typeof apiService.create>) => apiService.create(...args),
    onSuccess: () => {
      dispatch({
        type: "OPEN_TOAST", payload: {
          message: "Success created a new user address.",
          severity: "success"
        }
      })
      if (modalForm.field === "*") navigate(from)
      dispatch({ type: "CLOSE_ALL_MODAL_FORM" })
      queryClient.invalidateQueries({
        queryKey: [CacheResource.UserAddress]
      })
      playSoundEffect("success")
    },
    onError: (err: any) => {
      dispatch({
        type: "OPEN_TOAST", payload: {
          message: `failed: ${err.response.data.message}`,
          severity: "error"
        }
      })
      playSoundEffect("error")
    },
  })

  const try_data: Result<typeof mutation.data, AppError> = !!mutation.error && mutation.isError
    ? Err(AppError.new((mutation.error as any).kind || AppErrorKind.ApiError, mutation.error.message))
    : Ok(mutation.data)

  return { ...mutation, try_data }
}


