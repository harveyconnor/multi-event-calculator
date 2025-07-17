// Local storage utilities for offline-first PWA
import { type Performance, type Achievement } from "@shared/schema";

// Performance storage
export const PERFORMANCE_STORAGE_KEY = 'multi-smackdown-performances';
export const ACHIEVEMENT_STORAGE_KEY = 'multi-smackdown-achievements';

export interface StoredPerformance extends Omit<Performance, 'id'> {
  id: string; // Use string UUID instead of number
}

export interface StoredAchievement extends Omit<Achievement, 'id'> {
  id: string; // Use string UUID instead of number
}

// Generate UUID for local storage
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Performance storage functions
export function getPerformances(): StoredPerformance[] {
  try {
    const stored = localStorage.getItem(PERFORMANCE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading performances:', error);
    return [];
  }
}

export function savePerformance(performance: Omit<StoredPerformance, 'id' | 'date'>): StoredPerformance {
  const performances = getPerformances();
  const newPerformance: StoredPerformance = {
    ...performance,
    id: generateId(),
    date: new Date().toISOString()
  };
  
  performances.push(newPerformance);
  localStorage.setItem(PERFORMANCE_STORAGE_KEY, JSON.stringify(performances));
  
  return newPerformance;
}

export function updatePerformance(uuid: string, updates: Partial<StoredPerformance>): StoredPerformance | null {
  const performances = getPerformances();
  const index = performances.findIndex(p => p.uuid === uuid);
  
  if (index === -1) return null;
  
  const updatedPerformance = { ...performances[index], ...updates };
  performances[index] = updatedPerformance;
  localStorage.setItem(PERFORMANCE_STORAGE_KEY, JSON.stringify(performances));
  
  return updatedPerformance;
}

export function deletePerformance(id: string): boolean {
  const performances = getPerformances();
  const filtered = performances.filter(p => p.id !== id);
  
  if (filtered.length === performances.length) return false;
  
  localStorage.setItem(PERFORMANCE_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export function getPerformanceById(id: string): StoredPerformance | null {
  const performances = getPerformances();
  return performances.find(p => p.id === id) || null;
}

export function getPerformanceByUuid(uuid: string): StoredPerformance | null {
  const performances = getPerformances();
  return performances.find(p => p.uuid === uuid) || null;
}

// Achievement storage functions
export function getAchievements(): StoredAchievement[] {
  try {
    const stored = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading achievements:', error);
    return [];
  }
}

export function saveAchievement(achievement: Omit<StoredAchievement, 'id' | 'unlockedAt'>): StoredAchievement {
  const achievements = getAchievements();
  
  // Check if achievement already exists
  const existing = achievements.find(a => 
    a.userId === achievement.userId && 
    a.achievementType === achievement.achievementType
  );
  
  if (existing) return existing;
  
  const newAchievement: StoredAchievement = {
    ...achievement,
    id: generateId(),
    unlockedAt: new Date().toISOString()
  };
  
  achievements.push(newAchievement);
  localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(achievements));
  
  return newAchievement;
}

export function clearAllData(): void {
  localStorage.removeItem(PERFORMANCE_STORAGE_KEY);
  localStorage.removeItem(ACHIEVEMENT_STORAGE_KEY);
}

// Achievement checking logic (moved from server)
export function checkAchievements(userId: number = 1): StoredAchievement[] {
  const performances = getPerformances();
  const existingAchievements = getAchievements();
  const newAchievements: StoredAchievement[] = [];

  // Check for first performance
  if (performances.length === 1 && !existingAchievements.find(a => a.achievementType === 'first_performance')) {
    const achievement = saveAchievement({
      userId,
      achievementType: 'first_performance',
      title: 'First Steps',
      description: 'Completed your first multi-event performance!',
      points: 50
    });
    newAchievements.push(achievement);
  }

  // Check for score milestones
  const latestPerformance = performances[performances.length - 1];
  if (latestPerformance) {
    const score = latestPerformance.totalScore;
    
    if (score >= 7000 && !existingAchievements.find(a => a.achievementType === 'score_7000')) {
      const achievement = saveAchievement({
        userId,
        achievementType: 'score_7000',
        title: 'Rising Star',
        description: 'Achieved a total score of 7000+ points!',
        points: 100
      });
      newAchievements.push(achievement);
    }
    
    if (score >= 8000 && !existingAchievements.find(a => a.achievementType === 'score_8000')) {
      const achievement = saveAchievement({
        userId,
        achievementType: 'score_8000',
        title: 'Elite Performer',
        description: 'Achieved a total score of 8000+ points!',
        points: 150
      });
      newAchievements.push(achievement);
    }
  }

  // Check for event type completions
  const eventTypes = ['decathlon', 'heptathlon', 'pentathlon'] as const;
  eventTypes.forEach(eventType => {
    const eventPerformances = performances.filter(p => p.eventType === eventType);
    if (eventPerformances.length >= 3 && !existingAchievements.find(a => a.achievementType === `${eventType}_specialist`)) {
      const achievement = saveAchievement({
        userId,
        achievementType: `${eventType}_specialist`,
        title: `${eventType.charAt(0).toUpperCase() + eventType.slice(1)} Specialist`,
        description: `Completed 3 ${eventType} performances!`,
        points: 75
      });
      newAchievements.push(achievement);
    }
  });

  return newAchievements;
}