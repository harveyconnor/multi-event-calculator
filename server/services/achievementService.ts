import { storage } from "../storage";
import { type Performance, type Achievement, type InsertAchievement } from "@shared/schema";

export type AchievementType = 
  | "first_performance"
  | "score_milestone_5000"
  | "score_milestone_6000"
  | "score_milestone_7000"
  | "score_milestone_8000"
  | "event_specialist"
  | "multi_event_master"
  | "consistency_champion"
  | "improvement_streak"
  | "perfect_ten";

export interface AchievementDefinition {
  type: AchievementType;
  title: string;
  description: string;
  points: number;
  checkCondition: (userId: number, performances: Performance[], newPerformance?: Performance) => boolean;
  icon: string;
  color: string;
}

export const achievementDefinitions: AchievementDefinition[] = [
  {
    type: "first_performance",
    title: "First Steps",
    description: "Record your first performance",
    points: 50,
    checkCondition: (userId, performances) => performances.length === 1,
    icon: "🏃",
    color: "from-green-400 to-emerald-600"
  },
  {
    type: "score_milestone_5000",
    title: "Rising Star",
    description: "Achieve a score of 5000+ points",
    points: 100,
    checkCondition: (userId, performances, newPerformance) => 
      newPerformance ? newPerformance.totalScore >= 5000 : performances.some(p => p.totalScore >= 5000),
    icon: "⭐",
    color: "from-yellow-400 to-orange-600"
  },
  {
    type: "score_milestone_6000",
    title: "Skilled Athlete",
    description: "Achieve a score of 6000+ points",
    points: 150,
    checkCondition: (userId, performances, newPerformance) => 
      newPerformance ? newPerformance.totalScore >= 6000 : performances.some(p => p.totalScore >= 6000),
    icon: "🏅",
    color: "from-blue-400 to-indigo-600"
  },
  {
    type: "score_milestone_7000",
    title: "Elite Performer",
    description: "Achieve a score of 7000+ points",
    points: 200,
    checkCondition: (userId, performances, newPerformance) => 
      newPerformance ? newPerformance.totalScore >= 7000 : performances.some(p => p.totalScore >= 7000),
    icon: "🥉",
    color: "from-amber-400 to-orange-600"
  },
  {
    type: "score_milestone_8000",
    title: "World Class",
    description: "Achieve a score of 8000+ points",
    points: 300,
    checkCondition: (userId, performances, newPerformance) => 
      newPerformance ? newPerformance.totalScore >= 8000 : performances.some(p => p.totalScore >= 8000),
    icon: "🏆",
    color: "from-purple-400 to-pink-600"
  },
  {
    type: "event_specialist",
    title: "Event Specialist",
    description: "Complete 10 performances in the same event type",
    points: 100,
    checkCondition: (userId, performances) => {
      const eventCounts = performances.reduce((acc, p) => {
        acc[p.eventType] = (acc[p.eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      return Object.values(eventCounts).some(count => count >= 10);
    },
    icon: "🎯",
    color: "from-red-400 to-rose-600"
  },
  {
    type: "multi_event_master",
    title: "Multi-Event Master",
    description: "Complete performances in all three event types",
    points: 200,
    checkCondition: (userId, performances) => {
      const eventTypes = new Set(performances.map(p => p.eventType));
      return eventTypes.has("decathlon") && eventTypes.has("heptathlon") && eventTypes.has("pentathlon");
    },
    icon: "🏃‍♂️",
    color: "from-teal-400 to-cyan-600"
  },
  {
    type: "consistency_champion",
    title: "Consistency Champion",
    description: "Record 5 performances with less than 200 points difference",
    points: 150,
    checkCondition: (userId, performances) => {
      if (performances.length < 5) return false;
      const recentFive = performances.slice(-5);
      const scores = recentFive.map(p => p.totalScore);
      const min = Math.min(...scores);
      const max = Math.max(...scores);
      return (max - min) < 200;
    },
    icon: "📊",
    color: "from-violet-400 to-purple-600"
  },
  {
    type: "improvement_streak",
    title: "Improvement Streak",
    description: "Achieve 3 consecutive performance improvements",
    points: 100,
    checkCondition: (userId, performances) => {
      if (performances.length < 3) return false;
      const sortedByDate = performances.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const recentThree = sortedByDate.slice(-3);
      return recentThree[0].totalScore < recentThree[1].totalScore && 
             recentThree[1].totalScore < recentThree[2].totalScore;
    },
    icon: "📈",
    color: "from-emerald-400 to-green-600"
  },
  {
    type: "perfect_ten",
    title: "Perfect Ten",
    description: "Complete 10 total performances",
    points: 150,
    checkCondition: (userId, performances) => performances.length >= 10,
    icon: "🔟",
    color: "from-pink-400 to-rose-600"
  }
];

export class AchievementService {
  async checkAndUnlockAchievements(userId: number, newPerformance?: Performance): Promise<Achievement[]> {
    const unlockedAchievements: Achievement[] = [];
    const performances = await storage.getPerformances();
    const userPerformances = performances.filter(p => true); // For now, all performances belong to default user
    
    for (const definition of achievementDefinitions) {
      // Check if user already has this achievement
      const hasAchievement = await storage.hasAchievement(userId, definition.type);
      if (hasAchievement) continue;
      
      // Check if condition is met
      if (definition.checkCondition(userId, userPerformances, newPerformance)) {
        const achievement = await storage.createAchievement({
          userId,
          achievementType: definition.type,
          title: definition.title,
          description: definition.description,
          points: definition.points,
          metadata: {
            icon: definition.icon,
            color: definition.color
          }
        });
        unlockedAchievements.push(achievement);
      }
    }
    
    return unlockedAchievements;
  }
  
  async getUserAchievements(userId: number): Promise<Achievement[]> {
    return await storage.getAchievements(userId);
  }
  
  async getTotalAchievementPoints(userId: number): Promise<number> {
    const achievements = await storage.getAchievements(userId);
    return achievements.reduce((total, achievement) => total + achievement.points, 0);
  }
  
  getAchievementDefinition(type: AchievementType): AchievementDefinition | undefined {
    return achievementDefinitions.find(def => def.type === type);
  }
}

export const achievementService = new AchievementService();