import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { pushSync, pullSync } from "../controllers/sync.controller";

const router = Router();

// All sync routes require valid JWT authentication
router.use(requireAuth);

// POST /api/v1/sync/push
router.post("/push", pushSync);

// POST /api/v1/sync/pull
router.post("/pull", pullSync);

export default router;
