import express, { Express } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/auth.router.js";
import appConfig from "./config/Authentication/app.config.js";
import userRoutes from "./routes/user.router.js";
import product1Router from "@routes/product1.router.js";
import orderRouter from "./routes/order.router.js";

class App {
    private app: Express;

    constructor() {
        this.app = express()

        this.initMiddlewares();
        this.initRoutes();
    }

    private initMiddlewares() {
        this.app.use(express.json());
        this.app.use(cookieParser());
        this.app.use(cors({
            origin: [
                'https://saiti-ltd.vercel.app', 
                'http://localhost:5173',
                'http://localhost:5174',
                'http://localhost:5175',
                'http://localhost:5176',
                'http://localhost:5177',
                'http://127.0.0.1:5173',
                'http://127.0.0.1:5174',
                'http://127.0.0.1:5175',
                'http://127.0.0.1:5176',
                'http://127.0.0.1:5177'
            ],
            methods: ["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"],
            credentials: true
        }))
    }

    private initRoutes() {
        // /api/auth/*
        this.app.use("/api/auth", authRoutes);
        // /api/user/*
        this.app.use("/api/user", userRoutes);
        // /api/products/*
        this.app.use("/api/products", product1Router)
        // /api/orders/*
        this.app.use("/api/orders", orderRouter)
    }

    public start() {
        const { port, host } = appConfig;

        this.app.listen(port, host, () => {
            console.log(`server is running on http://${host}:${port}`);

        })
        this.app.get("/ping", (req, res) => {
            res.send("EXPRESS ALIVE");
        });
    }
}

export default App;