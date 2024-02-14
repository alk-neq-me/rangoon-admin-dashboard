import { PermissionKey } from '@/context/cacheKey';
import { Suspense } from 'react';
import { Helmet } from 'react-helmet-async'
import { PageTitle, SuspenseLoader } from "@/components"
import { Container, Grid, Typography } from "@mui/material"
import { MuiButton } from "@/components/ui";
import { PotentialOrdersList } from '@/components/content/potential-orders';
import { useNavigate } from 'react-router-dom'
import { usePermission } from "@/hooks";
import { getPotentialOrderPermissionsFn } from '@/services/permissionsApi';

import getConfig from "@/libs/getConfig";
import AppError, { AppErrorKind } from '@/libs/exceptions';
import ErrorBoundary from '@/components/ErrorBoundary';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';


const appName = getConfig("appName")

function ListPotentialOrderWrapper() {
  const isAllowedReadPotentialOrder = usePermission({
    key: PermissionKey.PotentialOrder,
    actions: "read",
    queryFn: getPotentialOrderPermissionsFn
  })

  if (!isAllowedReadPotentialOrder) throw AppError.new(AppErrorKind.AccessDeniedError)

  return <PotentialOrdersList />
}


export default function ListPotentialOrder() {
  const navigate = useNavigate()


  const isAllowedCreatPotentialOrder = usePermission({
    key: PermissionKey.PotentialOrder,
    actions: "create",
    queryFn: getPotentialOrderPermissionsFn
  })

  const handleNavigateCreate = () => {
    navigate("/potential-orders/create")
  }


  return (
    <>
      <Helmet>
        <title>{appName} | List potential orders</title>
        <meta name="description" content=""></meta>
      </Helmet>

      <PageTitle>
        {/* Page Header */}
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h3" component="h3" gutterBottom>Potential Orders List</Typography>
            <Typography variant="subtitle2" gutterBottom>
              Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.
            </Typography>
          </Grid>

          {isAllowedCreatPotentialOrder
          ? <Grid item>
              <MuiButton
                sx={{ mt: { xs: 2, md: 0 } }}
                variant="contained"
                startIcon={<AddTwoToneIcon fontSize="small" />}
                onClick={handleNavigateCreate}
              >Create new potential order</MuiButton>
            </Grid>
          : null}
          
        </Grid>
      </PageTitle>

      <Container maxWidth="lg">
        <Grid container direction="row" justifyContent="center" alignItems="stretch" spacing={3}>
          <Grid item xs={12}>

            <ErrorBoundary>
              <Suspense fallback={<SuspenseLoader />}>
                <ListPotentialOrderWrapper />
              </Suspense>
            </ErrorBoundary>

          </Grid>
        </Grid>
      </Container>
    </>
  )
}
