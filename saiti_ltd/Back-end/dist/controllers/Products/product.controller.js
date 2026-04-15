var _a;
import { prisma } from "../../db.js";
import Send from "../../utils/Authentication/response.utils.js";
import prodSchema from "../../validations/Products/prod.schema.js";
class ProdController {
}
_a = ProdController;
ProdController.add = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return Send.unauthorized(res, null, "Unauthorized");
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { producer: true, wholesaler: true },
        });
        if (!user) {
            return Send.notFound(res, null, "User not found");
        }
        // FIX 1: role check now correctly includes wholesaler
        const isProducer = user.roleType === "producer";
        const isWholesaler = user.roleType === "wholesaler";
        const isAdmin = user.roleType === "admin";
        if (!isProducer && !isWholesaler && !isAdmin) {
            return Send.forbidden(res, null, "Only producers and wholesalers can add products");
        }
        // FIX 2: check the correct profile based on role
        if (isProducer && !user.producer) {
            return Send.badRequest(res, null, "Producer profile not found. Please complete your profile first.");
        }
        if (isWholesaler && !user.wholesaler) {
            return Send.badRequest(res, null, "Wholesaler profile not found. Please complete your profile first.");
        }
        const validation = prodSchema.CreateProductSchema.safeParse(req.body);
        if (!validation.success) {
            return Send.validationErrors(res, {
                product: validation.error.issues.map((issue) => issue.message),
            });
        }
        const data = validation.data;
        // FIX 3: route to the correct creation flow based on role
        // Producers own products directly via the products table.
        // Wholesalers list existing products (or create new ones linked to
        // themselves) via the wholesaler_products junction table.
        if (isProducer || isAdmin) {
            // ── Producer flow ─────────────────────────────────────────
            // Creates a new product record owned by this producer
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
                include: {
                    producer: { select: { companyName: true } },
                },
            });
            // Seed opening stock entry if stock > 0
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
            return res.status(201).json({
                ok: true,
                message: "Product created successfully",
                data: { product },
            });
        }
        if (isWholesaler) {
            // ── Wholesaler flow ───────────────────────────────────────
            // Wholesalers do not own products — they list them.
            // They must either:
            // 1. Link to an existing product by providing data.id, or
            // 2. Create a new product by providing data.producerId (from a producer)
            const wholesalerId = user.wholesaler.id;
            let productId;
            if (data.id) {
                // Listing a pre-existing product (e.g. sourced from a producer)
                const existing = await prisma.product.findUnique({
                    where: { id: data.id },
                });
                if (!existing) {
                    return Send.notFound(res, null, "Product not found");
                }
                productId = existing.id;
            }
            else if (data.producerId) {
                // Creating a new product entry linked to a specific producer
                const newProduct = await prisma.product.create({
                    data: {
                        producerId: data.producerId,
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
            else {
                // Neither existing product nor producer specified
                return Send.badRequest(res, null, "Wholesalers must either link to an existing product (provide 'id') or create one with a producer ('producerId')");
            }
            // Create or update the wholesaler_products listing
            const listing = await prisma.wholesalerProduct.upsert({
                where: {
                    wholesalerId_productId: { wholesalerId, productId },
                },
                create: {
                    wholesalerId,
                    productId,
                    sellingPrice: data.price,
                    stockLevel: data.currentStockLevel,
                    isActive: data.isActive,
                },
                update: {
                    sellingPrice: data.price,
                    stockLevel: data.currentStockLevel,
                    isActive: data.isActive,
                },
            });
            // Seed opening stock entry in the wholesaler stock store
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
            return res.status(201).json({
                ok: true,
                message: "Product listing created successfully",
                data: { listing },
            });
        }
    }
    catch (error) {
        console.error("Create product failed:", error);
        return Send.error(res, null, "Something went wrong. Please try again.");
    }
};
ProdController.get = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return Send.unauthorized(res, null, "Unauthorized");
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { producer: true, wholesaler: true },
        });
        if (!user) {
            return Send.notFound(res, null, "User not found");
        }
        const category = typeof req.query.category === "string" ? req.query.category : undefined;
        const isActive = typeof req.query.isActive === "string" ? req.query.isActive : undefined;
        const search = typeof req.query.search === "string" ? req.query.search : undefined;
        const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
        const pageSize = Math.max(1, parseInt(String(req.query.pageSize ?? "20"), 10) || 20);
        // ── Producer: return products they own ────────────────────────
        if (user.roleType === "producer" && user.producer) {
            const where = {
                producerId: user.producer.id,
                ...(category ? { category } : {}),
                ...(isActive !== undefined ? { isActive: isActive === "true" } : {}),
                ...(search ? { productName: { contains: search, mode: "insensitive" } } : {}),
            };
            const [products, total] = await Promise.all([
                prisma.product.findMany({
                    where,
                    orderBy: { createdAt: "desc" },
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                }),
                prisma.product.count({ where }),
            ]);
            return Send.success(res, { products, total, page, pageSize });
        }
        // ── Wholesaler: return their listed products via wholesaler_products ──
        if (user.roleType === "wholesaler" && user.wholesaler) {
            const listingWhere = {
                wholesalerId: user.wholesaler.id,
                ...(isActive !== undefined ? { isActive: isActive === "true" } : {}),
                ...(category || search
                    ? {
                        product: {
                            ...(category ? { category } : {}),
                            ...(search ? { productName: { contains: search, mode: "insensitive" } } : {}),
                        },
                    }
                    : {}),
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
            // Flatten into the same shape as producer products for the frontend
            const products = listings.map((l) => ({
                ...l.product,
                sellingPrice: l.sellingPrice,
                listingActive: l.isActive,
                listedAt: l.listedAt,
            }));
            return Send.success(res, { products, total, page, pageSize });
        }
        // Fallback: no profile yet
        return Send.success(res, { products: [], total: 0, page, pageSize });
    }
    catch (error) {
        console.error("Get products failed:", error);
        return Send.error(res, null, "Failed to fetch products");
    }
};
ProdController.remove = async (req, res) => {
    try {
        const userId = req.userId;
        const rawProductId = req.params.id;
        const productId = Array.isArray(rawProductId) ? rawProductId[0] : rawProductId;
        if (!userId) {
            return Send.unauthorized(res, null, "Unauthorized");
        }
        if (!productId) {
            return Send.badRequest(res, null, "Product id is required");
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { producer: true, wholesaler: true },
        });
        if (!user) {
            return Send.notFound(res, null, "User not found");
        }
        // Producer/Admin: deactivate owned product.
        if ((user.roleType === "producer" && user.producer) || user.roleType === "admin") {
            const product = await prisma.product.findUnique({
                where: { id: productId },
            });
            if (!product) {
                return Send.notFound(res, null, "Product not found");
            }
            if (user.roleType === "producer" && product.producerId !== user.producer.id) {
                return Send.forbidden(res, null, "You can only delete your own products");
            }
            await prisma.product.update({
                where: { id: productId },
                data: { isActive: false },
            });
            await prisma.wholesalerProduct.updateMany({
                where: { productId },
                data: { isActive: false },
            });
            return Send.success(res, null, "Product deleted successfully");
        }
        // Wholesaler: remove listing association only.
        if (user.roleType === "wholesaler" && user.wholesaler) {
            const deleted = await prisma.wholesalerProduct.deleteMany({
                where: {
                    productId,
                    wholesalerId: user.wholesaler.id,
                },
            });
            if (deleted.count === 0) {
                return Send.notFound(res, null, "Product listing not found for this wholesaler");
            }
            return Send.success(res, null, "Product listing deleted successfully");
        }
        return Send.forbidden(res, null, "You are not allowed to delete products");
    }
    catch (error) {
        console.error("Delete product failed:", error);
        return Send.error(res, null, "Failed to delete product");
    }
};
export default ProdController;
//# sourceMappingURL=product.controller.js.map