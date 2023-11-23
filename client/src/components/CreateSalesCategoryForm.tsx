import { Box, Grid, TextField } from "@mui/material";
import { MuiButton } from "./ui";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { object, string, z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useStore } from "@/hooks";
import { useLocation, useNavigate } from "react-router-dom";
import { createSalesCategoryFn } from "@/services/salesCategoryApi";
import { queryClient } from ".";

const createSalesCategorySchema = object({
  name: string({ required_error: "Sales category name is required" })
    .min(1).max(128)
})

export type CreateSalesCategoryInput = z.infer<typeof createSalesCategorySchema>

export function CreateSalesCategoryForm() {
  const { dispatch } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  // TODO: Debug
  const from = ((location.state as any)?.from.pathname as string) || "/sales-categories"

  const {
    mutate: createSalesCategory,
  } = useMutation({
    mutationFn: createSalesCategoryFn,
    onSuccess: () => {
      dispatch({ type: "OPEN_TOAST", payload: {
        message: "Success created a new sales category.",
        severity: "success"
      } })
      navigate(from)
      queryClient.invalidateQueries({
        queryKey: ["sales-categories"]
      })
    },
    onError: () => {
      dispatch({ type: "OPEN_TOAST", payload: {
        message: "failed created a new sales category.",
        severity: "error"
      } })
    },
  })

  const methods = useForm<CreateSalesCategoryInput>({
    resolver: zodResolver(createSalesCategorySchema)
  })

  const { handleSubmit, register, formState: { errors } } = methods

  const onSubmit: SubmitHandler<CreateSalesCategoryInput> = (value) => {
    createSalesCategory(value)
  }

  return (
    <FormProvider {...methods}>
      <Grid container spacing={1} component="form" onSubmit={handleSubmit(onSubmit)}>
        <Grid item md={6} xs={12}>
          <Box sx={{ '& .MuiTextField-root': { my: 1, width: '100%' } }}>
            <TextField fullWidth {...register("name")} label="Name" error={!!errors.name} helperText={!!errors.name ? errors.name.message : ""} />
          </Box>
        </Grid>

        <Grid item xs={12}>
          <MuiButton variant="contained" type="submit">Create</MuiButton>
        </Grid>
      </Grid>
    </FormProvider>
  )
}



