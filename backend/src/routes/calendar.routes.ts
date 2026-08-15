import { Router } from "express";
import { z } from "zod";
import {
  archiveCalendar,
  createCalendar,
  deleteCalendar,
  duplicateCalendar,
  listCalendars,
  restoreCalendar,
  setDefaultCalendar,
  updateCalendar,
} from "../controllers/calendar.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";

const router = Router();

router.use(requireAuth);

const emojiSchema = z.string().min(1).max(8);
const colorSchema = z.string().min(2).max(32);

const createCalendarSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50),
  emoji: emojiSchema,
  color: colorSchema,
  description: z.string().trim().max(240).optional(),
  isDefault: z.boolean().optional(),
});

const updateCalendarSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50).optional(),
  emoji: emojiSchema.optional(),
  color: colorSchema.optional(),
  description: z.string().trim().max(240).optional(),
  isDefault: z.boolean().optional(),
  isVisible: z.boolean().optional(),
});

router.get("/", listCalendars);
router.post("/", validate(createCalendarSchema), createCalendar);
router.put("/:id", validate(updateCalendarSchema), updateCalendar);
router.delete("/:id", deleteCalendar);
router.post("/:id/archive", archiveCalendar);
router.post("/:id/restore", restoreCalendar);
router.post("/:id/default", setDefaultCalendar);
router.post("/:id/duplicate", duplicateCalendar);

export default router;
