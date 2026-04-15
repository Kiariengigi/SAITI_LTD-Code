import BaseRouter, { RouteConfig } from "./router.js";
import AuthMiddleware from "../middlewares/Authentication/auth.middleware.js";
import OrderController from "../controllers/Orders/order.controller.js";

class OrderRouter extends BaseRouter {
    protected routes(): RouteConfig[] {
        return [
            {
                method: "post",
                path: "/create",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: OrderController.create,
            },
            {
                method: "patch",
                path: "/:id/status",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: OrderController.updateStatus,
            },
        ];
    }
}

export default new OrderRouter().router;
