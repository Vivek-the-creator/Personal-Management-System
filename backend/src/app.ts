import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { config } from "./config/env";
import { logger } from "./utils/logger";
import routes from "./routes";
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware";

const app = express();

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please try again later." },
  })
);

// ─── Parsing & Compression ────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(config.cookieSecret));

// ─── Request Logging ─────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/v1", routes);

// ─── Error Handling ──────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
