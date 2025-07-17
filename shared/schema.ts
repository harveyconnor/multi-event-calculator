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
  eventType: text("event_type").notNull(),
  eventResults: jsonb("event_results").notNull(),
  totalScore: integer("total_score").notNull(),
  date: timestamp("date").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPerformanceSchema = createInsertSchema(performances).omit({
  id: true,
  date: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPerformance = z.infer<typeof insertPerformanceSchema>;
export type Performance = typeof performances.$inferSelect;

export type EventResult = {
  name: string;
  result: string;
  points: number;
  type: 'time' | 'measurement';
  unit: string;
};

export type EventConfig = {
  name: string;
  events: Array<{
    name: string;
    type: 'time' | 'measurement';
    unit: string;
    placeholder: string;
  }>;
};
