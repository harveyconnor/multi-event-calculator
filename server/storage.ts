import { users, performances, type User, type InsertUser, type Performance, type InsertPerformance } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createPerformance(performance: InsertPerformance): Promise<Performance>;
  getPerformances(eventType?: string): Promise<Performance[]>;
  deletePerformance(id: number): Promise<boolean>;
  getPerformance(id: number): Promise<Performance | undefined>;
  updatePerformance(id: number, performance: InsertPerformance): Promise<Performance | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private performances: Map<number, Performance>;
  private currentUserId: number;
  private currentPerformanceId: number;

  constructor() {
    this.users = new Map();
    this.performances = new Map();
    this.currentUserId = 1;
    this.currentPerformanceId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createPerformance(insertPerformance: InsertPerformance): Promise<Performance> {
    const id = this.currentPerformanceId++;
    const performance: Performance = {
      ...insertPerformance,
      id,
      date: new Date(),
    };
    this.performances.set(id, performance);
    return performance;
  }

  async getPerformances(eventType?: string): Promise<Performance[]> {
    const allPerformances = Array.from(this.performances.values());
    if (eventType && eventType !== 'all') {
      return allPerformances.filter(p => p.eventType === eventType);
    }
    return allPerformances.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async deletePerformance(id: number): Promise<boolean> {
    return this.performances.delete(id);
  }

  async getPerformance(id: number): Promise<Performance | undefined> {
    return this.performances.get(id);
  }

  async updatePerformance(id: number, insertPerformance: InsertPerformance): Promise<Performance | undefined> {
    const existing = this.performances.get(id);
    if (!existing) {
      return undefined;
    }
    
    const updated: Performance = {
      ...insertPerformance,
      id,
      date: existing.date, // Keep original date
    };
    this.performances.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
