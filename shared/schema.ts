import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const performances = pgTable("performances", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull().unique(),
  eventType: text("event_type").notNull(),
  eventResults: jsonb("event_results").notNull(),
  totalScore: integer("total_score").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  label: text("label"),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").default(1), // Default user for now
  achievementType: text("achievement_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  points: integer("points").notNull(),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
  metadata: jsonb("metadata"), // Store additional achievement data
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPerformanceSchema = createInsertSchema(performances).omit({
  id: true,
  date: true,
}).extend({
  label: z.string().optional(),
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  unlockedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPerformance = z.infer<typeof insertPerformanceSchema>;
export type Performance = typeof performances.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

export type EventResult = {
  name: string;
  result: string;
  points: number;
  type: 'time' | 'measurement';
  unit: string;
  day?: number;
};

export type EventConfig = {
  name: string;
  events: Array<{
    name: string;
    type: 'time' | 'measurement';
    unit: string;
    placeholder: string;
    day?: number;
  }>;
};
