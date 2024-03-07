import { useEffect, useState } from 'react';
import { useStore } from '@/hooks';
import { useGetShopowners } from '@/hooks/shopowner';
import { Autocomplete, Paper, TextField, styled } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { MuiButton } from '@/components/ui';
import { ShopownerProvider } from '@/services/types';

import CircularProgress from '@mui/material/CircularProgress';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';


const InnerPaper = styled(Paper)(() => ({
  padding: "10px"
}))


interface ShopownerInputFieldProps {
  updateField?: boolean
}

export function ShopownerInputField({ updateField = false }: ShopownerInputFieldProps) {
  const { control, setValue, getValues } = useFormContext<{ shopownerProviderId: string }>()
  const [selectedShopowner, setSelectedShopowner] = useState<ShopownerProvider | null>(null)
  const [isOpenOptions, setIsOpenOptions] = useState(false)

  const { dispatch } = useStore()

  const {
    try_data,
    isLoading,
    isError,
    error
  } = useGetShopowners({
    filter: {},
    pagination: {
      page: 1,
      pageSize: 100 * 1000
    }
  })
  const shopowners = try_data.ok()?.results

  const defaultShopownerId = getValues("shopownerProviderId")
  const defaultShopowner = defaultShopownerId
    ? shopowners?.find(shopowner => shopowner.id === defaultShopownerId)
    : undefined

  useEffect(() => {
    if (defaultShopowner && updateField) setSelectedShopowner(defaultShopowner)
  }, [defaultShopowner])


  const handleShopownerChange = (_: React.SyntheticEvent, value: ShopownerProvider | null) => {
    if (value) {
      setSelectedShopowner(value)
      setValue("shopownerProviderId", value.id)
    }
  }

  const handleOnClickCreateNew = (_: React.MouseEvent<HTMLButtonElement>) => {
    dispatch({ type: "OPEN_MODAL_FORM", payload: "create-shopowner" })
  }

  const handleOnCloseOptions = (_: React.SyntheticEvent) => new Promise(resolve => setTimeout(() => resolve(setIsOpenOptions(false)), 200))

  if (isError) return <Autocomplete
    options={[]}
    disabled
    renderInput={params => <TextField
      {...params}
      error={true}
      label="Failed shopowner autocomplete"
      fullWidth
      helperText={error?.message}
    />}
  />


  return <>
    <Controller
      name="shopownerProviderId"
      control={control}
      render={({ field, fieldState }) => (
        <Autocomplete
          {...field}
          open={isOpenOptions}
          onOpen={() => setIsOpenOptions(true)}
          onClose={handleOnCloseOptions}
          value={selectedShopowner}
          options={shopowners || []}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          getOptionLabel={option => option.name || ""}
          loading={isLoading}
          renderOption={(props, option) => (
            <li {...props} style={{ display: 'block' }}>
              {option.name}
            </li>
          )}
          PaperComponent={({ children }) => <InnerPaper>
            {children}
            <MuiButton
              fullWidth
              startIcon={<AddTwoToneIcon />}
              variant='outlined'
              onClick={handleOnClickCreateNew}
            >
              Create new
            </MuiButton>
          </InnerPaper>}
          renderInput={params => <TextField
            {...params}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            label="Shopowner"
            InputProps={{
              ...params.InputProps,
              endAdornment: <>
                {isLoading && <CircularProgress color='primary' size={20} />}
                {params.InputProps.endAdornment}
              </>
            }}
          />}
          onChange={handleShopownerChange}
        />
      )}
    />
  </>
}
