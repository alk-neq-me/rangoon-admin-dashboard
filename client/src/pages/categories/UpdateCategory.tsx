import { Suspense } from 'react';
import { OperationAction, Resource } from '@/services/types';
import { Helmet } from 'react-helmet-async'
import { PageTitle } from "@/components";
import { Card, CardContent, Container, Grid, IconButton, Tooltip, Typography } from "@mui/material";
import { UpdateCategoryForm } from "@/components/content/categories/forms";
import { useNavigate } from 'react-router-dom'
import { usePermission } from "@/hooks";

import getConfig from "@/libs/getConfig";
import ErrorBoundary from '@/components/ErrorBoundary';
import ArrowBackTwoToneIcon from '@mui/icons-material/ArrowBackTwoTone';


const appName = getConfig("appName")


function UpdateCategoryWrapper() {
  usePermission({ action: OperationAction.Update, resource: Resource.Category }).ok_or_throw()
  
  return <Card>
    <CardContent>
      <UpdateCategoryForm />
    </CardContent>
  </Card>

}


export default function UpdateCategory() {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1)
  }


  return (
    <>
      <Helmet>
        <title>{appName} | Update categoriy</title>
        <meta name="description" content="Effortlessly refine and manage your product categories with our user-friendly category update page. Seamlessly edit category names, descriptions, and other vital information to keep your product organization precise and up-to-date. Take control of your online store's structure, make instant modifications, and ensure a seamless shopping experience for your customers. Simplify the category update process with our intuitive tools, maintaining a well-organized and user-friendly storefront. Explore the power of hassle-free category management and keep your product listings relevant and engaging."></meta>
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
            <Typography variant="h3" component="h3" gutterBottom>Update a brand</Typography>
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
                <UpdateCategoryWrapper />
              </Suspense>
            </ErrorBoundary>

          </Grid>
        </Grid>
      </Container>
    </>
  )
}
