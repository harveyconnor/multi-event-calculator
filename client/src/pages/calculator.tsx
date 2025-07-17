import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye, Calculator as CalculatorIcon, Save, Eraser, Trophy, Medal, Crown, Clock, Ruler, History, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { type Performance, type EventResult } from "@shared/schema";

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
      calculatePointsForEvent(index, value);
    } else {
      newResults[index].points = parseInt(value) || 0;
    }
    setEventResults(newResults);
    calculateTotal();
  };

  const calculatePointsForEvent = async (index: number, result: string) => {
    if (!selectedEventType || !result.trim()) return;
    
    const event = eventResults[index];
    try {
      const response = await fetch(`/api/calculate-points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: selectedEventType,
          eventName: event.name,
          result: result,
          type: event.type
        })
      });
      
      if (response.ok) {
        const { points } = await response.json();
        const newResults = [...eventResults];
        newResults[index].points = points;
        setEventResults(newResults);
        calculateTotal();
      }
    } catch (error) {
      console.error("Failed to calculate points:", error);
    }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CalculatorIcon className="h-8 w-8" />
              <h1 className="text-2xl font-bold">Athletics Multi-Event Calculator</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="secondary" size="sm" className="bg-white bg-opacity-20 hover:bg-opacity-30">
                <History className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">History</span>
              </Button>
              <Button variant="secondary" size="sm" className="bg-white bg-opacity-20 hover:bg-opacity-30">
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Event Type Selection */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Event Type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(Object.keys(eventConfigs) as EventType[]).map((eventType) => (
                <Button
                  key={eventType}
                  variant={selectedEventType === eventType ? "default" : "outline"}
                  className={`h-auto p-4 ${
                    selectedEventType === eventType
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-100 hover:bg-primary hover:text-primary-foreground"
                  }`}
                  onClick={() => selectEventType(eventType)}
                >
                  <div className="flex items-center space-x-3">
                    {getEventTypeIcon(eventType)}
                    <div className="text-left">
                      <h3 className="font-semibold text-lg">{eventConfigs[eventType].name}</h3>
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
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  {eventConfigs[selectedEventType].name} Calculator
                  <span className="text-sm text-gray-500 ml-2">- Enter results and points</span>
                </h2>
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <span className="text-sm font-medium text-gray-600">Total Score:</span>
                  <span className="text-2xl font-bold text-primary ml-2">{totalScore.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                {eventResults.map((event, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="flex items-center space-x-3">
                      {event.type === "time" ? (
                        <Clock className="h-5 w-5 text-primary" />
                      ) : (
                        <Ruler className="h-5 w-5 text-primary" />
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-800">{event.name}</h4>
                        <p className="text-sm text-gray-500">
                          {event.type === "time" ? "Time" : "Distance/Height"} ({event.unit})
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`result-${index}`} className="text-sm font-medium text-gray-700">
                        Result
                      </Label>
                      <Input
                        id={`result-${index}`}
                        type="text"
                        placeholder={eventConfigs[selectedEventType].events[index].placeholder}
                        value={event.result}
                        onChange={(e) => updateResult(index, "result", e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`points-${index}`} className="text-sm font-medium text-gray-700">
                        Points
                      </Label>
                      <Input
                        id={`points-${index}`}
                        type="number"
                        placeholder="0"
                        value={event.points || ""}
                        onChange={(e) => updateResult(index, "points", e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button onClick={calculateTotal} className="flex-1">
                  <CalculatorIcon className="h-4 w-4 mr-2" />
                  Calculate Total
                </Button>
                <Button 
                  onClick={savePerformance} 
                  disabled={savePerformanceMutation.isPending}
                  className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Performance
                </Button>
                <Button onClick={clearAll} variant="outline">
                  <Eraser className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance History */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Performance History</h2>
              <div className="flex items-center space-x-2">
                <Select value={historyFilter} onValueChange={setHistoryFilter}>
                  <SelectTrigger className="w-40">
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

            {isLoading ? (
              <div className="text-center py-8">Loading performances...</div>
            ) : performances.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No performances recorded yet. Start by selecting an event type and entering results.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Total Score</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performances.map((performance) => (
                      <TableRow key={performance.id}>
                        <TableCell className="text-sm">
                          {new Date(performance.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getEventTypeBadgeColor(performance.eventType)}>
                            {performance.eventType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-primary">
                          {performance.totalScore.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deletePerformance(performance.id)}
                              disabled={deletePerformanceMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
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
