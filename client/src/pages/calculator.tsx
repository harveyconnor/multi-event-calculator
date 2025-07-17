import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Trash2, Eye, Calculator as CalculatorIcon, Save, Eraser, Trophy, Medal, Crown, Clock, Ruler, History, Settings, Target, Zap, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { type Performance, type EventResult } from "@shared/schema";
import { calculatePoints, estimateResult } from "@/lib/scoring";

type EventType = "pentathlon" | "heptathlon" | "decathlon";

const eventConfigs = {
  pentathlon: {
    name: "Pentathlon",
    events: [
      { name: "100m Hurdles", type: "time" as const, unit: "seconds", placeholder: "13.24" },
      { name: "High Jump", type: "measurement" as const, unit: "meters", placeholder: "1.85" },
      { name: "Shot Put", type: "measurement" as const, unit: "meters", placeholder: "14.50" },
      { name: "200m", type: "time" as const, unit: "seconds", placeholder: "23.45" },
      { name: "800m", type: "time" as const, unit: "seconds", placeholder: "2:10.50" }
    ]
  },
  heptathlon: {
    name: "Heptathlon",
    events: [
      { name: "100m Hurdles", type: "time" as const, unit: "seconds", placeholder: "13.24" },
      { name: "High Jump", type: "measurement" as const, unit: "meters", placeholder: "1.85" },
      { name: "Shot Put", type: "measurement" as const, unit: "meters", placeholder: "14.50" },
      { name: "200m", type: "time" as const, unit: "seconds", placeholder: "23.45" },
      { name: "Long Jump", type: "measurement" as const, unit: "meters", placeholder: "6.50" },
      { name: "Javelin", type: "measurement" as const, unit: "meters", placeholder: "55.20" },
      { name: "800m", type: "time" as const, unit: "seconds", placeholder: "2:10.50" }
    ]
  },
  decathlon: {
    name: "Decathlon",
    events: [
      { name: "100m", type: "time" as const, unit: "seconds", placeholder: "10.45" },
      { name: "Long Jump", type: "measurement" as const, unit: "meters", placeholder: "7.50" },
      { name: "Shot Put", type: "measurement" as const, unit: "meters", placeholder: "16.20" },
      { name: "High Jump", type: "measurement" as const, unit: "meters", placeholder: "2.10" },
      { name: "400m", type: "time" as const, unit: "seconds", placeholder: "48.25" },
      { name: "110m Hurdles", type: "time" as const, unit: "seconds", placeholder: "13.80" },
      { name: "Discus", type: "measurement" as const, unit: "meters", placeholder: "48.50" },
      { name: "Pole Vault", type: "measurement" as const, unit: "meters", placeholder: "5.20" },
      { name: "Javelin", type: "measurement" as const, unit: "meters", placeholder: "65.40" },
      { name: "1500m", type: "time" as const, unit: "seconds", placeholder: "4:25.50" }
    ]
  }
};

export default function Calculator() {
  const { toast } = useToast();
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [eventResults, setEventResults] = useState<EventResult[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [historyFilter, setHistoryFilter] = useState<string>("all");

  const { data: performances = [], isLoading } = useQuery({
    queryKey: ["/api/performances", historyFilter],
    queryFn: async () => {
      const url = historyFilter === "all" ? "/api/performances" : `/api/performances?eventType=${historyFilter}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch performances");
      return response.json() as Promise<Performance[]>;
    }
  });

  const savePerformanceMutation = useMutation({
    mutationFn: async (performance: { eventType: string; eventResults: EventResult[]; totalScore: number }) => {
      return await apiRequest("POST", "/api/performances", performance);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performances"] });
      toast({
        title: "Performance Saved",
        description: `Total score: ${totalScore.toLocaleString()} points`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save performance",
        variant: "destructive",
      });
    }
  });

  const deletePerformanceMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/performances/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performances"] });
      toast({
        title: "Performance Deleted",
        description: "Performance removed from history",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete performance",
        variant: "destructive",
      });
    }
  });

  const selectEventType = (eventType: EventType) => {
    setSelectedEventType(eventType);
    const config = eventConfigs[eventType];
    const newResults = config.events.map(event => ({
      name: event.name,
      result: "",
      points: 0,
      type: event.type,
      unit: event.unit
    }));
    setEventResults(newResults);
    setTotalScore(0);
    
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
        const calculatedPoints = calculatePoints(selectedEventType, event.name, value, event.type);
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
        newResults[index].result = estimatedResult;
      } else {
        newResults[index].result = "";
      }
    }
    
    setEventResults(newResults);
    calculateTotal();
  };

  const calculateTotal = () => {
    const total = eventResults.reduce((sum, event) => sum + event.points, 0);
    setTotalScore(total);
  };

  const savePerformance = () => {
    if (!selectedEventType) {
      toast({
        title: "Error",
        description: "Please select an event type first",
        variant: "destructive",
      });
      return;
    }
    
    if (totalScore === 0) {
      toast({
        title: "Error",
        description: "Please enter some results first",
        variant: "destructive",
      });
      return;
    }
    
    savePerformanceMutation.mutate({
      eventType: selectedEventType,
      eventResults,
      totalScore
    });
  };

  const clearAll = () => {
    if (selectedEventType) {
      const config = eventConfigs[selectedEventType];
      const newResults = config.events.map(event => ({
        name: event.name,
        result: "",
        points: 0,
        type: event.type,
        unit: event.unit
      }));
      setEventResults(newResults);
      setTotalScore(0);
      
      toast({
        title: "Cleared",
        description: "All inputs have been cleared",
      });
    }
  };

  const deletePerformance = (id: number) => {
    deletePerformanceMutation.mutate(id);
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
      case "pentathlon": return "bg-success text-success-foreground";
      case "heptathlon": return "bg-secondary text-secondary-foreground";
      case "decathlon": return "bg-primary text-primary-foreground";
      default: return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50 dark:from-background dark:via-background dark:to-muted/20">
      {/* Header */}
      <header className="relative bg-gradient-to-r from-primary via-primary/90 to-primary/80 dark:from-primary/90 dark:via-primary/80 dark:to-primary/70 text-primary-foreground shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="container mx-auto px-4 py-8 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                <CalculatorIcon className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Athletics Calculator</h1>
                <p className="text-primary-foreground/80 text-sm mt-1">Multi-event performance tracking</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="bg-white/10 hover:bg-white/20 text-primary-foreground border-white/20">
                <History className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">History</span>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Event Type Selection */}
        <Card className="mb-8 border-0 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Select Event Type
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {(Object.keys(eventConfigs) as EventType[]).map((eventType) => (
                <Button
                  key={eventType}
                  variant={selectedEventType === eventType ? "default" : "outline"}
                  className={`h-auto p-6 transition-all duration-300 ${
                    selectedEventType === eventType
                      ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg scale-105 border-primary"
                      : "bg-gradient-to-r from-card to-muted/50 hover:from-primary/10 hover:to-primary/5 hover:scale-105 hover:shadow-lg border-border"
                  }`}
                  onClick={() => selectEventType(eventType)}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${
                      selectedEventType === eventType 
                        ? "bg-white/20" 
                        : "bg-primary/10 text-primary"
                    }`}>
                      {getEventTypeIcon(eventType)}
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-lg">{eventConfigs[eventType].name}</h3>
                      <p className="text-sm opacity-70">{eventConfigs[eventType].events.length} Events</p>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Event Calculator */}
        {selectedEventType && (
          <Card className="mb-8 border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  {eventConfigs[selectedEventType].name} Calculator
                  <Badge variant="outline" className="ml-2">
                    {eventConfigs[selectedEventType].events.length} Events
                  </Badge>
                </CardTitle>
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl px-6 py-3 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">Total Score:</span>
                    <span className="text-2xl font-bold text-primary">{totalScore.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {eventResults.map((event, index) => (
                  <div key={index} className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl p-6 border border-border/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-xl ${
                          event.type === "time" 
                            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        }`}>
                          {event.type === "time" ? (
                            <Clock className="h-5 w-5" />
                          ) : (
                            <Ruler className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground">{event.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {event.type === "time" ? "Time" : "Distance/Height"} ({event.unit})
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`result-${index}`} className="text-sm font-medium text-foreground">
                          Result
                        </Label>
                        <Input
                          id={`result-${index}`}
                          type="text"
                          placeholder={eventConfigs[selectedEventType].events[index].placeholder}
                          value={event.result}
                          onChange={(e) => updateResult(index, "result", e.target.value)}
                          className="w-full bg-background/50 backdrop-blur-sm border-border/60 focus:border-primary/50 focus:ring-primary/25"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`points-${index}`} className="text-sm font-medium text-foreground">
                          Points
                        </Label>
                        <Input
                          id={`points-${index}`}
                          type="number"
                          placeholder="0"
                          value={event.points || ""}
                          onChange={(e) => updateResult(index, "points", e.target.value)}
                          className="w-full bg-background/50 backdrop-blur-sm border-border/60 focus:border-primary/50 focus:ring-primary/25"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-8" />

              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={calculateTotal} className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg">
                  <CalculatorIcon className="h-4 w-4 mr-2" />
                  Calculate Total
                </Button>
                <Button 
                  onClick={savePerformance} 
                  disabled={savePerformanceMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-success to-success/90 hover:from-success/90 hover:to-success/80 text-success-foreground shadow-lg"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Performance
                </Button>
                <Button onClick={clearAll} variant="outline" className="border-border/60 hover:bg-muted/50">
                  <Eraser className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance History */}
        <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Performance History
              </CardTitle>
              <div className="flex items-center space-x-3">
                <Select value={historyFilter} onValueChange={setHistoryFilter}>
                  <SelectTrigger className="w-40 bg-background/50 backdrop-blur-sm border-border/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="pentathlon">Pentathlon</SelectItem>
                    <SelectItem value="heptathlon">Heptathlon</SelectItem>
                    <SelectItem value="decathlon">Decathlon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading performances...</p>
              </div>
            ) : performances.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-muted/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No performances recorded yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Start by selecting an event type and entering results.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead className="text-foreground font-semibold">Date</TableHead>
                      <TableHead className="text-foreground font-semibold">Event Type</TableHead>
                      <TableHead className="text-foreground font-semibold">Total Score</TableHead>
                      <TableHead className="text-foreground font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performances.map((performance) => (
                      <TableRow key={performance.id} className="border-border/50 hover:bg-muted/30 transition-colors">
                        <TableCell className="text-sm text-foreground">
                          {new Date(performance.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getEventTypeBadgeColor(performance.eventType)} border-0`}>
                            {performance.eventType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-primary text-lg">
                          {performance.totalScore.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deletePerformance(performance.id)}
                              disabled={deletePerformanceMutation.isPending}
                              className="hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
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
      </div>
    </div>
  );
}
