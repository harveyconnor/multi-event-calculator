import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { Trash2, Eye, Calculator as CalculatorIcon, Save, Eraser, Trophy, Medal, Crown, Clock, Ruler, Target, Zap, Star, History, ToggleLeft, ToggleRight, Award, BarChart3, Download } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { type EventResult } from "@shared/schema";
import { calculatePoints, estimateResult } from "@/lib/scoring";
import AchievementTimeline from "@/components/AchievementTimeline";
import { 
  getPerformances, 
  savePerformance, 
  updatePerformance, 
  deletePerformance, 
  getPerformanceByUuid, 
  checkAchievements,
  type StoredPerformance,
  type StoredAchievement,
  generateId
} from "@/lib/localStorage";
import { handleInstallClick } from "@/lib/pwa";

type EventType = "decathlon" | "heptathlon" | "pentathlon";

// InstallButton component to handle PWA installation
function InstallButton() {
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isAppInstalled = window.navigator.standalone === true || 
                          window.matchMedia('(display-mode: standalone)').matches;
    
    if (!isAppInstalled) {
      // Listen for install prompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setShowInstallButton(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  if (!showInstallButton) return null;

  return (
    <Button
      onClick={() => {
        handleInstallClick();
        setShowInstallButton(false);
      }}
      className="glass-button text-white hover:text-white text-sm px-3 py-1"
    >
      <Download className="h-4 w-4 mr-1" />
      Install App
    </Button>
  );
}

const eventConfigs = {
  decathlon: {
    name: "Decathlon",
    events: [
      { name: "100m", type: "time" as const, unit: "seconds", placeholder: "10.45", day: 1 },
      { name: "Long Jump", type: "measurement" as const, unit: "meters", placeholder: "7.50", day: 1 },
      { name: "Shot Put", type: "measurement" as const, unit: "meters", placeholder: "16.20", day: 1 },
      { name: "High Jump", type: "measurement" as const, unit: "meters", placeholder: "2.10", day: 1 },
      { name: "400m", type: "time" as const, unit: "seconds", placeholder: "48.25", day: 1 },
      { name: "110m Hurdles", type: "time" as const, unit: "seconds", placeholder: "13.80", day: 2 },
      { name: "Discus", type: "measurement" as const, unit: "meters", placeholder: "48.50", day: 2 },
      { name: "Pole Vault", type: "measurement" as const, unit: "meters", placeholder: "5.20", day: 2 },
      { name: "Javelin", type: "measurement" as const, unit: "meters", placeholder: "65.40", day: 2 },
      { name: "1500m", type: "time" as const, unit: "seconds", placeholder: "4:25.50", day: 2 }
    ]
  },
  heptathlon: {
    name: "Heptathlon",
    events: [
      { name: "100m Hurdles", type: "time" as const, unit: "seconds", placeholder: "13.24", day: 1 },
      { name: "High Jump", type: "measurement" as const, unit: "meters", placeholder: "1.85", day: 1 },
      { name: "Shot Put", type: "measurement" as const, unit: "meters", placeholder: "14.50", day: 1 },
      { name: "200m", type: "time" as const, unit: "seconds", placeholder: "23.45", day: 1 },
      { name: "Long Jump", type: "measurement" as const, unit: "meters", placeholder: "6.50", day: 2 },
      { name: "Javelin", type: "measurement" as const, unit: "meters", placeholder: "55.20", day: 2 },
      { name: "800m", type: "time" as const, unit: "seconds", placeholder: "2:10.50", day: 2 }
    ]
  },
  pentathlon: {
    name: "Pentathlon",
    events: [
      { name: "100m Hurdles", type: "time" as const, unit: "seconds", placeholder: "13.24", day: 1 },
      { name: "High Jump", type: "measurement" as const, unit: "meters", placeholder: "1.85", day: 1 },
      { name: "Shot Put", type: "measurement" as const, unit: "meters", placeholder: "14.50", day: 1 },
      { name: "200m", type: "time" as const, unit: "seconds", placeholder: "23.45", day: 1 },
      { name: "800m", type: "time" as const, unit: "seconds", placeholder: "2:10.50", day: 1 }
    ]
  }
};

export default function Calculator() {
  const { toast } = useToast();
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [eventResults, setEventResults] = useState<EventResult[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  
  // Initialize events when event type is selected
  useEffect(() => {
    if (selectedEventType) {
      const config = eventConfigs[selectedEventType];
      const newResults = config.events.map(event => ({
        name: event.name,
        result: "",
        points: 0,
        type: event.type,
        unit: event.unit,
        day: event.day
      }));
      setEventResults(newResults);
    }
  }, [selectedEventType]);
  const [historyFilter, setHistoryFilter] = useState<string>("all");
  const [performanceLabel, setPerformanceLabel] = useState<string>("");
  const [editingPerformanceId, setEditingPerformanceId] = useState<string | null>(null);
  const [isMetric, setIsMetric] = useState<boolean>(true);
  const [newAchievements, setNewAchievements] = useState<StoredAchievement[]>([]);
  const [performances, setPerformances] = useState<StoredPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getEventDescription = (eventName: string) => {
    const distanceEvents = ["Long Jump", "Shot Put", "Discus", "Javelin"];
    const heightEvents = ["High Jump", "Pole Vault"];
    
    if (distanceEvents.includes(eventName)) {
      return "Distance";
    } else if (heightEvents.includes(eventName)) {
      return "Height";
    }
    return "Distance/Height";
  };

  const getEventUnit = (eventName: string) => {
    // Special case for 800m and 1500m to show minutes:seconds format
    if (eventName === "800m" || eventName === "1500m") {
      return "minutes:seconds";
    }
    // Check for running events more specifically
    if (eventName.includes("100m") || eventName.includes("200m") || eventName.includes("400m") || 
        eventName.includes("800m") || eventName.includes("Hurdles") || eventName.includes("60m")) {
      return "seconds";
    }
    // For all field events including Long Jump and High Jump, respect metric/imperial toggle
    return isMetric ? "meters" : "feet";
  };

  const convertToMetric = (value: string, eventName: string) => {
    if (!value || isMetric) return value;
    
    const distanceEvents = ["Long Jump", "Shot Put", "Discus", "Javelin"];
    const heightEvents = ["High Jump", "Pole Vault"];
    
    if (distanceEvents.includes(eventName) || heightEvents.includes(eventName)) {
      // Convert feet to meters (1 foot = 0.3048 meters)
      const feet = parseFloat(value);
      if (!isNaN(feet)) {
        return (feet * 0.3048).toFixed(2);
      }
    }
    return value;
  };

  const getPlaceholder = (eventName: string) => {
    const metricPlaceholders: { [key: string]: string } = {
      "100m": "10.45",
      "Long Jump": "7.50",
      "Shot Put": "16.20",
      "High Jump": "2.10",
      "400m": "48.25",
      "110m Hurdles": "13.80",
      "Discus": "48.50",
      "Pole Vault": "5.20",
      "Javelin": "65.40",
      "1500m": "4:25.50",
      "100m Hurdles": "13.24",
      "200m": "23.45",
      "800m": "2:10.50"
    };

    const imperialPlaceholders: { [key: string]: string } = {
      "100m": "10.45",
      "Long Jump": "24.6",
      "Shot Put": "53.2",
      "High Jump": "6.9",
      "400m": "48.25",
      "110m Hurdles": "13.80",
      "Discus": "159.1",
      "Pole Vault": "17.1",
      "Javelin": "214.6",
      "1500m": "4:25.50",
      "100m Hurdles": "13.24",
      "200m": "23.45",
      "800m": "2:10.50"
    };

    return isMetric ? metricPlaceholders[eventName] : imperialPlaceholders[eventName];
  };

  // Load performances from localStorage on mount
  useEffect(() => {
    const loadPerformances = () => {
      try {
        const stored = getPerformances();
        setPerformances(stored);
      } catch (error) {
        console.error("Error loading performances:", error);
      }
    };
    
    loadPerformances();
  }, []);

  const savePerformanceLocal = () => {
    if (!selectedEventType || totalScore === 0) return;
    
    try {
      const performance = {
        uuid: editingPerformanceId || generateId(),
        eventType: selectedEventType,
        eventResults,
        totalScore,
        label: performanceLabel
      };
      
      let savedPerformance: StoredPerformance;
      
      if (editingPerformanceId) {
        // Update existing performance
        savedPerformance = updatePerformance(editingPerformanceId, performance)!;
      } else {
        // Create new performance
        savedPerformance = savePerformance(performance);
        setEditingPerformanceId(savedPerformance.uuid);
      }
      
      // Update local state
      setPerformances(getPerformances());
      
      // Check for achievements
      const newAchievements = checkAchievements(1);
      if (newAchievements.length > 0) {
        setNewAchievements(newAchievements);
        toast({
          title: "🎉 Achievement Unlocked!",
          description: `You earned ${newAchievements.length} new achievement${newAchievements.length > 1 ? 's' : ''}!`,
        });
      }
      
      toast({
        title: editingPerformanceId ? "Performance Updated" : "Performance Saved",
        description: "Your performance has been saved successfully",
      });
    } catch (error) {
      console.error("Error saving performance:", error);
      toast({
        title: "Error",
        description: "Failed to save performance",
        variant: "destructive",
      });
    }
  };

  const deletePerformanceLocal = (id: string) => {
    try {
      const success = deletePerformance(id);
      if (success) {
        setPerformances(getPerformances());
        toast({
          title: "Performance Deleted",
          description: "Performance removed from history",
        });
      } else {
        toast({
          title: "Error",
          description: "Performance not found",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting performance:", error);
      toast({
        title: "Error",
        description: "Failed to delete performance",
        variant: "destructive",
      });
    }
  };

  const selectEventType = (eventType: EventType) => {
    setSelectedEventType(eventType);
    const config = eventConfigs[eventType];
    const newResults = config.events.map(event => ({
      name: event.name,
      result: "",
      points: 0,
      type: event.type,
      unit: event.unit,
      day: event.day
    }));
    setEventResults(newResults);
    setTotalScore(0);
    setPerformanceLabel("");
    setEditingPerformanceId(null); // Reset editing ID
    setNewAchievements([]); // Clear any achievements
    
    toast({
      title: `${config.name} Selected`,
      description: `Ready to enter ${config.events.length} event results`,
    });
  };

  const updateResult = (index: number, field: "result" | "points", value: string) => {
    const newResults = [...eventResults];
    
    if (field === "result") {
      newResults[index].result = value;
      // Auto-calculate points when result is entered
      if (value.trim() && selectedEventType) {
        const event = eventResults[index];
        const metricValue = convertToMetric(value, event.name);
        const calculatedPoints = calculatePoints(selectedEventType, event.name, metricValue, event.type);
        newResults[index].points = calculatedPoints;
      } else {
        newResults[index].points = 0;
      }
    } else {
      const points = parseInt(value) || 0;
      newResults[index].points = points;
      // Only auto-calculate result when points are entered, don't recalculate points
      if (points > 0 && selectedEventType) {
        const event = eventResults[index];
        const estimatedResult = estimateResult(selectedEventType, event.name, points, event.type);
        // Convert back to imperial if needed for display
        if (!isMetric && (["Long Jump", "Shot Put", "Discus", "Javelin", "High Jump", "Pole Vault"].includes(event.name))) {
          const meters = parseFloat(estimatedResult);
          if (!isNaN(meters)) {
            newResults[index].result = (meters / 0.3048).toFixed(2);
          } else {
            newResults[index].result = estimatedResult;
          }
        } else {
          newResults[index].result = estimatedResult;
        }
      } else {
        newResults[index].result = "";
      }
    }
    
    setEventResults(newResults);
    
    // Calculate total automatically
    const total = newResults.reduce((sum, event) => sum + event.points, 0);
    setTotalScore(total);
  };

  const handleSavePerformance = () => {
    savePerformanceLocal();
  };

  const clearAll = () => {
    if (selectedEventType) {
      const config = eventConfigs[selectedEventType];
      const newResults = config.events.map(event => ({
        name: event.name,
        result: "",
        points: 0,
        type: event.type,
        unit: event.unit,
        day: event.day
      }));
      setEventResults(newResults);
      setTotalScore(0);
      setPerformanceLabel("");
      setEditingPerformanceId(null);
      setNewAchievements([]);
      
      toast({
        title: "Cleared",
        description: "All inputs have been cleared",
      });
    }
  };

  const handleDeletePerformance = (id: string) => {
    deletePerformanceLocal(id);
  };

  const loadPerformance = (performance: StoredPerformance) => {
    setSelectedEventType(performance.eventType as EventType);
    setEventResults(performance.eventResults as EventResult[]);
    setTotalScore(performance.totalScore);
    setPerformanceLabel(performance.label || "");
    setEditingPerformanceId(performance.uuid);
    
    toast({
      title: "Performance Loaded",
      description: "Performance loaded for editing",
    });
  };

  const getEventTypeIcon = (eventType: EventType) => {
    switch (eventType) {
      case "pentathlon": return <Medal className="h-6 w-6" />;
      case "heptathlon": return <Trophy className="h-6 w-6" />;
      case "decathlon": return <Crown className="h-6 w-6" />;
      default: return <Medal className="h-6 w-6" />;
    }
  };

  const getEventTypeBadgeColor = (eventType: string) => {
    switch (eventType) {
      case "pentathlon": return "bg-emerald-500/20 text-emerald-200 border-emerald-400/30";
      case "heptathlon": return "bg-violet-500/20 text-violet-200 border-violet-400/30";
      case "decathlon": return "bg-blue-500/20 text-blue-200 border-blue-400/30";
      default: return "bg-gray-500/20 text-gray-200 border-gray-400/30";
    }
  };

  const getDaySubtotal = (day: number) => {
    return eventResults
      .filter(event => event.day === day)
      .reduce((sum, event) => sum + event.points, 0);
  };

  const getEventsByDay = (day: number) => {
    return eventResults.filter(event => event.day === day);
  };

  const hasMultipleDays = () => {
    return selectedEventType === "decathlon" || selectedEventType === "heptathlon";
  };

  const getPerformanceDayTotal = (performance: StoredPerformance, day: number) => {
    if (!performance.eventResults || !Array.isArray(performance.eventResults)) return 0;
    
    // Get the event config for this event type
    const config = eventConfigs[performance.eventType as EventType];
    if (!config) return 0;
    
    return performance.eventResults
      .filter((result: any, index: number) => {
        const eventConfig = config.events[index];
        return eventConfig && eventConfig.day === day;
      })
      .reduce((sum: number, result: any) => sum + (result.points || 0), 0);
  };

  return (
    <div className="min-h-screen glass-background">
      {/* Header */}
      <header className="glass-header text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 glass-card">
                <CalculatorIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">Multi Smackdown</h1>
                <p className="text-white/90 text-xs mt-0.5 font-medium tracking-wide">A Track & Field Multi event calculator</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setIsMetric(!isMetric)}
                className="glass-button text-white hover:text-white text-sm px-3 py-1"
              >
                {isMetric ? <ToggleRight className="h-4 w-4 mr-1" /> : <ToggleLeft className="h-4 w-4 mr-1" />}
                {isMetric ? "Metric" : "Imperial"}
              </Button>
              <InstallButton />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Calculator Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Event Type Selection */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-wide">
                  <div className="glass-icon-container w-6 h-6 flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-400/30">
                    <Target className="h-3 w-3 text-white" />
                  </div>
                  Select Event Type
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(Object.keys(eventConfigs) as EventType[]).map((eventType) => (
                    <Button
                      key={eventType}
                      className={`h-auto p-3 glass-button transition-all duration-200 ${
                        selectedEventType === eventType
                          ? "bg-blue-500/30 text-white border-blue-400/50 shadow-lg shadow-blue-500/20"
                          : "text-foreground hover:text-foreground hover:shadow-lg"
                      }`}
                      onClick={() => selectEventType(eventType)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 glass-icon-container ${
                          selectedEventType === eventType 
                            ? "bg-blue-500/30 text-white border-blue-400/50" 
                            : "text-white"
                        }`}>
                          {getEventTypeIcon(eventType)}
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-base">{eventConfigs[eventType].name}</h3>
                          <p className="text-xs font-medium">{eventConfigs[eventType].events.length} Events</p>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Event Calculator */}
            {selectedEventType && (
              <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-wide">
                    <div className="glass-icon-container w-6 h-6 flex items-center justify-center bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400/30">
                      <Zap className="h-3 w-3 text-white" />
                    </div>
                    {eventConfigs[selectedEventType].name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">
                    Enter your results to auto-calculate points, or enter points to estimate results. Both fields update each other automatically.
                  </p>
                </div>
                <div className="glass-card bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/30 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-white" />
                    <span className="text-xs font-semibold text-white tracking-wide">Total:</span>
                    <span className="text-lg font-bold text-white">{totalScore.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {hasMultipleDays() ? (
                  // Show events organized by day
                  [1, 2].map(day => (
                    <div key={day} className="space-y-3">
                      <div className="flex items-center">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <div className="glass-icon-container w-5 h-5 flex items-center justify-center bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-400/30">
                            <span className="text-xs font-bold text-white">{day}</span>
                          </div>
                          Day {day}
                        </h3>
                      </div>
                      
                      {getEventsByDay(day).map((event, index) => {
                        const originalIndex = eventResults.findIndex(e => e.name === event.name);
                        return (
                          <div key={originalIndex} className="glass-event-card p-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                              <div className="flex items-center space-x-2">
                                <div className={`p-2 glass-card transition-all duration-200 ${
                                  event.type === "time" 
                                    ? "bg-blue-500/20 text-blue-200 border-blue-400/30"
                                    : "bg-purple-500/20 text-purple-200 border-purple-400/30"
                                }`}>
                                  {event.type === "time" ? (
                                    <Clock className="h-4 w-4" />
                                  ) : (
                                    <Ruler className="h-4 w-4" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-foreground text-sm">{event.name}</h4>
                                  <p className="text-xs text-muted-foreground font-medium tracking-wide">
                                    {event.type === "time" ? "Time" : getEventDescription(event.name)} ({getEventUnit(event.name)})
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor={`result-${originalIndex}`} className="text-xs font-semibold text-foreground tracking-wide">
                                  Result {!isMetric && (event.name === "Long Jump" || event.name === "High Jump" || event.name === "Shot Put" || event.name === "Discus" || event.name === "Javelin" || event.name === "Pole Vault") && event.result && (
                                    <span className="text-muted-foreground/60 font-normal">
                                      ({(parseFloat(event.result) * 0.3048).toFixed(2)}m)
                                    </span>
                                  )}
                                </Label>
                                <Input
                                  id={`result-${originalIndex}`}
                                  type="text"
                                  placeholder={getPlaceholder(event.name)}
                                  value={event.result}
                                  onChange={(e) => updateResult(originalIndex, "result", e.target.value)}
                                  className="w-full glass-input text-foreground text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor={`points-${originalIndex}`} className="text-xs font-semibold text-foreground tracking-wide">
                                  Points
                                </Label>
                                <Input
                                  id={`points-${originalIndex}`}
                                  type="number"
                                  placeholder="0"
                                  value={event.points || ""}
                                  onChange={(e) => updateResult(originalIndex, "points", e.target.value)}
                                  className="w-full glass-input text-foreground text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Day Subtotal */}
                      <div className="glass-card bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-400/30 p-3 mt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">Day {day} Total:</span>
                          <span className="text-lg font-black text-white">{getDaySubtotal(day).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  // Show events in single list for pentathlon
                  eventResults.map((event, index) => (
                    <div key={index} className="glass-event-card p-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                        <div className="flex items-center space-x-2">
                          <div className={`p-2 glass-card transition-all duration-200 ${
                            event.type === "time" 
                              ? "bg-blue-500/20 text-blue-200 border-blue-400/30"
                              : "bg-purple-500/20 text-purple-200 border-purple-400/30"
                          }`}>
                            {event.type === "time" ? (
                              <Clock className="h-4 w-4" />
                            ) : (
                              <Ruler className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground text-sm">{event.name}</h4>
                            <p className="text-xs text-muted-foreground font-medium tracking-wide">
                              {event.type === "time" ? "Time" : getEventDescription(event.name)} ({getEventUnit(event.name)})
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`result-${index}`} className="text-xs font-semibold text-foreground tracking-wide">
                            Result {!isMetric && (event.name === "Long Jump" || event.name === "High Jump" || event.name === "Shot Put" || event.name === "Discus" || event.name === "Javelin" || event.name === "Pole Vault") && event.result && (
                              <span className="text-muted-foreground/60 font-normal">
                                ({(parseFloat(event.result) * 0.3048).toFixed(2)}m)
                              </span>
                            )}
                          </Label>
                          <Input
                            id={`result-${index}`}
                            type="text"
                            placeholder={getPlaceholder(event.name)}
                            value={event.result}
                            onChange={(e) => updateResult(index, "result", e.target.value)}
                            className="w-full glass-input text-foreground text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`points-${index}`} className="text-xs font-semibold text-foreground tracking-wide">
                            Points
                          </Label>
                          <Input
                            id={`points-${index}`}
                            type="number"
                            placeholder="0"
                            value={event.points || ""}
                            onChange={(e) => updateResult(index, "points", e.target.value)}
                            className="w-full glass-input text-foreground text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Summary Section for Multi-Day Events */}
              {hasMultipleDays() && (
                <div className="mt-6 mb-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="glass-card bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-400/30 p-4">
                      <div className="text-center">
                        <div className="text-xs font-semibold text-orange-200 mb-1">Day 1 Total</div>
                        <div className="text-2xl font-black text-white">{getDaySubtotal(1).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="glass-card bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-400/30 p-4">
                      <div className="text-center">
                        <div className="text-xs font-semibold text-red-200 mb-1">Day 2 Total</div>
                        <div className="text-2xl font-black text-white">{getDaySubtotal(2).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="glass-card bg-gradient-to-r from-emerald-500/20 to-green-500/20 border-emerald-400/30 p-4">
                      <div className="text-center">
                        <div className="text-xs font-semibold text-emerald-200 mb-1">Final Total</div>
                        <div className="text-2xl font-black text-white">{totalScore.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-3 mt-3">
                <Label htmlFor="performance-label" className="text-xs font-semibold text-foreground tracking-wide">
                  Label
                </Label>
                <Input
                  id="performance-label"
                  type="text"
                  placeholder="e.g., 'Personal Best', 'Competition', 'Training'"
                  value={performanceLabel}
                  onChange={(e) => setPerformanceLabel(e.target.value)}
                  className="mt-1 glass-input text-foreground text-sm"
                />
              </div>

              <div className="flex justify-center space-x-3">
                <Button 
                  onClick={handleSavePerformance}
                  disabled={totalScore === 0 || !selectedEventType || isLoading}
                  className="glass-button bg-blue-500/20 text-blue-200 hover:bg-blue-500/30 border-blue-400/30 transition-all duration-200 text-sm px-4 py-2"
                >
                  <Save className="h-3 w-3 mr-1" />
                  {isLoading ? 'Saving...' : (editingPerformanceId ? 'Update Performance' : 'Save Performance')}
                </Button>
                <Button onClick={clearAll} className="glass-button bg-red-500/20 text-red-200 hover:bg-red-500/30 border-red-400/30 transition-all duration-200 text-sm px-4 py-2">
                  <Eraser className="h-3 w-3 mr-1" />
                  Clear all and start over
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

            {/* Performance History */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-wide">
                    <div className="glass-icon-container w-6 h-6 flex items-center justify-center bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/30">
                      <Trophy className="h-3 w-3 text-white" />
                    </div>
                    Performance History
                  </CardTitle>
                  <div className="flex items-center space-x-3">
                    <Select value={historyFilter} onValueChange={setHistoryFilter}>
                      <SelectTrigger className="w-32 glass-select text-foreground text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-dropdown">
                        <SelectItem value="all" className="glass-dropdown-item">All Events</SelectItem>
                        <SelectItem value="decathlon" className="glass-dropdown-item">Decathlon</SelectItem>
                        <SelectItem value="heptathlon" className="glass-dropdown-item">Heptathlon</SelectItem>
                        <SelectItem value="pentathlon" className="glass-dropdown-item">Pentathlon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-white/20 border-t-blue-400 mx-auto mb-4 animate-spin rounded-full glass-card"></div>
                    <p className="text-muted-foreground font-bold tracking-wide">Loading Performances...</p>
                  </div>
                ) : performances.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="glass-icon-container w-16 h-16 flex items-center justify-center mx-auto mb-4 transform rotate-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-400/30">
                      <Trophy className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-muted-foreground font-semibold tracking-wide text-sm">No Performances Recorded Yet</p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Start by selecting an event type and entering results</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table className="glass-table">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-foreground font-black tracking-wide">Date</TableHead>
                          <TableHead className="text-foreground font-black tracking-wide">Label</TableHead>
                          <TableHead className="text-foreground font-black tracking-wide">Event Type</TableHead>
                          <TableHead className="text-foreground font-black tracking-wide">Day 1</TableHead>
                          <TableHead className="text-foreground font-black tracking-wide">Day 2</TableHead>
                          <TableHead className="text-foreground font-black tracking-wide">Total Score</TableHead>
                          <TableHead className="text-foreground font-black tracking-wide">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {performances.filter(performance => {
                          if (historyFilter === "all") return true;
                          return performance.eventType === historyFilter;
                        }).map((performance) => (
                          <TableRow key={performance.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="text-xs text-foreground font-bold py-2">
                              {new Date(performance.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-xs text-foreground font-bold py-2">
                              {performance.label ? (
                                <Badge className="glass-badge bg-slate-500/20 text-slate-200 border-slate-400/30 text-xs">
                                  {performance.label}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground font-normal">—</span>
                              )}
                            </TableCell>
                            <TableCell className="py-2">
                              <Badge className={`${getEventTypeBadgeColor(performance.eventType)} glass-badge text-xs`}>
                                {performance.eventType}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-black text-white text-sm py-2">
                              {performance.eventType === "decathlon" || performance.eventType === "heptathlon" ? (
                                getPerformanceDayTotal(performance, 1).toLocaleString()
                              ) : (
                                <span className="text-muted-foreground font-normal">—</span>
                              )}
                            </TableCell>
                            <TableCell className="font-black text-white text-sm py-2">
                              {performance.eventType === "decathlon" || performance.eventType === "heptathlon" ? (
                                getPerformanceDayTotal(performance, 2).toLocaleString()
                              ) : (
                                <span className="text-muted-foreground font-normal">—</span>
                              )}
                            </TableCell>
                            <TableCell className="font-black text-white text-sm py-2">
                              {performance.totalScore.toLocaleString()}
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="flex space-x-1">
                                <Button 
                                  size="sm" 
                                  onClick={() => loadPerformance(performance)}
                                  className="glass-button bg-blue-500/20 text-blue-200 hover:bg-blue-500/30 border-blue-400/30 p-1.5 transition-all duration-200"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={() => handleDeletePerformance(performance.id)}
                                  disabled={isLoading}
                                  className="glass-button bg-red-500/20 text-red-200 hover:bg-red-500/30 border-red-400/30 p-1.5 transition-all duration-200"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Radar Chart for Points Distribution */}
            {performances.length > 0 && (
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-wide">
                    <div className="glass-icon-container w-6 h-6 flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/30">
                      <BarChart3 className="h-3 w-3 text-white" />
                    </div>
                    Points Distribution ({performances.length} performances)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {performances.map((performance, index) => {
                      const radarData = performance.eventResults?.map(event => ({
                        event: event.name,
                        points: event.points,
                        fullMark: 1200 // Maximum possible points for radar visualization
                      })) || [];

                      return (
                        <div key={performance.id} className="glass-card p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground">
                                {performance.label || `Performance ${index + 1}`}
                              </h3>
                              <Badge className={`${getEventTypeBadgeColor(performance.eventType)} glass-badge text-xs`}>
                                {performance.eventType}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(performance.date).toLocaleDateString()}
                            </div>
                          </div>
                          
                          <div className="h-80 w-full bg-black/20 rounded-lg border border-white/10 p-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                                <PolarGrid 
                                  gridType="polygon" 
                                  stroke="rgba(255, 255, 255, 0.2)"
                                  strokeWidth={1}
                                />
                                <PolarAngleAxis 
                                  dataKey="event" 
                                  tick={{ fill: 'white', fontSize: 12 }}
                                  className="text-xs"
                                />
                                <PolarRadiusAxis 
                                  angle={90} 
                                  domain={[0, 1200]}
                                  tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 10 }}
                                  tickCount={6}
                                />
                                <Radar
                                  name="Points"
                                  dataKey="points"
                                  stroke="#8B5CF6"
                                  fill="#8B5CF6"
                                  fillOpacity={0.4}
                                  strokeWidth={3}
                                  dot={{ r: 5, fill: "#8B5CF6", strokeWidth: 2, stroke: "#fff" }}
                                />
                                <Tooltip 
                                  contentStyle={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                    border: '1px solid rgba(139, 92, 246, 0.5)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '12px'
                                  }}
                                  formatter={(value: number) => [`${value} points`, 'Score']}
                                />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Achievement Timeline Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <AchievementTimeline 
                userId={1} 
                newAchievements={newAchievements}
                onClose={() => setNewAchievements([])}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Copyright Footer */}
      <footer className="mt-12 py-6 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-xs text-white/60 font-medium">
              © {new Date().getFullYear()} Multi Smackdown. All rights reserved.
            </p>
            <p className="text-xs text-white/40 mt-1">
              Track & Field Multi-Event Calculator
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
