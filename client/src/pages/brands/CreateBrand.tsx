import getConfig from "@/libs/getConfig";
import { Suspense } from 'react';
import { Helmet } from 'react-helmet-async'
import { PageTitle, SuspenseLoader } from "@/components";
import { CreateBrandForm } from "@/components/content/brands/forms";
import { Card, CardContent, Container, Grid, IconButton, Tooltip, Typography } from "@mui/material";
import { useNavigate } from 'react-router-dom'
import { usePermission } from "@/hooks";
import { getBrandPermissionsFn } from "@/services/permissionsApi";

import ArrowBackTwoToneIcon from '@mui/icons-material/ArrowBackTwoTone';
import AppError, { AppErrorKind } from '@/libs/exceptions';
import ErrorBoundary from '@/components/ErrorBoundary';


const appName = getConfig("appName")


function CreateBrandWrapper() {
  const isAllowedCreateBrand = usePermission({
    key: "brand-permissions",
    actions: "create",
    queryFn: getBrandPermissionsFn
  })

  if (!isAllowedCreateBrand) throw AppError.new(AppErrorKind.AccessDeniedError)

  return <Card>
    <CardContent>
      <CreateBrandForm />
    </CardContent>
  </Card>

}


export default function CreateBrand() {
  
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <>
      <Helmet>
        <title>{appName} | Create brand</title>
        <meta name="description" content="Build a compelling product brand that resonates with your target audience. Our brand creation services help you establish a unique identity, from crafting a memorable brand name to designing a distinctive logo. Create a brand story that connects emotionally with customers, fostering loyalty and trust. Elevate your business with a strong, cohesive brand that sets you apart in the market. Start building your brand today and leave a lasting impression on your audience."></meta>
      </Helmet>

      <PageTitle>
        {/* Page Header */}
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Tooltip arrow placeholder="top" title="go back">
              <IconButton color="primary" sx={{ p: 2, mr: 2 }} onClick={handleBack}>
                <ArrowBackTwoToneIcon />
              </IconButton>
            </Tooltip>
          </Grid>

          <Grid item xs={10}>
            <Typography variant="h3" component="h3" gutterBottom>Create a new brand</Typography>
            <Typography variant="subtitle2" gutterBottom>
              Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.
            </Typography>
          </Grid>
        </Grid>
      </PageTitle>

      <Container maxWidth="lg">
        <Grid container direction="row" justifyContent="center" alignItems="stretch" spacing={3}>
          <Grid item xs={12} md={8}>

            <ErrorBoundary>
              <Suspense fallback={<SuspenseLoader />}>
                <CreateBrandWrapper />
              </Suspense>
            </ErrorBoundary>

          </Grid>
        </Grid>
      </Container>
    </>
  )
}

