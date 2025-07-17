import { type EventResult } from "@shared/schema";

// World Athletics scoring formulas for multi-events
// Track events: points = A * (B - T)^C where T is time in seconds
// Field events: points = A * (M - B)^C where M is measurement in meters

const scoringTables = {
  // Men's Decathlon
  decathlon: {
    "100m": { A: 25.4347, B: 18, C: 1.81 },
    "Long Jump": { A: 0.14354, B: 220, C: 1.4 },
    "Shot Put": { A: 51.39, B: 1.5, C: 1.05 },
    "High Jump": { A: 0.8465, B: 75, C: 1.42 },
    "400m": { A: 1.53775, B: 82, C: 1.81 },
    "110m Hurdles": { A: 5.74352, B: 28.5, C: 1.92 },
    "Discus": { A: 12.91, B: 4, C: 1.1 },
    "Pole Vault": { A: 0.2797, B: 100, C: 1.35 },
    "Javelin": { A: 10.14, B: 7, C: 1.08 },
    "1500m": { A: 0.03768, B: 480, C: 1.85 }
  },
  
  // Women's Heptathlon
  heptathlon: {
    "100m Hurdles": { A: 9.23076, B: 26.7, C: 1.835 },
    "High Jump": { A: 1.84523, B: 75, C: 1.348 },
    "Shot Put": { A: 56.0211, B: 1.5, C: 1.05 },
    "200m": { A: 4.99087, B: 42.5, C: 1.81 },
    "Long Jump": { A: 0.188807, B: 210, C: 1.41 },
    "Javelin": { A: 15.9803, B: 3.8, C: 1.04 },
    "800m": { A: 0.11193, B: 254, C: 1.88 }
  },

  // Women's Pentathlon
  pentathlon: {
    "100m Hurdles": { A: 9.23076, B: 26.7, C: 1.835 },
    "High Jump": { A: 1.84523, B: 75, C: 1.348 },
    "Shot Put": { A: 56.0211, B: 1.5, C: 1.05 },
    "200m": { A: 4.99087, B: 42.5, C: 1.81 },
    "800m": { A: 0.11193, B: 254, C: 1.88 }
  }
};

export function calculatePoints(eventType: string, eventName: string, result: string, type: 'time' | 'measurement'): number {
  const tables = scoringTables[eventType as keyof typeof scoringTables];
  if (!tables) return 0;

  const formula = tables[eventName as keyof typeof tables];
  if (!formula) return 0;

  const { A, B, C } = formula;
  let measurement: number;

  if (type === 'time') {
    // Convert time string to seconds
    measurement = parseTimeToSeconds(result);
    if (measurement === 0) return 0;
    
    // For track events: points = A * (B - T)^C
    const points = A * Math.pow(B - measurement, C);
    return Math.max(0, Math.round(points));
  } else {
    // For field events: points = A * (M - B)^C
    measurement = parseFloat(result);
    if (isNaN(measurement) || measurement <= 0) return 0;
    
    const points = A * Math.pow(measurement - B, C);
    return Math.max(0, Math.round(points));
  }
}

function parseTimeToSeconds(timeString: string): number {
  // Handle formats like "10.45", "23.45", "1:23.45", "2:10.50", "4:25.50"
  const parts = timeString.split(':');
  
  if (parts.length === 1) {
    // Format: "10.45" (seconds only)
    return parseFloat(parts[0]) || 0;
  } else if (parts.length === 2) {
    // Format: "1:23.45" (minutes:seconds)
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  }
  
  return 0;
}

export function estimateResult(eventType: string, eventName: string, points: number, type: 'time' | 'measurement'): string {
  const tables = scoringTables[eventType as keyof typeof scoringTables];
  if (!tables) return "";

  const formula = tables[eventName as keyof typeof tables];
  if (!formula) return "";

  const { A, B, C } = formula;

  if (type === 'time') {
    // For track events: T = B - (points/A)^(1/C)
    const time = B - Math.pow(points / A, 1 / C);
    return formatTime(time);
  } else {
    // For field events: M = B + (points/A)^(1/C)
    const measurement = B + Math.pow(points / A, 1 / C);
    return measurement.toFixed(2);
  }
}

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return seconds.toFixed(2);
  } else {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toFixed(2).padStart(5, '0')}`;
  }
}
