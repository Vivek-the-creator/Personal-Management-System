import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { createResponse } from "../utils/response";

/**
 * Returns a middleware that validates req.body against a Zod schema.
 * On failure, returns 422 with structured field-level errors.
 * On success, replaces req.body with the parsed (and coerced) value.
 */
export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const fieldErrors = (result.error as ZodError).flatten().fieldErrors;
      res.status(422).json(
        createResponse(false, "Validation failed", undefined, JSON.stringify(fieldErrors))
      );
      return;
    }

    req.body = result.data;
    next();
  };
}
