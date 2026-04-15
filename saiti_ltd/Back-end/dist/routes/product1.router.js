import prodSchema from "../validations/Products/prod.schema.js";
import BaseRouter from "./router.js";
import ValidationMiddleware from "../middlewares/Authentication/validation.middleware.js";
import AuthMiddleware from "../middlewares/Authentication/auth.middleware.js";
import ProdController from "../controllers/Products/product.controller.js";
import ProductController from "../controllers/Products/prod.controller.js";
import InsightsController from "../controllers/Products/Insights.controller.js";
class ProdRouter extends BaseRouter {
    routes() {
        return [
            {
                //CREATE PRODUCT
                method: "post",
                path: "/add",
                middlewares: [
                    AuthMiddleware.authenticateUser,
                    ValidationMiddleware.validateBody(prodSchema.CreateProductSchema)
                ],
                handler: ProdController.add
            },
            {
                //GET PRODUCTS FOR PROFILE
                method: "get",
                path: "/getproducts",
                middlewares: [
                    AuthMiddleware.authenticateUser
                ],
                handler: ProdController.get
            },
            {
                // GET /api/products/all — all products visible to this user (marketplace)
                method: "get",
                path: "/all",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: ProductController.getAll,
            },
            {
                //DELETE PRODUCT / LISTING
                method: "delete",
                path: "/:id",
                middlewares: [
                    AuthMiddleware.authenticateUser
                ],
                handler: ProdController.remove
            },
            {
                // GET /api/products/insights — get AI insights for this user
                method: "get",
                path: "/insights",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: InsightsController.getInsights,
            },
            {
                // POST /api/products/insights — save/upsert AI insights
                method: "post",
                path: "/insights",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: InsightsController.saveInsights,
            },
        ];
    }
}
export default new ProdRouter().router;
//# sourceMappingURL=product1.router.js.map