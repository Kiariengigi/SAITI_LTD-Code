import BaseRouter from "./router.js";
import AuthMiddleware from "../middlewares/Authentication/auth.middleware.js";
import OrderController from "../controllers/Orders/order.controller.js";
class OrderRouter extends BaseRouter {
    routes() {
        return [
            {
                method: "post",
                path: "/create",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: OrderController.create,
            },
        ];
    }
}
export default new OrderRouter().router;
//# sourceMappingURL=order.router.js.map