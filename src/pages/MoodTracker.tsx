import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MoodTrackerComponent from '@/components/tracker/MoodTracker';
import { MoodDistributionChart } from '@/components/tracker/MoodDistributionChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { moodTrackerService } from '@/services/moodTracker';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Utility function to convert various date formats to Date object
const convertToDate = (dateValue: any): Date => {
  if (dateValue instanceof Date) {
    return dateValue;
  }
  // Firebase Timestamp has toDate() method
  if (dateValue && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }
  // Try parsing as string or number
  return new Date(dateValue);
};

const MoodTracker = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [moodDistribution, setMoodDistribution] = useState<{ mood: number; count: number }[]>([]);
  const [moodEntries, setMoodEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchMoodData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const entries = await moodTrackerService.getUserMoodEntries(currentUser.uid);
        
        // Store entries for trend analysis
        setMoodEntries(entries);
        
        // Calculate distribution
        const distribution = Array.from({ length: 5 }, (_, i) => ({ mood: i + 1, count: 0 }));
        entries.forEach(entry => {
          const moodIndex = entry.mood - 1;
          if (moodIndex >= 0 && moodIndex < 5) {
            distribution[moodIndex].count += 1;
          }
        });
        
        setMoodDistribution(distribution);
      } catch (error) {
        console.error('Error fetching mood data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load data. Please try again."
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMoodData();
  }, [currentUser, toast]);

  // Format entries for trend chart
  const formatTrendData = () => {
    return moodEntries
      .slice()
      .sort((a, b) => {
        const dateA = convertToDate(a.createdAt);
        const dateB = convertToDate(b.createdAt);
        return dateA.getTime() - dateB.getTime();
      })
      .map(entry => {
        const date = convertToDate(entry.createdAt);
        
        return {
          date: format(date, 'MMM d'),
          mood: entry.mood,
          anxiety: entry.anxietyLevel || 0
        };
      });
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mood Tracker</h1>
          <p className="text-muted-foreground">Monitor your emotional wellbeing and identify patterns over time</p>
        </div>
        
        <MoodTrackerComponent />
        
        <Card>
          <CardHeader>
            <CardTitle>Mood Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-[300px] w-full" />
              </div>
            ) : (
              <Tabs defaultValue="distribution" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="distribution">Distribution</TabsTrigger>
                  <TabsTrigger value="trend">Trend Analysis</TabsTrigger>
                </TabsList>
                
                <TabsContent value="distribution" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MoodDistributionChart moodData={moodDistribution} />
                    <div className="flex flex-col justify-center">
                      <h3 className="text-lg font-medium mb-2">Mood Insights</h3>
                      {moodEntries.length > 0 ? (
                        <div className="space-y-4">
                          <p>
                            Based on your {moodEntries.length} mood entries:
                          </p>
                          <ul className="list-disc list-inside space-y-2">
                            {moodDistribution.filter(m => m.count > 0).map((item) => (
                              <li key={item.mood}>
                                {item.count} days with {moodTrackerService.getMoodText(item.mood)} mood
                                ({Math.round((item.count / moodEntries.length) * 100)}%)
                              </li>
                            ))}
                          </ul>
                          <p className="text-sm text-muted-foreground mt-4">
                            Continue tracking your mood daily to see more accurate patterns over time.
                          </p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">
                          Start tracking your mood to see insights
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="trend" className="mt-4">
                  <div className="h-[300px]">
                    {moodEntries.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={formatTrendData()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="mood" 
                            stroke="#8884d8" 
                            strokeWidth={2}
                            activeDot={{ r: 8 }}
                            name="Mood"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="anxiety" 
                            stroke="#82ca9d"
                            name="Anxiety"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No trend data available yet
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MoodTracker;
