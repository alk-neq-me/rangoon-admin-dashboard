import { PermissionKey } from '@/context/cacheKey';
import { Suspense } from 'react';
import { Helmet } from 'react-helmet-async'
import { PageTitle, SuspenseLoader } from "@/components";
import { Card, CardContent, Container, Grid, IconButton, Tooltip, Typography } from "@mui/material";
import { CreateRegionForm } from '@/components/content/regions/forms/CreateRegionForm';
import { useNavigate } from 'react-router-dom'
import { usePermission } from "@/hooks";
import { getRegionPermissionsFn } from "@/services/permissionsApi";

import getConfig from "@/libs/getConfig";
import AppError, { AppErrorKind } from '@/libs/exceptions';
import ErrorBoundary from '@/components/ErrorBoundary';
import ArrowBackTwoToneIcon from '@mui/icons-material/ArrowBackTwoTone';


const appName = getConfig("appName")

function CreateRegionWrapper() {
  const isAllowedCreateRegion = usePermission({
    key: PermissionKey.Region,
    actions: "create",
    queryFn: getRegionPermissionsFn
  })

  if (!isAllowedCreateRegion) throw AppError.new(AppErrorKind.AccessDeniedError)

  return <Card>
    <CardContent>
      <CreateRegionForm />
    </CardContent>
  </Card>
}


export default function CreateRegion() {
  
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <>
      <Helmet>
        <title>{appName} | Create Region</title>
        <meta name="description" content=""></meta>
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
            <Typography variant="h3" component="h3" gutterBottom>Create a new region</Typography>
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
                <CreateRegionWrapper />
              </Suspense>
            </ErrorBoundary>

          </Grid>
        </Grid>
      </Container>
    </>
  )
}

