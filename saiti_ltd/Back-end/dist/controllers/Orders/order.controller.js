var _a;
import { prisma } from "../../db.js";
import Send from "../../utils/Authentication/response.utils.js";
import { z } from "zod";
const createOrderSchema = z.object({
    items: z.array(z.object({
        productId: z.string().uuid("Invalid product id"),
        quantityOrdered: z.number().positive("Quantity must be greater than 0"),
    })).min(1, "At least one product is required"),
    notes: z.string().trim().max(500).optional(),
});
class OrderController {
}
_a = OrderController;
OrderController.create = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return Send.unauthorized(res, null, "Unauthorized");
        }
        const validation = createOrderSchema.safeParse(req.body);
        if (!validation.success) {
            return Send.validationErrors(res, {
                order: validation.error.issues.map((issue) => issue.message),
            });
        }
        const { items, notes } = validation.data;
        const productIds = [...new Set(items.map((item) => item.productId))];
        const products = await prisma.product.findMany({
            where: {
                id: { in: productIds },
                isActive: true,
            },
            select: {
                id: true,
                price: true,
                producer: {
                    select: {
                        userId: true,
                    },
                },
            },
        });
        if (products.length !== productIds.length) {
            return Send.badRequest(res, null, "One or more selected products are unavailable");
        }
        const productsById = new Map(products.map((product) => [product.id, product]));
        const groupedBySeller = new Map();
        for (const item of items) {
            const product = productsById.get(item.productId);
            if (!product) {
                return Send.badRequest(res, null, "One or more selected products are unavailable");
            }
            const sellerId = product.producer.userId;
            if (!groupedBySeller.has(sellerId)) {
                groupedBySeller.set(sellerId, []);
            }
            groupedBySeller.get(sellerId).push(item);
        }
        const createdOrders = await prisma.$transaction(async (tx) => {
            const results = [];
            for (const [sellerId, sellerItems] of groupedBySeller.entries()) {
                let total = 0;
                for (const item of sellerItems) {
                    const product = productsById.get(item.productId);
                    total += Number(product.price) * item.quantityOrdered;
                }
                const order = await tx.order.create({
                    data: {
                        userId,
                        sellerId,
                        notes: notes ?? null,
                        totalValue: total,
                        orderItems: {
                            create: sellerItems.map((item) => {
                                const product = productsById.get(item.productId);
                                return {
                                    productId: item.productId,
                                    quantityOrdered: item.quantityOrdered,
                                    unitPrice: Number(product.price),
                                    wasRecommended: false,
                                    isReorder: false,
                                };
                            }),
                        },
                    },
                    include: {
                        orderItems: true,
                    },
                });
                results.push({
                    id: order.id,
                    sellerId,
                    totalValue: String(order.totalValue ?? "0"),
                    itemCount: order.orderItems.length,
                });
            }
            return results;
        });
        return res.status(201).json({
            ok: true,
            message: createdOrders.length > 1
                ? "Orders created successfully"
                : "Order created successfully",
            data: {
                orders: createdOrders,
                orderCount: createdOrders.length,
            },
        });
    }
    catch (error) {
        console.error("Create order failed:", error);
        return Send.error(res, null, "Failed to create order");
    }
};
export default OrderController;
//# sourceMappingURL=order.controller.js.map