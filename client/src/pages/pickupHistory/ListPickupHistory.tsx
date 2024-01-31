import { Suspense } from "react";
import { Helmet } from 'react-helmet-async'
import { PageTitle, SuspenseLoader } from "@/components"
import { Container, Grid, Typography } from "@mui/material"
import { PickupAddressList } from "@/components/content/pickupAddressHistory";
import { usePermission } from "@/hooks";
import { getPickupAddressPermissionsFn } from "@/services/permissionsApi";

import getConfig from "@/libs/getConfig";
import AppError, { AppErrorKind } from "@/libs/exceptions";
import ErrorBoundary from "@/components/ErrorBoundary";


const appName = getConfig("appName")


function ListPickupHistoryWrapper() {
  const isAllowedReadPickupAddress = usePermission({
    key: "pickup-address-permissions",
    actions: "read",
    queryFn: getPickupAddressPermissionsFn
  })

  if (!isAllowedReadPickupAddress) throw AppError.new(AppErrorKind.AccessDeniedError)

  return <PickupAddressList />
}


export default function ListPickupHistory() {

  return (
    <>
      <Helmet>
        <title>{appName} | List pickup address history</title>
        <meta name="description" content=""></meta>
      </Helmet>

      <PageTitle>
        {/* Page Header */}
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h3" component="h3" gutterBottom>Pickup address history</Typography>
            <Typography variant="subtitle2" gutterBottom>
              Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.
            </Typography>
          </Grid>
        </Grid>
      </PageTitle>

       <Container maxWidth="lg">
        <Grid container direction="row" justifyContent="center" alignItems="stretch" spacing={3}>
          <Grid item xs={12}>

            <ErrorBoundary>
              <Suspense fallback={<SuspenseLoader />}>
                <ListPickupHistoryWrapper />
              </Suspense>
            </ErrorBoundary>

          </Grid>
        </Grid>
      </Container>
    </>
  )
}
