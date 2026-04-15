import BaseRouter, { RouteConfig } from "./router.js";
import AuthMiddleware from "../middlewares/Authentication/auth.middleware.js";
import UserController from "../controllers/Authentication/user.controller.js";
import ProfileController from "../controllers/Authentication/profile.controller.js";

class UserRoutes extends BaseRouter {
    protected routes(): RouteConfig[] {
        return [
            {
                // get user info
                method: "get",
                path: "/info", // api/user/info
                middlewares: [
                    AuthMiddleware.authenticateUser
                ],
                handler: UserController.getUser
            },
            {
                // dashboard analytics
                method: "get",
                path: "/dashboard-analytics", // api/user/dashboard-analytics
                middlewares: [
                    AuthMiddleware.authenticateUser
                ],
                handler: UserController.getDashboardAnalytics
            },
            {
                // customer analytics
                method: "get",
                path: "/customer-analytics", // api/user/customer-analytics
                middlewares: [
                    AuthMiddleware.authenticateUser
                ],
                handler: UserController.getCustomerAnalytics
            },
            {
                // inventory analytics
                method: "get",
                path: "/inventory-analytics", // api/user/inventory-analytics
                middlewares: [
                    AuthMiddleware.authenticateUser
                ],
                handler: UserController.getInventoryAnalytics
            },
            {
                // order analytics
                method: "get",
                path: "/order-analytics", // api/user/order-analytics
                middlewares: [
                    AuthMiddleware.authenticateUser
                ],
                handler: UserController.getOrderAnalytics
            },
            {
                // complete user profile (create Producer/Wholesaler/Merchant)
                method: "post",
                path: "/complete-profile", // api/user/complete-profile
                middlewares: [
                    AuthMiddleware.authenticateUser
                ],
                handler: ProfileController.completeProfile
            },
        ]
    }
}

export default new UserRoutes().router;