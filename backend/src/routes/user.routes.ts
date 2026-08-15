import { Router } from "express";
import { z } from "zod";
import { getMe, getSettings, updateSettings } from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";

const router = Router();

// All user routes require authentication
router.use(requireAuth);

const updateSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.string().min(2).max(10).optional(),
  dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]).optional(),
  timeFormat: z.enum(["12h", "24h"]).optional(),
  weekStartsOn: z.number().int().min(0).max(6).optional(),
  notificationsEnabled: z.boolean().optional(),
});

// GET /api/v1/me
router.get("/me", getMe);

// GET /api/v1/settings
router.get("/settings", getSettings);

// PUT /api/v1/settings
router.put("/settings", validate(updateSettingsSchema), updateSettings);

export default router;
