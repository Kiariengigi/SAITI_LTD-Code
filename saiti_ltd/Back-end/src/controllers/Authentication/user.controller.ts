import Send from "../../utils/Authentication/response.utils.js"
import { prisma } from "../../db.js"
import { Request, Response } from "express";

class UserController {
    /**
     * Get the user information based on the authenticated user.
     * The userId is passed from the AuthMiddleware.
     */
    static getUser = async (req: Request, res: Response) => {        
        try {
            const userId = (req as any).userId; // Extract userId from the authenticated request

            // Fetch the user data from the database (Prisma in this case)
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    roleType: true,
                    Logo: true,
                    businessBanner: true,
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

            const companyName =
                user.producer?.companyName ||
                user.wholesaler?.companyName ||
                user.merchant?.businessName ||
                "John Doe Company";

            const location =
                user.producer?.location ||
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
                    businessBanner: user.businessBanner,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    companyName,
                    location,
                }
            });
        } catch (error) {
            console.error("Error fetching user info:", error);
            return Send.error(res, {}, "Internal server error");
        }
    };

    static getDashboardAnalytics = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).userId as string | undefined;

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
            const pendingStatuses: Array<"pending" | "confirmed" | "processing" | "dispatched"> = [
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

                currentStockValue = products.reduce(
                    (total, product) => total + Number(product.currentStockLevel) * Number(product.price),
                    0
                );
                producerCount = 1;
            } else if (user.wholesaler) {
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

                const seenProducts = new Set<string>();
                const seenProducers = new Set<string>();

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
        } catch (error) {
            console.error("Error fetching dashboard analytics:", error);
            return Send.error(res, null, "Failed to load dashboard analytics");
        }
    };

    static updateMedia = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).userId as string | undefined;

            if (!userId) {
                return Send.unauthorized(res, null, "Unauthorized");
            }

            const { Logo, businessBanner } = req.body as {
                Logo?: string;
                businessBanner?: string;
            };

            const data: Record<string, string> = {};

            if (typeof Logo === "string" && Logo.trim()) {
                data.Logo = Logo.trim();
            }

            if (typeof businessBanner === "string" && businessBanner.trim()) {
                data.businessBanner = businessBanner.trim();
            }

            if (Object.keys(data).length === 0) {
                return Send.badRequest(res, null, "No media URL provided");
            }

            const user = await prisma.user.update({
                where: { id: userId },
                data,
                select: {
                    id: true,
                    Logo: true,
                    businessBanner: true,
                },
            });

            return Send.success(res, { user }, "Profile media updated successfully");
        } catch (error) {
            console.error("Failed to update profile media:", error);
            return Send.error(res, null, "Failed to update profile media");
        }
    };

    static getCustomerAnalytics = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).userId as string | undefined;

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
            const pendingStatuses: Array<"pending" | "confirmed" | "processing" | "dispatched"> = [
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

            const customerMap = new Map<
                string,
                {
                    id: string;
                    name: string;
                    location: string;
                    lastOrderDate: Date;
                    totalProductsBought: number;
                    totalProductsBoughtWeek: number;
                    totalOrderValue: number;
                    orderCount: number;
                    pendingOrders: number;
                    deliveredOrders: number;
                    lowStockProducts: Set<string>;
                }
            >();

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
                    lowStockProducts: new Set<string>(),
                };

                existing.totalProductsBought += quantityInOrder;
                existing.totalOrderValue += orderTotalValue;
                existing.orderCount += 1;
                existing.pendingOrders += pendingStatuses.includes(order.status as (typeof pendingStatuses)[number]) ? 1 : 0;
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

            const topCustomer = customers.reduce<null | (typeof customers)[number]>((best, current) => {
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
        } catch (error) {
            console.error("Error fetching customer analytics:", error);
            return Send.error(res, null, "Failed to load customer analytics");
        }
    };

    static getInventoryAnalytics = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).userId as string | undefined;

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

            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            type InventoryStockLevel = "In Stock" | "Low Stock" | "Out of Stock";

            const deriveStockLevel = (quantity: number, reorderPoint: number): InventoryStockLevel => {
                if (quantity <= 0) {
                    return "Out of Stock";
                }

                if (quantity <= reorderPoint) {
                    return "Low Stock";
                }

                return "In Stock";
            };

            const mapInventoryItem = (
                item: {
                    id: string;
                    productName: string;
                    category: string | null;
                    unitOfMeasure: string;
                    price: number;
                    quantity: number;
                    reorderPoint: number;
                }
            ) => {
                const inventoryValue = item.quantity * item.price;

                return {
                    id: item.id,
                    productName: item.productName,
                    category: item.category ?? "Uncategorized",
                    unitOfMeasure: item.unitOfMeasure,
                    quantity: item.quantity,
                    price: item.price,
                    inventoryValue,
                    reorderPoint: item.reorderPoint,
                    stockLevel: deriveStockLevel(item.quantity, item.reorderPoint),
                };
            };

            let inventoryItems: Array<ReturnType<typeof mapInventoryItem>> = [];
            let cogs = 0;

            if (user.producer) {
                const products = await prisma.product.findMany({
                    where: { producerId: user.producer.id },
                    select: {
                        id: true,
                        productName: true,
                        category: true,
                        unitOfMeasure: true,
                        price: true,
                        currentStockLevel: true,
                        reorderPoint: true,
                    },
                    orderBy: { createdAt: "desc" },
                });

                const productIds = products.map((product) => product.id);

                if (productIds.length > 0) {
                    const soldItems = await prisma.orderItem.findMany({
                        where: {
                            productId: { in: productIds },
                            order: {
                                sellerId: userId,
                                status: "delivered",
                                createdAt: { gte: thirtyDaysAgo },
                            },
                        },
                        select: {
                            quantityOrdered: true,
                            unitPrice: true,
                        },
                    });

                    cogs = soldItems.reduce(
                        (total, item) => total + Number(item.quantityOrdered) * Number(item.unitPrice),
                        0
                    );
                }

                inventoryItems = products.map((product) =>
                    mapInventoryItem({
                        id: product.id,
                        productName: product.productName,
                        category: product.category,
                        unitOfMeasure: product.unitOfMeasure,
                        price: Number(product.price),
                        quantity: Number(product.currentStockLevel),
                        reorderPoint: Number(product.reorderPoint),
                    })
                );
            } else if (user.wholesaler) {
                const listings = await prisma.wholesalerProduct.findMany({
                    where: { wholesalerId: user.wholesaler.id },
                    select: {
                        stockLevel: true,
                        sellingPrice: true,
                        product: {
                            select: {
                                id: true,
                                productName: true,
                                category: true,
                                unitOfMeasure: true,
                                price: true,
                                reorderPoint: true,
                            },
                        },
                    },
                    orderBy: { listedAt: "desc" },
                });

                const productIds = listings.map((listing) => listing.product.id);

                if (productIds.length > 0) {
                    const soldItems = await prisma.orderItem.findMany({
                        where: {
                            productId: { in: productIds },
                            order: {
                                sellerId: userId,
                                status: "delivered",
                                createdAt: { gte: thirtyDaysAgo },
                            },
                        },
                        select: {
                            quantityOrdered: true,
                            unitPrice: true,
                        },
                    });

                    cogs = soldItems.reduce(
                        (total, item) => total + Number(item.quantityOrdered) * Number(item.unitPrice),
                        0
                    );
                }

                inventoryItems = listings.map((listing) =>
                    mapInventoryItem({
                        id: listing.product.id,
                        productName: listing.product.productName,
                        category: listing.product.category,
                        unitOfMeasure: listing.product.unitOfMeasure,
                        price: Number(listing.sellingPrice ?? listing.product.price),
                        quantity: Number(listing.stockLevel),
                        reorderPoint: Number(listing.product.reorderPoint),
                    })
                );
            }

            const totalInventoryPieces = inventoryItems.reduce((total, item) => total + item.quantity, 0);
            const inventoryValue = inventoryItems.reduce((total, item) => total + item.inventoryValue, 0);
            const averageInventoryValue = inventoryItems.length > 0 ? inventoryValue : 0;
            const inventoryHealth = averageInventoryValue > 0 ? cogs / averageInventoryValue : 0;

            const inStockCount = inventoryItems.filter((item) => item.stockLevel === "In Stock").length;
            const lowStockCount = inventoryItems.filter((item) => item.stockLevel === "Low Stock").length;
            const outOfStockCount = inventoryItems.filter((item) => item.stockLevel === "Out of Stock").length;

            return Send.success(res, {
                metrics: {
                    totalInventoryPieces,
                    inventoryValue,
                    cogs,
                    averageInventoryValue,
                    inventoryHealth,
                    inStockCount,
                    lowStockCount,
                    outOfStockCount,
                    roleType: user.roleType,
                },
                items: inventoryItems,
            });
        } catch (error) {
            console.error("Error fetching inventory analytics:", error);
            return Send.error(res, null, "Failed to load inventory analytics");
        }
    };

    static getOrderAnalytics = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).userId as string | undefined;

            if (!userId) {
                return Send.unauthorized(res, null, "Unauthorized");
            }

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    roleType: true,
                    fullName: true,
                    producer: { select: { companyName: true } },
                    wholesaler: { select: { companyName: true } },
                    merchant: { select: { businessName: true } },
                },
            });

            if (!user) {
                return Send.notFound(res, null, "User not found");
            }

            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const pendingStatuses: Array<"pending" | "confirmed" | "processing" | "dispatched"> = [
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
                            fullName: true,
                        },
                    },
                    orderItems: {
                        select: {
                            quantityOrdered: true,
                            unitPrice: true,
                            product: {
                                select: {
                                    id: true,
                                    productName: true,
                                },
                            },
                        },
                    },
                },
            });

            const normalizedOrders = orders.map((order) => {
                const products = order.orderItems.map((item) => ({
                    id: item.product.id,
                    name: item.product.productName,
                    quantity: Number(item.quantityOrdered),
                    unitPrice: Number(item.unitPrice),
                }));

                const totalPrice = Number(order.totalValue ?? 0);
                const soldByName =
                    user.producer?.companyName ||
                    user.wholesaler?.companyName ||
                    user.merchant?.businessName ||
                    user.fullName ||
                    "Unknown supplier";

                return {
                    id: order.id,
                    orderDate: order.createdAt,
                    buyerName: order.buyer.fullName,
                    soldByName,
                    products,
                    totalPrice,
                    status: order.status,
                };
            });

            const newOrdersPastWeek = normalizedOrders.filter((order) => order.orderDate >= sevenDaysAgo).length;
            const pendingOrders = normalizedOrders.filter((order) => pendingStatuses.includes(order.status as (typeof pendingStatuses)[number])).length;
            const deliveredOrdersWeek = normalizedOrders.filter((order) => order.status === "delivered" && order.orderDate >= sevenDaysAgo).length;

            return Send.success(res, {
                metrics: {
                    newOrdersPastWeek,
                    pendingOrders,
                    deliveredOrdersWeek,
                    totalOrders: normalizedOrders.length,
                    roleType: user.roleType,
                },
                orders: normalizedOrders,
            });
        } catch (error) {
            console.error("Error fetching order analytics:", error);
            return Send.error(res, null, "Failed to load order analytics");
        }
    };
}

export default UserController;