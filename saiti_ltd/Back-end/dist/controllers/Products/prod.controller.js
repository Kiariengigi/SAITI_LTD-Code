// controllers/Products/prod.controller.ts
// Full controller — add getAll to existing add/get methods
var _a;
import { prisma } from "../../db.js";
import Send from "../../utils/Authentication/response.utils.js";
import prodSchema from "../../validations/Products/prod.schema.js";
class ProdController {
}
_a = ProdController;
// ── GET /api/products/all ─────────────────────────────────────────────────
// Marketplace view — returns all active products from all producers,
// plus wholesaler listings. Used by the Products_main page.
ProdController.getAll = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return Send.unauthorized(res, null, "Unauthorized");
        const category = typeof req.query.category === "string" ? req.query.category : undefined;
        const search = typeof req.query.search === "string" ? req.query.search : undefined;
        const sortBy = typeof req.query.sortBy === "string" ? req.query.sortBy : "createdAt";
        const order = req.query.order === "asc" ? "asc" : "desc";
        const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
        const pageSize = Math.max(1, parseInt(String(req.query.pageSize ?? "20"), 10) || 20);
        const where = {
            isActive: true,
            ...(category ? { category } : {}),
            ...(search ? { productName: { contains: search, mode: "insensitive" } } : {}),
        };
        const allowedSorts = {
            createdAt: { createdAt: order },
            price: { price: order },
            name: { productName: order },
        };
        const orderBy = allowedSorts[sortBy] ?? { createdAt: "desc" };
        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                orderBy,
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    producer: {
                        select: {
                            companyName: true,
                            location: true,
                        },
                    },
                    // Include wholesaler listings so we know who stocks it
                    wholesalerProducts: {
                        where: { isActive: true },
                        select: {
                            sellingPrice: true,
                            stockLevel: true,
                            wholesaler: {
                                select: { companyName: true },
                            },
                        },
                    },
                },
            }),
            prisma.product.count({ where }),
        ]);
        // Fetch distinct categories for the filter sidebar
        const categories = await prisma.product.findMany({
            where: { isActive: true },
            select: { category: true },
            distinct: ["category"],
        });
        return Send.success(res, {
            products,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
            categories: categories
                .map((c) => c.category)
                .filter(Boolean),
        });
    }
    catch (error) {
        console.error("getAll products failed:", error);
        return Send.error(res, null, "Failed to fetch products");
    }
};
// ── GET /api/products/mine ────────────────────────────────────────────────
ProdController.get = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return Send.unauthorized(res, null, "Unauthorized");
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { producer: true, wholesaler: true },
        });
        if (!user)
            return Send.notFound(res, null, "User not found");
        const category = typeof req.query.category === "string" ? req.query.category : undefined;
        const isActive = typeof req.query.isActive === "string" ? req.query.isActive : undefined;
        const search = typeof req.query.search === "string" ? req.query.search : undefined;
        const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
        const pageSize = Math.max(1, parseInt(String(req.query.pageSize ?? "20"), 10) || 20);
        if (user.roleType === "producer" && user.producer) {
            const where = {
                producerId: user.producer.id,
                ...(category ? { category } : {}),
                ...(isActive !== undefined ? { isActive: isActive === "true" } : {}),
                ...(search ? { productName: { contains: search, mode: "insensitive" } } : {}),
            };
            const [products, total] = await Promise.all([
                prisma.product.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
                prisma.product.count({ where }),
            ]);
            return Send.success(res, { products, total, page, pageSize });
        }
        if (user.roleType === "wholesaler" && user.wholesaler) {
            const listingWhere = {
                wholesalerId: user.wholesaler.id,
                ...(isActive !== undefined ? { isActive: isActive === "true" } : {}),
                ...(category || search ? {
                    product: {
                        ...(category ? { category } : {}),
                        ...(search ? { productName: { contains: search, mode: "insensitive" } } : {}),
                    },
                } : {}),
            };
            const [listings, total] = await Promise.all([
                prisma.wholesalerProduct.findMany({
                    where: listingWhere,
                    include: { product: true },
                    orderBy: { listedAt: "desc" },
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                }),
                prisma.wholesalerProduct.count({ where: listingWhere }),
            ]);
            const products = listings.map((l) => ({
                ...l.product,
                sellingPrice: l.sellingPrice,
                listingActive: l.isActive,
                listedAt: l.listedAt,
            }));
            return Send.success(res, { products, total, page, pageSize });
        }
        return Send.success(res, { products: [], total: 0, page, pageSize });
    }
    catch (error) {
        console.error("Get products failed:", error);
        return Send.error(res, null, "Failed to fetch products");
    }
};
// ── POST /api/products/add ────────────────────────────────────────────────
ProdController.add = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return Send.unauthorized(res, null, "Unauthorized");
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { producer: true, wholesaler: true },
        });
        if (!user)
            return Send.notFound(res, null, "User not found");
        const isProducer = user.roleType === "producer";
        const isWholesaler = user.roleType === "wholesaler";
        const isAdmin = user.roleType === "admin";
        if (!isProducer && !isWholesaler && !isAdmin) {
            return Send.forbidden(res, null, "Only producers and wholesalers can add products");
        }
        if (isProducer && !user.producer) {
            return Send.badRequest(res, null, "Producer profile not found. Please complete your profile first.");
        }
        if (isWholesaler && !user.wholesaler) {
            return Send.badRequest(res, null, "Wholesaler profile not found. Please complete your profile first.");
        }
        const validation = prodSchema.CreateProductSchema.safeParse(req.body);
        if (!validation.success) {
            return Send.validationErrors(res, {
                product: validation.error.issues.map((i) => i.message),
            });
        }
        const data = validation.data;
        if (isProducer || isAdmin) {
            const producerId = user.producer.id;
            const product = await prisma.product.create({
                data: {
                    producerId,
                    productName: data.productName,
                    description: data.description ?? null,
                    category: data.category ?? null,
                    unitOfMeasure: data.unitOfMeasure,
                    price: data.price,
                    currentStockLevel: data.currentStockLevel,
                    reorderPoint: data.reorderPoint,
                    isActive: data.isActive,
                },
                include: { producer: { select: { companyName: true } } },
            });
            if (data.currentStockLevel > 0) {
                await prisma.producerStockStore.create({
                    data: {
                        producerId,
                        productId: product.id,
                        quantityChange: data.currentStockLevel,
                        reason: "initial_stock",
                        balanceAfter: data.currentStockLevel,
                    },
                });
            }
            return res.status(201).json({ ok: true, message: "Product created successfully", data: { product } });
        }
        if (isWholesaler) {
            const wholesalerId = user.wholesaler.id;
            let productId;
            if (data.id) {
                const existing = await prisma.product.findUnique({ where: { id: data.id } });
                if (!existing)
                    return Send.notFound(res, null, "Product not found");
                productId = existing.id;
            }
            else {
                const newProduct = await prisma.product.create({
                    data: {
                        producerId: data.producerId ?? null,
                        productName: data.productName,
                        description: data.description ?? null,
                        category: data.category ?? null,
                        unitOfMeasure: data.unitOfMeasure,
                        price: data.price,
                        currentStockLevel: data.currentStockLevel,
                        reorderPoint: data.reorderPoint,
                        isActive: data.isActive,
                    },
                });
                productId = newProduct.id;
            }
            const listing = await prisma.wholesalerProduct.upsert({
                where: { wholesalerId_productId: { wholesalerId, productId } },
                create: { wholesalerId, productId, sellingPrice: data.price, stockLevel: data.currentStockLevel, isActive: data.isActive },
                update: { sellingPrice: data.price, stockLevel: data.currentStockLevel, isActive: data.isActive },
            });
            if (data.currentStockLevel > 0) {
                await prisma.wholesalerStockStore.create({
                    data: {
                        wholesalerId,
                        productId,
                        quantityChange: data.currentStockLevel,
                        reason: "initial_stock",
                        balanceAfter: data.currentStockLevel,
                    },
                });
            }
            return res.status(201).json({ ok: true, message: "Product listing created successfully", data: { listing } });
        }
    }
    catch (error) {
        console.error("Create product failed:", error);
        return Send.error(res, null, "Something went wrong. Please try again.");
    }
};
export default ProdController;
//# sourceMappingURL=prod.controller.js.map