import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPerformanceSchema, insertAchievementSchema } from "@shared/schema";
import { achievementService } from "./services/achievementService";
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

  // Update performance by UUID
  app.put("/api/performances/:uuid", async (req, res) => {
    try {
      const uuid = req.params.uuid;
      const validatedData = insertPerformanceSchema.parse(req.body);
      const updated = await storage.updatePerformanceByUuid(uuid, validatedData);
      
      if (!updated) {
        return res.status(404).json({ message: "Performance not found" });
      }
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid performance data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update performance" });
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

  // Get all achievements
  app.get("/api/achievements", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const achievements = await storage.getAchievements(userId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Create new achievement
  app.post("/api/achievements", async (req, res) => {
    try {
      const validatedData = insertAchievementSchema.parse(req.body);
      const achievement = await storage.createAchievement(validatedData);
      res.status(201).json(achievement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid achievement data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create achievement" });
    }
  });

  // Check if user has specific achievement
  app.get("/api/achievements/check/:userId/:achievementType", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const achievementType = req.params.achievementType;
      const hasAchievement = await storage.hasAchievement(userId, achievementType);
      res.json({ hasAchievement });
    } catch (error) {
      res.status(500).json({ message: "Failed to check achievement" });
    }
  });

  // Check for new achievements after performance save
  app.post("/api/achievements/check", async (req, res) => {
    try {
      const { userId, performance } = req.body;
      const newAchievements = await achievementService.checkAndUnlockAchievements(userId, performance);
      res.json(newAchievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to check achievements" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
