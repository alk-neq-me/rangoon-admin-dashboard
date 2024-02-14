import { PermissionKey } from '@/context/cacheKey';
import { Suspense } from 'react';
import { Helmet } from 'react-helmet-async'
import { PageTitle, SuspenseLoader } from "@/components"
import { Container, Grid, Typography } from "@mui/material"
import { MuiButton } from "@/components/ui";
import { CouponsList } from '@/components/content/coupons';
import { useNavigate } from 'react-router-dom'
import { usePermission } from "@/hooks";
import { getCouponsPermissionsFn } from "@/services/permissionsApi";

import getConfig from "@/libs/getConfig";
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import AppError, { AppErrorKind } from '@/libs/exceptions';
import ErrorBoundary from '@/components/ErrorBoundary';


const appName = getConfig("appName")


function ListCouponWrapper() {
  const isAllowedReadCoupons = usePermission({
    key: PermissionKey.Coupon,
    actions: "read",
    queryFn: getCouponsPermissionsFn
  })

  if (!isAllowedReadCoupons) throw AppError.new(AppErrorKind.AccessDeniedError)

  return <CouponsList />
}


export default function ListCoupon() {
  const navigate = useNavigate()

  const isAllowedCreateCoupons = usePermission({
    key: PermissionKey.Coupon,
    actions: "create",
    queryFn: getCouponsPermissionsFn
  })

  const handleNavigateCreate = (_: React.MouseEvent<HTMLButtonElement>) => {
    navigate("/coupons/create")
  }


  return (
    <>
      <Helmet>
        <title>{appName} | List coupons</title>
        <meta name="description" content="Launch your own exchange effortlessly with our platform. Create a secure and customizable coupon to trade digital assets. Enjoy robust features, easy management, and a seamless user experience. Start your exchange journey now and elevate your cryptocurrency trading platform with our intuitive solutions."></meta>
      </Helmet>

      <PageTitle>
        {/* Page Header */}
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h3" component="h3" gutterBottom>Coupons List</Typography>
            <Typography variant="subtitle2" gutterBottom>
              Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.
            </Typography>
          </Grid>

          {isAllowedCreateCoupons
          ? <Grid item>
              <MuiButton
                sx={{ mt: { xs: 2, md: 0 } }}
                variant="contained"
                startIcon={<AddTwoToneIcon fontSize="small" />}
                onClick={handleNavigateCreate}
              >Create new coupon</MuiButton>
            </Grid>
          : null }
          
        </Grid>
      </PageTitle>

      <Container maxWidth="lg">
        <Grid container direction="row" justifyContent="center" alignItems="stretch" spacing={3}>
          <Grid item xs={12}>

            <ErrorBoundary>
              <Suspense fallback={<SuspenseLoader />}>
                <ListCouponWrapper />
              </Suspense>
            </ErrorBoundary>

          </Grid>
        </Grid>
      </Container>
    </>
  )
}
