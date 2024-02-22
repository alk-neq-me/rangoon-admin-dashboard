import { Suspense } from 'react';
import { Helmet } from 'react-helmet-async'
import { PageTitle, SuspenseLoader } from "@/components";
import { CreateSalesCategoryForm } from "@/components/content/sales-categories/forms";
import { Card, CardContent, Container, Grid, IconButton, Tooltip, Typography } from "@mui/material";
import { OperationAction, Resource } from '@/services/types';
import { usePermission } from "@/hooks";
import { useNavigate } from 'react-router-dom'

import getConfig from "@/libs/getConfig";
import ErrorBoundary from '@/components/ErrorBoundary';
import ArrowBackTwoToneIcon from '@mui/icons-material/ArrowBackTwoTone';


const appName = getConfig("appName")

function CreateProductWrapper() {
  usePermission({ action: OperationAction.Create, resource: Resource.SalesCategory }).ok_or_throw()

  return  <Card>
    <CardContent>
      <CreateSalesCategoryForm />
    </CardContent>
  </Card>
}


export default function CreateProduct() {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <>
      <Helmet>
        <title>{appName} | Create sales for products</title>
        <meta name="description" content="Launch exciting seasonal sales for your products effortlessly. Create special offers, set discounts, and showcase limited-time deals. Boost your sales and engage customers with our user-friendly platform. Explore now to craft compelling seasonal promotions for your products."></meta>
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
            <Typography variant="h3" component="h3" gutterBottom>Create a new sale category</Typography>
            <Typography variant="subtitle2" gutterBottom>
              Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.
            </Typography>
          </Grid>
        </Grid>
      </PageTitle>

      <Container maxWidth="lg">
        <Grid container direction="row" justifyContent="center" alignItems="stretch" spacing={3}>
        {/*   <Grid item xs={12} md={4}> */}
        {/*     <Card> */}
        {/*       <CardContent> */}
        {/*         <UploadProductImage /> */}
        {/*       </CardContent> */}
        {/*     </Card> */}
        {/*   </Grid> */}

          <Grid item xs={12} md={8}>

            <ErrorBoundary>
              <Suspense fallback={<SuspenseLoader />}>
                <CreateProductWrapper />
              </Suspense>
            </ErrorBoundary>

          </Grid>
        </Grid>
      </Container>
    </>
  )
}
