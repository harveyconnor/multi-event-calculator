import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Target, Clock, TrendingUp, Award, Medal, Crown } from "lucide-react";
import { getAchievements, type StoredAchievement } from "@/lib/localStorage";

interface AchievementTimelineProps {
  userId?: number;
  newAchievements?: StoredAchievement[];
  onClose?: () => void;
}

export default function AchievementTimeline({ userId = 1, newAchievements = [], onClose }: AchievementTimelineProps) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [achievements, setAchievements] = useState<StoredAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Load achievements from localStorage
  useEffect(() => {
    const loadAchievements = () => {
      try {
        const stored = getAchievements();
        setAchievements(stored);
      } catch (error) {
        console.error("Error loading achievements:", error);
      }
    };
    
    loadAchievements();
  }, [userId]);

  useEffect(() => {
    if (newAchievements.length > 0) {
      setShowTimeline(true);
    }
  }, [newAchievements]);

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case "first_performance": return <Star className="h-5 w-5" />;
      case "score_milestone_5000": return <Target className="h-5 w-5" />;
      case "score_milestone_6000": return <Medal className="h-5 w-5" />;
      case "score_milestone_7000": return <Award className="h-5 w-5" />;
      case "score_milestone_8000": return <Crown className="h-5 w-5" />;
      case "event_specialist": return <Trophy className="h-5 w-5" />;
      case "multi_event_master": return <TrendingUp className="h-5 w-5" />;
      case "consistency_champion": return <Target className="h-5 w-5" />;
      case "improvement_streak": return <TrendingUp className="h-5 w-5" />;
      case "perfect_ten": return <Trophy className="h-5 w-5" />;
      default: return <Star className="h-5 w-5" />;
    }
  };

  const getAchievementColor = (type: string) => {
    switch (type) {
      case "first_performance": return "from-green-400 to-emerald-600";
      case "score_milestone_5000": return "from-yellow-400 to-orange-600";
      case "score_milestone_6000": return "from-blue-400 to-indigo-600";
      case "score_milestone_7000": return "from-amber-400 to-orange-600";
      case "score_milestone_8000": return "from-purple-400 to-pink-600";
      case "event_specialist": return "from-red-400 to-rose-600";
      case "multi_event_master": return "from-teal-400 to-cyan-600";
      case "consistency_champion": return "from-violet-400 to-purple-600";
      case "improvement_streak": return "from-emerald-400 to-green-600";
      case "perfect_ten": return "from-pink-400 to-rose-600";
      default: return "from-gray-400 to-gray-600";
    }
  };

  const totalPoints = 0;

  return (
    <div className="space-y-4">
      {/* Achievement Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="glass-icon-container w-8 h-8 flex items-center justify-center bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400/30">
            <Trophy className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Achievements</h3>
            <p className="text-sm text-muted-foreground">
              {achievements.length} unlocked • {totalPoints} points
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowTimeline(!showTimeline)}
          className="glass-button text-foreground hover:text-foreground text-sm"
        >
          {showTimeline ? "Hide Timeline" : "Show Timeline"}
        </Button>
      </div>

      {/* New Achievement Notifications */}
      {newAchievements.length > 0 && (
        <div className="space-y-2">
          {newAchievements.map((achievement) => (
            <Card
              key={achievement.id}
              className="glass-card border-2 border-yellow-400/50 animate-pulse"
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`glass-icon-container w-12 h-12 flex items-center justify-center bg-gradient-to-br ${getAchievementColor(achievement.achievementType)} border-yellow-400/30`}>
                    {getAchievementIcon(achievement.achievementType)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-foreground">{achievement.title}</h4>
                      <Badge className="glass-badge bg-yellow-500/20 text-yellow-200 border-yellow-400/30">
                        New!
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm font-medium text-yellow-400">{achievement.points} points</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Achievement Timeline */}
      {showTimeline && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Clock className="h-4 w-4" />
              Achievement Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {achievements.length === 0 ? (
              <div className="text-center py-8">
                <div className="glass-icon-container w-16 h-16 flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-gray-500/20 to-gray-600/20 border-gray-400/30">
                  <Trophy className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-muted-foreground font-medium">No achievements yet</p>
                <p className="text-sm text-muted-foreground mt-1">Start completing performances to unlock achievements!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <div key={achievement.id} className="flex items-start space-x-4">
                    {/* Timeline Line */}
                    <div className="flex flex-col items-center">
                      <div className={`glass-icon-container w-10 h-10 flex items-center justify-center bg-gradient-to-br ${getAchievementColor(achievement.achievementType)} border-current`}>
                        {getAchievementIcon(achievement.achievementType)}
                      </div>
                      {index < achievements.length - 1 && (
                        <div className="w-0.5 h-12 bg-gradient-to-b from-muted-foreground/30 to-transparent mt-2" />
                      )}
                    </div>
                    
                    {/* Achievement Content */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-foreground">{achievement.title}</h4>
                        <Badge className="glass-badge bg-blue-500/20 text-blue-200 border-blue-400/30">
                          {achievement.points} pts
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Achievement Progress */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <TrendingUp className="h-4 w-4" />
            Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-foreground">Achievement Progress</span>
                <span className="text-sm text-muted-foreground">{achievements.length}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(achievements.length / 10) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-3 text-center">
                <div className="text-2xl font-bold text-foreground">{totalPoints}</div>
                <div className="text-xs text-muted-foreground">Total Points</div>
              </div>
              <div className="glass-card p-3 text-center">
                <div className="text-2xl font-bold text-foreground">{achievements.length}</div>
                <div className="text-xs text-muted-foreground">Achievements</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}