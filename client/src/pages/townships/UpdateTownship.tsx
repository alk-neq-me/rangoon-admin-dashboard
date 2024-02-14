import { PermissionKey } from '@/context/cacheKey';
import { Suspense } from 'react';
import { Helmet } from 'react-helmet-async'
import { PageTitle } from "@/components";
import { Card, CardContent, Container, Grid, IconButton, Tooltip, Typography } from "@mui/material";
import { UpdateTownshipForm } from '@/components/content/townships/forms';
import { useNavigate } from 'react-router-dom'
import { usePermission } from "@/hooks";
import { getTownshipPermissionsFn } from '@/services/permissionsApi';

import getConfig from "@/libs/getConfig";
import ArrowBackTwoToneIcon from '@mui/icons-material/ArrowBackTwoTone';
import AppError, { AppErrorKind } from '@/libs/exceptions';
import ErrorBoundary from '@/components/ErrorBoundary';


const appName = getConfig("appName")


function UpdateTownshipWrapper() {
  const isAllowedUpdateTownship = usePermission({
    key: PermissionKey.Township,
    actions: "update",
    queryFn: getTownshipPermissionsFn
  })

  if (!isAllowedUpdateTownship) throw AppError.new(AppErrorKind.AccessDeniedError)

  return <Card>
    <CardContent>
      <UpdateTownshipForm />
    </CardContent>
  </Card>
}


export default function UpdateTownship() {
  const navigate = useNavigate()


  const handleBack = () => {
    navigate(-1)
  }


  return (
    <>
      <Helmet>
        <title>{appName} | Update township</title>
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
            <Typography variant="h3" component="h3" gutterBottom>Update a township</Typography>
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
              <Suspense>
                <UpdateTownshipWrapper />
              </Suspense>
            </ErrorBoundary>

          </Grid>
        </Grid>
      </Container>
    </>
  )
}


