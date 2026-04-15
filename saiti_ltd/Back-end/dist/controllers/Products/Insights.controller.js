var _a;
import { prisma } from "../../db.js";
import Send from "../../utils/Authentication/response.utils.js";
class InsightsController {
}
_a = InsightsController;
// ── GET /api/products/insights ────────────────────────────────
// Returns all non-expired insights for the authenticated user.
// The frontend AI_Insights component reads from this endpoint.
InsightsController.getInsights = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return Send.unauthorized(res, null, "Unauthorized");
        const productId = typeof req.query.productId === "string" ? req.query.productId : undefined;
        const insightType = typeof req.query.insightType === "string" ? req.query.insightType : undefined;
        const severity = typeof req.query.severity === "string" ? req.query.severity : undefined;
        const insights = await prisma.insightsCache.findMany({
            where: {
                userId,
                // Only return non-expired insights
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ],
                ...(productId ? { productId } : {}),
                ...(insightType ? { insightType: insightType } : {}),
                ...(severity ? { severity: severity } : {}),
            },
            include: {
                product: {
                    select: {
                        productName: true,
                        category: true,
                        currentStockLevel: true,
                        reorderPoint: true,
                        price: true,
                        unitOfMeasure: true,
                        producer: {
                            select: { companyName: true },
                        },
                    },
                },
            },
            orderBy: [
                // Critical first, then high, medium, low
                { severity: "desc" },
                { generatedAt: "desc" },
            ],
        });
        // Build the summary the AI_Insights component needs
        const summary = {
            totalInsights: insights.length,
            criticalCount: insights.filter((i) => i.severity === "critical").length,
            highCount: insights.filter((i) => i.severity === "high").length,
            stockoutWarnings: insights.filter((i) => i.insightType === "stockout_warning"),
            demandForecasts: insights.filter((i) => i.insightType === "demand_forecast"),
            reorderSuggestions: insights.filter((i) => i.insightType === "reorder_recommendation"),
        };
        return Send.success(res, { insights, summary });
    }
    catch (error) {
        console.error("getInsights failed:", error);
        return Send.error(res, null, "Failed to fetch insights");
    }
};
// ── POST /api/products/insights ───────────────────────────────
// Saves one or more insights. Uses upsert so duplicate insight
// types for the same user+product just update, not duplicate.
// Called by your Python ML model after running inference, OR
// by the Groq LLM layer after generating recommendations.
InsightsController.saveInsights = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return Send.unauthorized(res, null, "Unauthorized");
        // Accept either a single insight or an array
        const raw = req.body;
        const payloads = Array.isArray(raw) ? raw : [raw];
        if (payloads.length === 0) {
            return Send.badRequest(res, null, "No insight data provided");
        }
        // Validate each payload has the minimum required fields
        for (const p of payloads) {
            if (!p.productId)
                return Send.badRequest(res, null, "productId is required for each insight");
            if (!p.insightType)
                return Send.badRequest(res, null, "insightType is required for each insight");
            if (!p.insightText)
                return Send.badRequest(res, null, "insightText is required for each insight");
        }
        // Verify all products exist
        const productIds = [...new Set(payloads.map((p) => p.productId))];
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true },
        });
        const foundIds = new Set(products.map((p) => p.id));
        const missing = productIds.filter((id) => !foundIds.has(id));
        if (missing.length > 0) {
            return Send.notFound(res, null, `Products not found: ${missing.join(", ")}`);
        }
        // Default TTL: insights expire in 4 hours
        const DEFAULT_TTL_MS = 4 * 60 * 60 * 1000;
        // Upsert each insight — one row per userId × productId × insightType
        const upserted = await Promise.all(payloads.map((p) => {
            const expiresAt = p.expiresAt
                ? new Date(p.expiresAt)
                : new Date(Date.now() + DEFAULT_TTL_MS);
            const data = {
                insightText: p.insightText,
                forecastValue: p.forecastValue ?? null,
                confidence: p.confidence ?? null,
                severity: (p.severity ?? "medium"),
                expiresAt,
                generatedAt: new Date(),
            };
            return prisma.insightsCache.upsert({
                where: {
                    userId_productId_insightType: {
                        userId,
                        productId: p.productId,
                        insightType: p.insightType,
                    },
                },
                create: {
                    userId,
                    productId: p.productId,
                    insightType: p.insightType,
                    ...data,
                },
                update: data,
                include: {
                    product: {
                        select: { productName: true },
                    },
                },
            });
        }));
        return res.status(201).json({
            ok: true,
            message: `${upserted.length} insight(s) saved successfully`,
            data: { insights: upserted },
        });
    }
    catch (error) {
        console.error("saveInsights failed:", error);
        return Send.error(res, null, "Failed to save insights");
    }
};
export default InsightsController;
//# sourceMappingURL=Insights.controller.js.map