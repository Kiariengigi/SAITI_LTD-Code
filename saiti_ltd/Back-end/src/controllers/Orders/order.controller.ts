import { Request, Response } from "express";
import { prisma } from "../../db.js";
import Send from "../../utils/Authentication/response.utils.js";
import { z } from "zod";

const orderStatusSchema = z.object({
    status: z.enum([
        "pending",
        "confirmed",
        "processing",
        "dispatched",
        "delivered",
        "cancelled",
        "returned",
    ]),
});

const createOrderSchema = z.object({
    items: z.array(
        z.object({
            productId: z.string().uuid("Invalid product id"),
            quantityOrdered: z.number().positive("Quantity must be greater than 0"),
        })
    ).min(1, "At least one product is required"),
    notes: z.string().trim().max(500).optional(),
});

class OrderController {
    static create = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).userId as string | undefined;
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

            const groupedBySeller = new Map<string, typeof items>();
            for (const item of items) {
                const product = productsById.get(item.productId);
                if (!product) {
                    return Send.badRequest(res, null, "One or more selected products are unavailable");
                }

                const sellerId = product.producer.userId;
                if (!groupedBySeller.has(sellerId)) {
                    groupedBySeller.set(sellerId, []);
                }
                groupedBySeller.get(sellerId)!.push(item);
            }

            const createdOrders = await prisma.$transaction(async (tx) => {
                const results: Array<{
                    id: string;
                    sellerId: string;
                    totalValue: string;
                    itemCount: number;
                }> = [];

                for (const [sellerId, sellerItems] of groupedBySeller.entries()) {
                    let total = 0;
                    for (const item of sellerItems) {
                        const product = productsById.get(item.productId)!;
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
                                    const product = productsById.get(item.productId)!;
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
        } catch (error) {
            console.error("Create order failed:", error);
            return Send.error(res, null, "Failed to create order");
        }
    };

    static updateStatus = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).userId as string | undefined;
            if (!userId) {
                return Send.unauthorized(res, null, "Unauthorized");
            }

            const rawOrderId = req.params.id;
            const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;

            if (!orderId) {
                return Send.badRequest(res, null, "Order id is required");
            }

            const validation = orderStatusSchema.safeParse(req.body);
            if (!validation.success) {
                return Send.validationErrors(res, {
                    status: validation.error.issues.map((issue) => issue.message),
                });
            }

            const order = await prisma.order.findUnique({
                where: { id: orderId },
                select: {
                    id: true,
                    sellerId: true,
                    status: true,
                    orderItems: {
                        select: {
                            productId: true,
                            quantityOrdered: true,
                        },
                    },
                },
            });

            if (!order) {
                return Send.notFound(res, null, "Order not found");
            }

            if (order.sellerId !== userId) {
                return Send.forbidden(res, null, "You can only update your own orders");
            }

            const shouldDeductStock = order.status !== "dispatched" && validation.data.status === "dispatched";
            const quantityByProduct = new Map<string, number>();
            for (const item of order.orderItems) {
                quantityByProduct.set(
                    item.productId,
                    (quantityByProduct.get(item.productId) ?? 0) + Number(item.quantityOrdered)
                );
            }

            const seller = shouldDeductStock
                ? await prisma.user.findUnique({
                    where: { id: userId },
                    select: {
                        producer: {
                            select: { id: true },
                        },
                    },
                })
                : null;

            if (shouldDeductStock && !seller?.producer) {
                return Send.badRequest(res, null, "Producer profile not found for order seller");
            }

            if (shouldDeductStock && quantityByProduct.size > 0 && seller?.producer) {
                const products = await prisma.product.findMany({
                    where: {
                        id: { in: [...quantityByProduct.keys()] },
                        producerId: seller.producer.id,
                    },
                    select: {
                        id: true,
                        currentStockLevel: true,
                    },
                });

                if (products.length !== quantityByProduct.size) {
                    return Send.badRequest(res, null, "One or more order products could not be found for stock deduction");
                }

                for (const product of products) {
                    const quantity = quantityByProduct.get(product.id) ?? 0;
                    const currentStock = Number(product.currentStockLevel);

                    if (currentStock - quantity < 0) {
                        return Send.badRequest(res, null, `Insufficient stock for product ${product.id}`);
                    }
                }
            }

            const updatedOrder = await prisma.$transaction(async (tx) => {
                if (shouldDeductStock && quantityByProduct.size > 0 && seller?.producer) {
                    const products = await tx.product.findMany({
                        where: {
                            id: { in: [...quantityByProduct.keys()] },
                            producerId: seller.producer.id,
                        },
                        select: {
                            id: true,
                            currentStockLevel: true,
                        },
                    });

                    for (const product of products) {
                        const quantity = quantityByProduct.get(product.id) ?? 0;
                        const currentStock = Number(product.currentStockLevel);
                        const nextStock = currentStock - quantity;

                        await tx.product.update({
                            where: { id: product.id },
                            data: { currentStockLevel: nextStock },
                        });

                        await tx.producerStockStore.create({
                            data: {
                                producerId: seller.producer.id,
                                productId: product.id,
                                quantityChange: -quantity,
                                reason: "sale",
                                balanceAfter: nextStock,
                            },
                        });
                    }
                }

                return tx.order.update({
                    where: { id: order.id },
                    data: { status: validation.data.status },
                    select: {
                        id: true,
                        status: true,
                        updatedAt: true,
                    },
                });
            });

            return Send.success(res, { order: updatedOrder }, "Order status updated successfully");
        } catch (error) {
            console.error("Update order status failed:", error);
            return Send.error(res, null, "Failed to update order status");
        }
    };
}

export default OrderController;
