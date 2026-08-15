import { Router } from "express";
import { z } from "zod";
import {
  getPushStatus,
  sendTestPush,
  subscribePush,
  unsubscribePush,
} from "../controllers/push.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";

const router = Router();

router.use(requireAuth);

const subscribeSchema = z.object({
  endpoint: z.string().url("Invalid push endpoint URL"),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  userAgent: z.string().optional(),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().min(1),
});

router.get("/status", getPushStatus);
router.post("/subscribe", validate(subscribeSchema), subscribePush);
router.delete("/subscribe", validate(unsubscribeSchema), unsubscribePush);
router.post("/test", sendTestPush);

export default router;
