import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPerformanceSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all performances with optional event type filter
  app.get("/api/performances", async (req, res) => {
    try {
      const eventType = req.query.eventType as string;
      const performances = await storage.getPerformances(eventType);
      res.json(performances);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch performances" });
    }
  });

  // Get single performance by ID
  app.get("/api/performances/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const performance = await storage.getPerformance(id);
      
      if (!performance) {
        return res.status(404).json({ message: "Performance not found" });
      }
      
      res.json(performance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch performance" });
    }
  });

  // Create new performance
  app.post("/api/performances", async (req, res) => {
    try {
      const validatedData = insertPerformanceSchema.parse(req.body);
      const performance = await storage.createPerformance(validatedData);
      res.status(201).json(performance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid performance data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create performance" });
    }
  });

  // Delete performance
  app.delete("/api/performances/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePerformance(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Performance not found" });
      }
      
      res.json({ message: "Performance deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete performance" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
