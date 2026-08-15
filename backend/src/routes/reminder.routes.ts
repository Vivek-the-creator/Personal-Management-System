import { Router } from "express";
import { z } from "zod";
import {
  createReminder,
  deleteReminder,
  listReminders,
  updateReminder,
} from "../controllers/reminder.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";

const router = Router();

router.use(requireAuth);

const createReminderSchema = z.object({
  eventId: z.string().min(1, "eventId is required"),
  type: z.string().optional(),
  scheduledAt: z.string().datetime({ message: "scheduledAt must be ISO string" }),
  timezone: z.string().optional(),
  enabled: z.boolean().optional(),
});

const updateReminderSchema = z.object({
  type: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  timezone: z.string().optional(),
  enabled: z.boolean().optional(),
  status: z.string().optional(),
});

router.get("/", listReminders);
router.post("/", validate(createReminderSchema), createReminder);
router.put("/:id", validate(updateReminderSchema), updateReminder);
router.delete("/:id", deleteReminder);

export default router;
