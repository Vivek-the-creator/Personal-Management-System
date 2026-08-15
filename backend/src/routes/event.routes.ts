import { Router } from "express";
import { z } from "zod";
import {
  createEvent,
  deleteEvent,
  getEventById,
  listEvents,
  updateEvent,
} from "../controllers/event.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";

const router = Router();

router.use(requireAuth);

const highlightStyleEnum = z.enum([
  "background",
  "outline",
  "top_accent",
  "bottom_accent",
  "left_accent",
  "dot",
]);

const priorityEnum = z.enum(["low", "medium", "high", "urgent"]);

const createEventSchema = z.object({
  calendarId: z.string().min(1, "Calendar ID is required"),
  title: z.string().trim().min(1, "Title is required").max(150),
  description: z.string().trim().max(1000).optional(),
  emoji: z.string().min(1).max(8).optional().nullable(),
  highlightColor: z
    .string()
    .regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid HEX color format")
    .optional(),
  highlightStyle: highlightStyleEnum.optional(),
  startAt: z.string().datetime({ message: "Invalid start date ISO string" }),
  endAt: z.string().datetime({ message: "Invalid end date ISO string" }),
  isAllDay: z.boolean().optional(),
  location: z.string().trim().max(250).optional(),
  priority: priorityEnum.optional(),
  recurrenceRule: z.string().trim().max(100).optional(),
  recurrenceEnd: z.string().datetime().optional().nullable(),
});

const updateEventSchema = z.object({
  calendarId: z.string().min(1).optional(),
  title: z.string().trim().min(1, "Title is required").max(150).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  emoji: z.string().min(1).max(8).optional().nullable(),
  highlightColor: z
    .string()
    .regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid HEX color format")
    .optional(),
  highlightStyle: highlightStyleEnum.optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  isAllDay: z.boolean().optional(),
  location: z.string().trim().max(250).optional().nullable(),
  priority: priorityEnum.optional(),
  recurrenceRule: z.string().trim().max(100).optional().nullable(),
  recurrenceEnd: z.string().datetime().optional().nullable(),
});

router.get("/", listEvents);
router.get("/:id", getEventById);
router.post("/", validate(createEventSchema), createEvent);
router.put("/:id", validate(updateEventSchema), updateEvent);
router.delete("/:id", deleteEvent);

export default router;
