import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MoodTrackerComponent from '@/components/tracker/MoodTracker';
import { MoodDistributionChart } from '@/components/tracker/MoodDistributionChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { moodTrackerService } from '@/services/moodTracker';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

const MoodTracker = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation(['moodTracker', 'common']);
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
          title: t('common:error'),
          description: t('common:failedToLoadTryAgain')
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
        // Sort by date
        const dateA = a.createdAt instanceof Date 
          ? a.createdAt 
          : a.createdAt.toDate();
        const dateB = b.createdAt instanceof Date 
          ? b.createdAt 
          : b.createdAt.toDate();
        return dateA - dateB;
      })
      .map(entry => {
        const date = entry.createdAt instanceof Date 
          ? entry.createdAt 
          : entry.createdAt.toDate();
        
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
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        
        <MoodTrackerComponent />
        
        <Card>
          <CardHeader>
            <CardTitle>{t('moodAnalytics')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-[300px] w-full" />
              </div>
            ) : (
              <Tabs defaultValue="distribution" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="distribution">{t('distribution')}</TabsTrigger>
                  <TabsTrigger value="trend">{t('trendAnalysis')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="distribution" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MoodDistributionChart moodData={moodDistribution} />
                    <div className="flex flex-col justify-center">
                      <h3 className="text-lg font-medium mb-2">{t('moodInsights')}</h3>
                      {moodEntries.length > 0 ? (
                        <div className="space-y-4">
                          <p>
                            {t('insights.based', { count: moodEntries.length })}
                          </p>
                          <ul className="list-disc list-inside space-y-2">
                            {moodDistribution.filter(m => m.count > 0).map((item) => (
                              <li key={item.mood}>
                                {item.count} {t('days')} {t('with')} {t(`moods.${moodTrackerService.getMoodText(item.mood).toLowerCase()}`)} {t('mood')}
                                ({Math.round((item.count / moodEntries.length) * 100)}%)
                              </li>
                            ))}
                          </ul>
                          <p className="text-sm text-muted-foreground mt-4">
                            {t('insights.continueTracking')}
                          </p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">
                          {t('startTracking')}
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
                            name={t('mood')}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="anxiety" 
                            stroke="#82ca9d"
                            name={t('moods.anxious')}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        {t('noTrendData')}
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
