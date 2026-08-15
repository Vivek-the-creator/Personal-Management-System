import { Router } from "express";
import { z } from "zod";
import {
  createNote,
  deleteNote,
  getNoteById,
  listNotes,
  updateNote,
} from "../controllers/note.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";

const router = Router();

router.use(requireAuth);

const createNoteSchema = z.object({
  calendarId: z.string().min(1).optional().nullable(),
  title: z.string().trim().max(150).optional().nullable(),
  content: z.string().min(1, "Content is required"),
  date: z.string().datetime({ message: "Invalid date ISO string" }),
});

const updateNoteSchema = z.object({
  calendarId: z.string().min(1).optional().nullable(),
  title: z.string().trim().max(150).optional().nullable(),
  content: z.string().min(1).optional(),
  date: z.string().datetime().optional(),
});

router.get("/", listNotes);
router.get("/:id", getNoteById);
router.post("/", validate(createNoteSchema), createNote);
router.put("/:id", validate(updateNoteSchema), updateNote);
router.delete("/:id", deleteNote);

export default router;
