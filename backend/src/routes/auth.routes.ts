import { Router } from "express";
import { z } from "zod";
import { register, login, refreshToken, logout } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// POST /api/v1/auth/register – register a new user
router.post("/register", validate(registerSchema), register);

// POST /api/v1/auth/login – authenticate existing user
router.post("/login", validate(loginSchema), login);

// POST /api/v1/auth/refresh – rotate refresh token (reads httpOnly cookie)
router.post("/refresh", refreshToken);

// POST /api/v1/auth/logout – clear cookie + invalidate DB token
router.post("/logout", logout);

export default router;
