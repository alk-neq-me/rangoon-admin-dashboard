import { Router } from "express";
import { deserializeUser } from "../middleware/deserializeUser";
import { requiredUser } from "../middleware/requiredUser";
import { validate } from "../middleware/validate";
import { createMultiProductsHandler, createProductHandler, deleteMultiProductHandler, deleteProductHandler, deleteProductSaleCategoryHandler, getProductHandler, getProductsHandler, likeProductByUserHandler, unLikeProductByUserHandler, updateProductHandler, updateProductSalesCategoryHandler, uploadImagesProductHandler } from "../controllers/product.controller";
import { createProductSchema, deleteMultiProductsSchema, getProductSaleCategorySchema, getProductSchema, likeProductByUserSchema, updateProductSchema, uploadImagesProductSchema } from "../schemas/product.schema";
import { resizeProductImages, uploadProductImage } from "../upload/multiUpload";
import { uploadExcel } from "../upload/excelUpload";
import { createSaleCategoryForProductHandler, getSalesCategoriesInProductHandler } from "../controllers/salesCategory.controller";
import { createProductSalesCategorySchema, updateProductSaleCategorySchema } from "../schemas/salesCategory.schema";
import { checkBlockedUser } from "../middleware/checkBlockedUser";


const router = Router()


router.route("")
  .get(
    getProductsHandler
  )
  .post(
    deserializeUser, 
    requiredUser, 
    checkBlockedUser,
    validate(createProductSchema), 
    createProductHandler
  )


router.route("/multi")
  .delete(
    deserializeUser,
    requiredUser,
    checkBlockedUser,
    validate(deleteMultiProductsSchema),
    deleteMultiProductHandler,
  )


// Upload Routes
router.post("/excel-upload",
  deserializeUser,
  requiredUser,
  checkBlockedUser,
  uploadExcel,
  createMultiProductsHandler,
)


router.route("/detail/:productId")
  .get(
    validate(getProductSchema), 
    getProductHandler
  )
  .delete(
    deserializeUser, 
    requiredUser, 
    checkBlockedUser,
    validate(getProductSchema), 
    deleteProductHandler
  )
  .patch(
    deserializeUser, 
    requiredUser, 
    checkBlockedUser,
    validate(updateProductSchema), 
    updateProductHandler
  )


router.route("/detail/:productId/sales")
  .get(
    getSalesCategoriesInProductHandler
  )
  .post(
    deserializeUser, 
    requiredUser, 
    checkBlockedUser,
    validate(createProductSalesCategorySchema),
    createSaleCategoryForProductHandler
  )


router.route("/detail/:productId/sales/detail/:productSaleCategoryId")
  // .get(
  //   validate(getProductSchema), 
  //   getProductHandler
  // )
  .delete(
    deserializeUser, 
    requiredUser, 
    checkBlockedUser,
    validate(getProductSaleCategorySchema), 
    deleteProductSaleCategoryHandler
  )
  .patch(
    deserializeUser, 
    requiredUser, 
    checkBlockedUser,
    validate(updateProductSaleCategorySchema), 
    updateProductSalesCategoryHandler
  )


router.route("/like/:productId")
  .patch(
    deserializeUser, 
    requiredUser, 
    checkBlockedUser,
    // permissionUser("update", productPermission),   /* Should not access update permission!! */
    validate(likeProductByUserSchema), 
    likeProductByUserHandler
  )


router.route("/unlike/:productId")
  .patch(
    deserializeUser, 
    requiredUser, 
    checkBlockedUser,
    // permissionUser("update", productPermission),   /* Should not access update permission!! */
    validate(likeProductByUserSchema), 
    unLikeProductByUserHandler
  )


router.route("/upload/:productId")
  .post(
    deserializeUser, 
    requiredUser, 
    checkBlockedUser,
    uploadProductImage,
    resizeProductImages,
    validate(getProductSchema),
    validate(uploadImagesProductSchema),
    uploadImagesProductHandler
  )


export default router
