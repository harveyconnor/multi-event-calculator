export type EventType = "pentathlon" | "heptathlon" | "decathlon";

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

export type StoredPerformance = {
  id: string;
  eventType: string;
  eventResults: EventResult[];
  totalScore: number;
  date: string;
  label?: string;
};

export type StoredAchievement = {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'first_performance' | 'score_improvement' | 'multi_event_completion';
  eventType?: string;
  score?: number;
};