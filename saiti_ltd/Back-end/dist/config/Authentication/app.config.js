import * as dotenv from "dotenv";
dotenv.config();
const resolvedPort = Number(process.env.PORT ?? process.env.APP_PORT ?? 4000);
// Render requires binding to 0.0.0.0, not localhost.
const envHost = process.env.APP_HOST?.trim();
const resolvedHost = envHost && envHost.length > 0 ? envHost : "0.0.0.0";
const appConfig = {
    host: resolvedHost,
    port: Number.isFinite(resolvedPort) ? resolvedPort : 4000,
};
export default appConfig;
//# sourceMappingURL=app.config.js.map