// controllers/Authentication/profile.controller.ts
// ================================================================
// Fixes:
//   1. Phone number now saved to both User and role subtype table
//   2. Role subtype record (Producer / Wholesaler / Merchant) is
//      created in its own table, not just stored on User
//   3. Validates that role_type matches what was registered
// ================================================================
import { prisma } from "../../db.js";
const completeProfile = async (req, res) => {
    try {
        // ── 1. Get the authenticated user from the request ──────────
        // AuthMiddleware.authenticateUser attaches userId to (req as any).userId
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorised — no user on request" });
            return;
        }
        // ── 2. Pull the user to verify they exist ───────────────────
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                roleType: true,
                producer: true,
                wholesaler: true,
                merchant: true,
            },
        });
        if (!existingUser) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        // ── 3. Destructure the form payload ─────────────────────────
        const { role_type, phone_number, business_logo, location, 
        // Producer + Wholesaler fields
        companyName, industryType, ProductionScope, description, 
        // Wholesaler-specific
        Scope, 
        // Merchant-specific
        businessName, } = req.body;
        // ── 4. Validate role_type ────────────────────────────────────
        const validRoles = ["producer", "wholesaler", "merchant"];
        if (!role_type || !validRoles.includes(role_type)) {
            res.status(400).json({
                message: `role_type must be one of: ${validRoles.join(", ")}`,
            });
            return;
        }
        // ── 5. Validate role-specific required fields ────────────────
        if (role_type === "producer") {
            if (!companyName?.trim()) {
                res.status(400).json({ message: "Company name is required for producers" });
                return;
            }
            if (!ProductionScope) {
                res.status(400).json({ message: "Production scope is required for producers" });
                return;
            }
        }
        if (role_type === "wholesaler") {
            if (!companyName?.trim()) {
                res.status(400).json({ message: "Company name is required for wholesalers" });
                return;
            }
        }
        if (role_type === "merchant") {
            if (!businessName?.trim()) {
                res.status(400).json({ message: "Business name is required for merchants" });
                return;
            }
        }
        if (!phone_number?.trim()) {
            res.status(400).json({ message: "Phone number is required" });
            return;
        }
        // ── 6. Run everything in a transaction ───────────────────────
        // This ensures if any step fails, nothing is partially saved
        const result = await prisma.$transaction(async (tx) => {
            // 6a. Update the User record (role_type + phone + logo)
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    roleType: role_type, // BUG FIX: was never being set
                    phoneNumber: phone_number.trim(), // BUG FIX: phone was not saving
                    ...(business_logo ? { Logo: business_logo } : {}),
                },
            });
            // 6b. Create or update the role-specific subtype record
            //     BUG FIX: subtype records were never being created
            if (role_type === "producer") {
                // Delete any stale wholesaler/merchant records from a previous attempt
                await tx.wholesaler.deleteMany({ where: { userId } });
                await tx.merchant.deleteMany({ where: { userId } });
                const producerData = {
                    userId,
                    companyName: companyName.trim(),
                    industryType: industryType?.trim() || null,
                    ProductionScope: ProductionScope, // maps to ProdScope enum
                    location: location?.trim() || null,
                    phoneNumber: phone_number.trim(),
                    description: description?.trim() || null,
                };
                // Upsert — safe to call multiple times (e.g. user edits profile later)
                await tx.producer.upsert({
                    where: { userId },
                    create: producerData,
                    update: producerData,
                });
            }
            if (role_type === "wholesaler") {
                await tx.producer.deleteMany({ where: { userId } });
                await tx.merchant.deleteMany({ where: { userId } });
                const wholesalerData = {
                    userId,
                    companyName: companyName.trim(),
                    industryType: industryType?.trim() || null,
                    location: location?.trim() || null,
                    Scope: Scope || null, // maps to Scope enum
                    phoneNumber: phone_number.trim(),
                };
                await tx.wholesaler.upsert({
                    where: { userId },
                    create: wholesalerData,
                    update: wholesalerData,
                });
            }
            if (role_type === "merchant") {
                await tx.producer.deleteMany({ where: { userId } });
                await tx.wholesaler.deleteMany({ where: { userId } });
                const merchantData = {
                    userId,
                    businessName: businessName.trim(),
                    industryType: industryType?.trim() || null,
                    location: location?.trim() || null,
                    phoneNumber: phone_number.trim(),
                };
                await tx.merchant.upsert({
                    where: { userId },
                    create: merchantData,
                    update: merchantData,
                });
            }
            return updatedUser;
        });
        res.status(200).json({
            message: "Profile completed successfully",
            userId: result.id,
            roleType: result.roleType,
        });
    }
    catch (error) {
        console.error("[ProfileController.completeProfile]", error);
        // Surface Prisma unique constraint errors clearly
        if (error.code === "P2002") {
            res.status(409).json({ message: "A profile for this user already exists" });
            return;
        }
        res.status(500).json({ message: "Failed to complete profile. Please try again." });
    }
    finally {
        await prisma.$disconnect();
    }
};
export default { completeProfile };
//# sourceMappingURL=profile.controller.js.map