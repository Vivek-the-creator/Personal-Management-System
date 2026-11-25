import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import calendarRoutes from "./calendar.routes";
import eventRoutes from "./event.routes";
import noteRoutes from "./note.routes";
import reminderRoutes from "./reminder.routes";
import pushRoutes from "./push.routes";
import syncRoutes from "./sync.routes";

const router = Router();

// GET /api/v1/health
router.use("/", healthRoutes);

// POST /api/v1/auth/*
router.use("/auth", authRoutes);

// /api/v1/sync/*
router.use("/sync", syncRoutes);

// /api/v1/calendars/*
router.use("/calendars", calendarRoutes);

// /api/v1/events/*
router.use("/events", eventRoutes);

// /api/v1/notes/*
router.use("/notes", noteRoutes);

// /api/v1/reminders/*
router.use("/reminders", reminderRoutes);

// /api/v1/push/*
router.use("/push", pushRoutes);

// GET  /api/v1/me
// GET  /api/v1/settings
// PUT  /api/v1/settings
router.use("/", userRoutes);

export default router;
