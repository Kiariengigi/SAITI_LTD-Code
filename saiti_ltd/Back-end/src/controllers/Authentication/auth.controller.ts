import Send from "../../utils/Authentication/response.utils.js"
import { prisma } from "../../db.js";
import { CookieOptions, Request, Response } from "express";
import authSchema from "../../validations/Authentication/auth.schema.js";
import bcrypt from "bcryptjs";
import { z } from "zod";
import jwt from "jsonwebtoken";
import authConfig from "../../config/Authentication/auth.config.js";

const isProduction = process.env.NODE_ENV === "production";
const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
};

class AuthController {
    static login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                fullName: true,
                passwordHash: true,
                refreshToken: true,
            },
        });
        if (!user) return Send.unauthorized(res, null, "Invalid credentials");

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash); // ← passwordHash
        if (!isPasswordValid) return Send.unauthorized(res, null, "Invalid credentials.");

        const accessToken = jwt.sign({ userId: user.id }, authConfig.secret, { expiresIn: authConfig.secret_expires_in as any });
        const refreshToken = jwt.sign({ userId: user.id }, authConfig.refresh_secret, { expiresIn: authConfig.refresh_secret_expires_in as any });

        await prisma.user.update({
            where: { email },
            data: { refreshToken } // ← needs refreshToken field in schema
        });

        res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
        res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 24 * 60 * 60 * 1000 });

        return Send.success(res, {
            id: user.id,
            fullName: user.fullName, // ← fullName not username
            email: user.email,
            accessToken
        });
    } catch (error) {
        console.error("Login Failed:", error);
        return Send.error(res, null, "Login failed.");
    }
   }
    static register = async (req: Request, res: Response) => {
    console.log("REQ BODY:", req.body)
    const { fullName, email, password, Logo } = req.body;
    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });
        if (existingUser) {
            return res.status(409).json({
                ok: false,
                message: "Email is already in use.",
                data: null,
            });
        }

        const newUser = await prisma.user.create({
            data: {
                fullName,
                email,
                passwordHash: await bcrypt.hash(password, 10),
                Logo: typeof Logo === "string" && Logo.trim().length > 0 ? Logo : "https://placehold.co/256x256/png",
                // roleType will be set during profile completion
                roleType: "merchant" // temporary default, will be updated in profile completion
            }
            ,
            select: {
                id: true,
                fullName: true,
                email: true,
                roleType: true,
            }
        });
        const accessToken = jwt.sign(
            { userId: newUser.id },
            authConfig.secret,
            { expiresIn: authConfig.secret_expires_in as any }
        );
        const refreshToken = jwt.sign(
            { userId: newUser.id },
            authConfig.refresh_secret,
            { expiresIn: authConfig.refresh_secret_expires_in as any }
        );

        // 3. Save refresh token to DB
        await prisma.user.update({
            where: { id: newUser.id },
            data: { refreshToken }
        });

        // 4. Set cookies
        res.cookie("accessToken", accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000
        });
        res.cookie("refreshToken", refreshToken, {
            ...cookieOptions,
            maxAge: 24 * 60 * 60 * 1000
        });
        
        return Send.success(res, {
            id: newUser.id,
            fullName: newUser.fullName,
            email: newUser.email,
            accessToken
        }, "User successfully registered.");
    } catch (error) {
        console.error("Registration failed:", error);
        return Send.error(res, null, "Registration failed.");
    }
}
    static logout = async (req: Request, res: Response) => {
        try {
            // 1. Get userId from the authenticated request (set by AuthMiddleware)
            const userId = (req as any).userId;
            if (!userId) {
                return Send.unauthorized(res, null, "Unauthorized");
            }

            // 2. Remove the refresh token from the database
            await prisma.user.update({
                where: { id: userId },
                data: { refreshToken: null }
            });

            // 3. Remove the access and refresh token cookies
            res.clearCookie("accessToken", cookieOptions);
            res.clearCookie("refreshToken", cookieOptions);

            // 4. Send success response after logout
            return Send.success(res, null, "Logged out successfully.");

        } catch (error) {
            console.error("Logout failed:", error);
            return Send.error(res, null, "Logout failed.");
        }
    }
    static refreshToken = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).userId;  // Get userId from the refreshTokenValidation middleware
            const refreshToken = req.cookies.refreshToken;  // Get the refresh token from cookies

            // Check if the refresh token has been revoked
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    refreshToken: true,
                }
            });

            if (!user || !user.refreshToken) {
                return Send.unauthorized(res, "Refresh token not found");
            }

            // Check if the refresh token in the database matches the one from the client
            if (user.refreshToken !== refreshToken) {
                return Send.unauthorized(res, { message: "Invalid refresh token" });
            }

            // Generate a new access token
            const newAccessToken = jwt.sign(
                { userId: user.id },
                authConfig.secret,
                { expiresIn: authConfig.secret_expires_in as any }
            );

            // Send the new access token in the response
            res.cookie("accessToken", newAccessToken, {
                ...cookieOptions,
                maxAge: 15 * 60 * 1000  // 15 minutes
            });

            return Send.success(res, { message: "Access token refreshed successfully" });

        } catch (error) {
            console.error("Refresh Token failed:", error);
            return Send.error(res, null, "Failed to refresh token");
        }
    }
}

export default AuthController;