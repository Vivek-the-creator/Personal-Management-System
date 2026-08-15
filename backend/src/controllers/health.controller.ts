import { Request, Response } from "express";
import { config } from "../config/env";
import { createResponse } from "../utils/response";
import { HealthCheckData } from "../types/api.types";

export function getHealth(_req: Request, res: Response): void {
  const data: HealthCheckData = {
    status: "healthy",
    version: "1.0.0",
    environment: config.env,
    uptime: Math.floor(process.uptime()),
  };
  res.status(200).json(createResponse(true, "Server is healthy", data));
}
