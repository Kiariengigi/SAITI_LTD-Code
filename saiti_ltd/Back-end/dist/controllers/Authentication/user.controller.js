var _a;
import Send from "../../utils/Authentication/response.utils.js";
import { prisma } from "../../db.js";
class UserController {
}
_a = UserController;
/**
 * Get the user information based on the authenticated user.
 * The userId is passed from the AuthMiddleware.
 */
UserController.getUser = async (req, res) => {
    try {
        const userId = req.userId; // Extract userId from the authenticated request
        // Fetch the user data from the database (Prisma in this case)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                email: true,
                roleType: true,
                Logo: true,
                createdAt: true,
                updatedAt: true,
                producer: {
                    select: {
                        companyName: true,
                        location: true,
                    }
                },
                wholesaler: {
                    select: {
                        companyName: true,
                        location: true,
                    }
                },
                merchant: {
                    select: {
                        businessName: true,
                        location: true,
                    }
                },
            }
        });
        // If the user is not found, return a 404 error
        if (!user) {
            return Send.notFound(res, {}, "User not found");
        }
        const companyName = user.producer?.companyName ||
            user.wholesaler?.companyName ||
            user.merchant?.businessName ||
            "John Doe Company";
        const location = user.producer?.location ||
            user.wholesaler?.location ||
            user.merchant?.location ||
            "Location not set";
        // Return the user data in the response
        return Send.success(res, {
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                roleType: user.roleType,
                Logo: user.Logo,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                companyName,
                location,
            }
        });
    }
    catch (error) {
        console.error("Error fetching user info:", error);
        return Send.error(res, {}, "Internal server error");
    }
};
UserController.getDashboardAnalytics = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return Send.unauthorized(res, null, "Unauthorized");
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                roleType: true,
                producer: { select: { id: true } },
                wholesaler: { select: { id: true } },
            },
        });
        if (!user) {
            return Send.notFound(res, null, "User not found");
        }
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const pendingStatuses = [
            "pending",
            "confirmed",
            "processing",
            "dispatched",
        ];
        const [ordersPastWeek, pendingOrders, deliveredOrders, customers] = await Promise.all([
            prisma.order.count({
                where: {
                    sellerId: userId,
                    createdAt: { gte: sevenDaysAgo },
                },
            }),
            prisma.order.count({
                where: {
                    sellerId: userId,
                    status: { in: pendingStatuses },
                },
            }),
            prisma.order.count({
                where: {
                    sellerId: userId,
                    status: "delivered",
                },
            }),
            prisma.order.groupBy({
                by: ["userId"],
                where: { sellerId: userId },
                _count: { userId: true },
            }),
        ]);
        let currentStockValue = 0;
        let producerCount = 0;
        if (user.producer) {
            const products = await prisma.product.findMany({
                where: { producerId: user.producer.id },
                select: {
                    currentStockLevel: true,
                    price: true,
                },
            });
            currentStockValue = products.reduce((total, product) => total + Number(product.currentStockLevel) * Number(product.price), 0);
            producerCount = 1;
        }
        else if (user.wholesaler) {
            const stockEntries = await prisma.wholesalerStockStore.findMany({
                where: { wholesalerId: user.wholesaler.id },
                orderBy: { recordedAt: "desc" },
                select: {
                    productId: true,
                    balanceAfter: true,
                    product: {
                        select: {
                            price: true,
                            producerId: true,
                        },
                    },
                },
            });
            const seenProducts = new Set();
            const seenProducers = new Set();
            for (const entry of stockEntries) {
                if (seenProducts.has(entry.productId)) {
                    continue;
                }
                seenProducts.add(entry.productId);
                seenProducers.add(entry.product.producerId);
                currentStockValue += Number(entry.balanceAfter) * Number(entry.product.price);
            }
            producerCount = seenProducers.size;
        }
        const totalActiveOrders = pendingOrders + deliveredOrders;
        const efficiencyScore = totalActiveOrders > 0
            ? Math.round((deliveredOrders / totalActiveOrders) * 100)
            : 0;
        return Send.success(res, {
            metrics: {
                ordersPastWeek,
                currentStockValue,
                customerCount: customers.length,
                producerCount,
                pendingOrders,
                deliveredOrders,
                efficiencyScore,
                roleType: user.roleType,
            },
        });
    }
    catch (error) {
        console.error("Error fetching dashboard analytics:", error);
        return Send.error(res, null, "Failed to load dashboard analytics");
    }
};
UserController.getCustomerAnalytics = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return Send.unauthorized(res, null, "Unauthorized");
        }
        const seller = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                roleType: true,
            },
        });
        if (!seller) {
            return Send.notFound(res, null, "User not found");
        }
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const pendingStatuses = [
            "pending",
            "confirmed",
            "processing",
            "dispatched",
        ];
        const orders = await prisma.order.findMany({
            where: { sellerId: userId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                createdAt: true,
                totalValue: true,
                status: true,
                buyer: {
                    select: {
                        id: true,
                        fullName: true,
                        producer: { select: { location: true } },
                        wholesaler: { select: { location: true } },
                        merchant: { select: { location: true } },
                    },
                },
                orderItems: {
                    select: {
                        quantityOrdered: true,
                        product: {
                            select: {
                                id: true,
                                productName: true,
                                currentStockLevel: true,
                                reorderPoint: true,
                            },
                        },
                    },
                },
            },
        });
        const customerMap = new Map();
        let totalProductsBoughtWeek = 0;
        let totalProfitReceived = 0;
        let totalOrderValue = 0;
        for (const order of orders) {
            const buyer = order.buyer;
            const location = buyer.producer?.location || buyer.wholesaler?.location || buyer.merchant?.location || "Location not set";
            const orderTotalValue = Number(order.totalValue ?? 0);
            const quantityInOrder = order.orderItems.reduce((sum, item) => sum + Number(item.quantityOrdered), 0);
            totalOrderValue += orderTotalValue;
            if (order.status === "delivered") {
                totalProfitReceived += orderTotalValue;
            }
            const existing = customerMap.get(buyer.id) ?? {
                id: buyer.id,
                name: buyer.fullName,
                location,
                lastOrderDate: order.createdAt,
                totalProductsBought: 0,
                totalProductsBoughtWeek: 0,
                totalOrderValue: 0,
                orderCount: 0,
                pendingOrders: 0,
                deliveredOrders: 0,
                lowStockProducts: new Set(),
            };
            existing.totalProductsBought += quantityInOrder;
            existing.totalOrderValue += orderTotalValue;
            existing.orderCount += 1;
            existing.pendingOrders += pendingStatuses.includes(order.status) ? 1 : 0;
            existing.deliveredOrders += order.status === "delivered" ? 1 : 0;
            if (order.createdAt >= sevenDaysAgo) {
                existing.totalProductsBoughtWeek += quantityInOrder;
                totalProductsBoughtWeek += quantityInOrder;
            }
            if (order.createdAt > existing.lastOrderDate) {
                existing.lastOrderDate = order.createdAt;
            }
            for (const item of order.orderItems) {
                const product = item.product;
                if (Number(product.currentStockLevel) <= Number(product.reorderPoint)) {
                    existing.lowStockProducts.add(product.id);
                }
            }
            customerMap.set(buyer.id, existing);
        }
        const customers = Array.from(customerMap.values())
            .sort((a, b) => b.lastOrderDate.getTime() - a.lastOrderDate.getTime())
            .map((customer) => ({
            id: customer.id,
            name: customer.name,
            location: customer.location,
            lastOrderDate: customer.lastOrderDate,
            totalProductsBought: customer.totalProductsBought,
            totalProductsBoughtWeek: customer.totalProductsBoughtWeek,
            totalOrderValue: customer.totalOrderValue,
            orderCount: customer.orderCount,
            hasLowStockProducts: customer.lowStockProducts.size > 0,
            lowStockProductsCount: customer.lowStockProducts.size,
        }));
        const topCustomer = customers.reduce((best, current) => {
            if (!best) {
                return current;
            }
            if (current.totalProductsBought > best.totalProductsBought) {
                return current;
            }
            if (current.totalProductsBought === best.totalProductsBought && current.totalOrderValue > best.totalOrderValue) {
                return current;
            }
            return best;
        }, null);
        const averageOrderValue = orders.length > 0 ? totalOrderValue / orders.length : 0;
        return Send.success(res, {
            metrics: {
                totalProductsBoughtWeek,
                profitReceived: totalProfitReceived,
                averageOrderValue,
                customerCount: customers.length,
                topCustomer: topCustomer
                    ? {
                        id: topCustomer.id,
                        name: topCustomer.name,
                        totalProductsBought: topCustomer.totalProductsBought,
                        totalOrderValue: topCustomer.totalOrderValue,
                    }
                    : null,
                roleType: seller.roleType,
            },
            customers,
        });
    }
    catch (error) {
        console.error("Error fetching customer analytics:", error);
        return Send.error(res, null, "Failed to load customer analytics");
    }
};
export default UserController;
//# sourceMappingURL=user.controller.js.map