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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="brutal-header text-primary-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-accent border-4 border-border brutal-border">
                <CalculatorIcon className="h-8 w-8 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight uppercase">ATHLETICS CALC</h1>
                <p className="text-primary-foreground/90 text-sm mt-1 font-bold uppercase tracking-wide">MULTI-EVENT PERFORMANCE</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button className="brutal-button bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <History className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">HISTORY</span>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Event Type Selection */}
        <Card className="mb-8 brutal-card bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-black uppercase tracking-wide">
              <Target className="h-6 w-6 text-primary" />
              SELECT EVENT TYPE
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {(Object.keys(eventConfigs) as EventType[]).map((eventType) => (
                <Button
                  key={eventType}
                  className={`h-auto p-6 brutal-button ${
                    selectedEventType === eventType
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground hover:bg-muted"
                  }`}
                  onClick={() => selectEventType(eventType)}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 border-2 border-border ${
                      selectedEventType === eventType 
                        ? "bg-primary-foreground text-primary" 
                        : "bg-accent text-accent-foreground"
                    }`}>
                      {getEventTypeIcon(eventType)}
                    </div>
                    <div className="text-left">
                      <h3 className="font-black text-lg uppercase">{eventConfigs[eventType].name}</h3>
                      <p className="text-sm font-bold">{eventConfigs[eventType].events.length} EVENTS</p>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Event Calculator */}
        {selectedEventType && (
          <Card className="mb-8 brutal-card bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-2xl font-black uppercase tracking-wide">
                  <Zap className="h-6 w-6 text-primary" />
                  {eventConfigs[selectedEventType].name} CALCULATOR
                  <Badge className="ml-2 brutal-badge bg-secondary text-secondary-foreground">
                    {eventConfigs[selectedEventType].events.length} EVENTS
                  </Badge>
                </CardTitle>
                <div className="bg-accent brutal-border px-6 py-3">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-accent-foreground" />
                    <span className="text-sm font-black text-accent-foreground uppercase tracking-wide">TOTAL:</span>
                    <span className="text-2xl font-black text-accent-foreground">{totalScore.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {eventResults.map((event, index) => (
                  <div key={index} className="brutal-event-card bg-muted p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 border-3 border-border ${
                          event.type === "time" 
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-accent text-accent-foreground"
                        }`}>
                          {event.type === "time" ? (
                            <Clock className="h-5 w-5" />
                          ) : (
                            <Ruler className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-black text-foreground uppercase">{event.name}</h4>
                          <p className="text-sm text-muted-foreground font-bold uppercase tracking-wide">
                            {event.type === "time" ? "TIME" : "DISTANCE/HEIGHT"} ({event.unit})
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`result-${index}`} className="text-sm font-black text-foreground uppercase tracking-wide">
                          RESULT
                        </Label>
                        <Input
                          id={`result-${index}`}
                          type="text"
                          placeholder={eventConfigs[selectedEventType].events[index].placeholder}
                          value={event.result}
                          onChange={(e) => updateResult(index, "result", e.target.value)}
                          className="w-full brutal-input bg-input text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`points-${index}`} className="text-sm font-black text-foreground uppercase tracking-wide">
                          POINTS
                        </Label>
                        <Input
                          id={`points-${index}`}
                          type="number"
                          placeholder="0"
                          value={event.points || ""}
                          onChange={(e) => updateResult(index, "points", e.target.value)}
                          className="w-full brutal-input bg-input text-foreground"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="my-8 h-1 bg-border"></div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={calculateTotal} className="flex-1 brutal-button bg-primary text-primary-foreground">
                  <CalculatorIcon className="h-4 w-4 mr-2" />
                  CALCULATE TOTAL
                </Button>
                <Button 
                  onClick={savePerformance} 
                  disabled={savePerformanceMutation.isPending}
                  className="flex-1 brutal-button bg-success text-success-foreground"
                >
                  <Save className="h-4 w-4 mr-2" />
                  SAVE PERFORMANCE
                </Button>
                <Button onClick={clearAll} className="brutal-button bg-destructive text-destructive-foreground">
                  <Eraser className="h-4 w-4 mr-2" />
                  CLEAR ALL
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance History */}
        <Card className="brutal-card bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-2xl font-black uppercase tracking-wide">
                <History className="h-6 w-6 text-primary" />
                PERFORMANCE HISTORY
              </CardTitle>
              <div className="flex items-center space-x-3">
                <Select value={historyFilter} onValueChange={setHistoryFilter}>
                  <SelectTrigger className="w-40 brutal-select bg-input text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ALL EVENTS</SelectItem>
                    <SelectItem value="pentathlon">PENTATHLON</SelectItem>
                    <SelectItem value="heptathlon">HEPTATHLON</SelectItem>
                    <SelectItem value="decathlon">DECATHLON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-border border-t-primary mx-auto mb-4 animate-spin"></div>
                <p className="text-muted-foreground font-bold uppercase tracking-wide">LOADING PERFORMANCES...</p>
              </div>
            ) : performances.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-muted border-4 border-border w-16 h-16 flex items-center justify-center mx-auto mb-4 transform rotate-12">
                  <Trophy className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-bold uppercase tracking-wide">NO PERFORMANCES RECORDED YET</p>
                <p className="text-sm text-muted-foreground mt-1 font-semibold">START BY SELECTING AN EVENT TYPE AND ENTERING RESULTS</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="brutal-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-foreground font-black uppercase tracking-wide">DATE</TableHead>
                      <TableHead className="text-foreground font-black uppercase tracking-wide">EVENT TYPE</TableHead>
                      <TableHead className="text-foreground font-black uppercase tracking-wide">TOTAL SCORE</TableHead>
                      <TableHead className="text-foreground font-black uppercase tracking-wide">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performances.map((performance) => (
                      <TableRow key={performance.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="text-sm text-foreground font-bold">
                          {new Date(performance.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getEventTypeBadgeColor(performance.eventType)} brutal-badge`}>
                            {performance.eventType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-black text-primary text-lg">
                          {performance.totalScore.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" className="brutal-button bg-accent text-accent-foreground p-2">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => deletePerformance(performance.id)}
                              disabled={deletePerformanceMutation.isPending}
                              className="brutal-button bg-destructive text-destructive-foreground p-2"
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
