import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Smile, Frown, Meh, Moon, Activity, Plus, Calendar, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { moodTrackerService, MoodEntry } from '@/services/moodTracker';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedSection } from '@/components/ui/animated-section';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

const MoodTracker = () => {
  const { t } = useTranslation(['moodTracker', 'common']);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingEntry, setAddingEntry] = useState(false);
  const [hasLoggedToday, setHasLoggedToday] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  const [newEntry, setNewEntry] = useState({
    mood: 3,
    notes: '',
    sleepHours: 7,
    anxietyLevel: 2,
    activities: [] as string[]
  });
  
  const activityOptions = [
    'Exercise', 'Reading', 'Meditation', 'Socializing', 
    'Working', 'Studying', 'Family time', 'Nature walk',
    'Creative hobby', 'Screen time', 'Rest'
  ];
  
  const [selectedActivity, setSelectedActivity] = useState('');
  
  const convertToDate = (dateOrTimestamp: Date | Timestamp): Date => {
    if (dateOrTimestamp instanceof Timestamp) {
      return dateOrTimestamp.toDate();
    }
    return dateOrTimestamp as Date;
  };
  
  const fetchMoodEntries = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const entries = await moodTrackerService.getUserMoodEntries(currentUser.uid);
      setMoodEntries(entries);
      
      const loggedToday = await moodTrackerService.hasLoggedMoodToday(currentUser.uid);
      setHasLoggedToday(loggedToday);
    } catch (error) {
      console.error('Error fetching mood entries:', error);
      toast({
        variant: "destructive",
        title: t('common:failedToLoad'),
        description: t('common:tryAgainLater'),
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMoodEntries();
  }, [currentUser]);
  
  const handleAddEntry = async () => {
    if (!currentUser) {
      toast({
        variant: "destructive",
        title: t('common:authRequired'),
        description: t('common:mustBeLoggedIn'),
      });
      return;
    }
    
    if (hasLoggedToday) {
      toast({
        variant: "destructive",
        title: t('entryLimitReached'),
        description: t('comeBackTomorrow'),
      });
      return;
    }
    
    try {
      await moodTrackerService.addMoodEntry({
        userId: currentUser.uid,
        ...newEntry
      });
      
      toast({
        title: t('entryAdded'),
        description: t('moodRecorded'),
      });
      
      setAddingEntry(false);
      setNewEntry({
        mood: 3,
        notes: '',
        sleepHours: 7,
        anxietyLevel: 2,
        activities: []
      });
      setSelectedActivity('');
      
      fetchMoodEntries();
    } catch (error) {
      console.error('Error adding mood entry:', error);
      toast({
        variant: "destructive",
        title: t('common:failedToAdd'),
        description: error instanceof Error ? error.message : t('common:tryAgainLater'),
      });
    }
  };
  
  const getMoodIcon = (mood: number, size = 20) => {
    if (mood >= 4) return <Smile size={size} className="text-green-500" />;
    if (mood <= 2) return <Frown size={size} className="text-red-500" />;
    return <Meh size={size} className="text-amber-500" />;
  };
  
  const getMoodText = (mood: number) => {
    return moodTrackerService.getMoodText(mood);
  };
  
  const getMoodColor = (mood: number) => {
    if (mood >= 4) return "bg-green-500";
    if (mood === 3) return "bg-amber-500";
    return "bg-red-500";
  };
  
  const addActivity = () => {
    if (selectedActivity && !newEntry.activities.includes(selectedActivity)) {
      setNewEntry({
        ...newEntry,
        activities: [...newEntry.activities, selectedActivity]
      });
      setSelectedActivity('');
    }
  };
  
  const removeActivity = (activity: string) => {
    setNewEntry({
      ...newEntry,
      activities: newEntry.activities.filter(a => a !== activity)
    });
  };
  
  const renderMoodChart = () => {
    if (moodEntries.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 border rounded-md bg-muted/10">
          <Meh size={40} className="text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('noDataYet')}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setAddingEntry(true)}
            disabled={hasLoggedToday}
          >
            {hasLoggedToday ? t('alreadyLogged') : t('logFirstEntry')}
          </Button>
        </div>
      );
    }
    
    const moodCounts = {
      5: moodEntries.filter(e => e.mood === 5).length,
      4: moodEntries.filter(e => e.mood === 4).length,
      3: moodEntries.filter(e => e.mood === 3).length,
      2: moodEntries.filter(e => e.mood === 2).length,
      1: moodEntries.filter(e => e.mood === 1).length
    };
    
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 md:gap-4">
          {moodEntries.slice(0, 14).map((entry, index) => {
            const date = convertToDate(entry.createdAt);
            return (
              <div 
                key={entry.id || index} 
                className="flex flex-col items-center p-2 border rounded-md min-w-[80px] shadow-sm"
                title={entry.notes}
              >
                <span className="text-xs text-muted-foreground">{format(date, 'MMM d')}</span>
                <div className="my-2">
                  {getMoodIcon(entry.mood, 28)}
                </div>
                <span className="text-sm font-medium">{t(`moods.${getMoodText(entry.mood).toLowerCase()}`)}</span>
              </div>
            );
          })}
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t('moodDistribution')}</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(moodLevel => {
              const count = moodCounts[moodLevel];
              const percentage = moodEntries.length > 0 ? Math.round((count / moodEntries.length) * 100) : 0;
              
              return (
                <div key={moodLevel} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getMoodIcon(moodLevel)}
                      <span className="ml-2 text-sm">{t(`moods.${getMoodText(moodLevel).toLowerCase()}`)}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{percentage}%</span>
                  </div>
                  <Progress value={percentage} className={`h-2 ${getMoodColor(moodLevel)}`} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <AnimatedSection>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('title')}</CardTitle>
              <CardDescription>{t('subtitle')}</CardDescription>
            </div>
            <Button 
              onClick={() => setAddingEntry(true)} 
              disabled={hasLoggedToday || addingEntry}
            >
              <Plus className="mr-2 h-4 w-4" />
              {hasLoggedToday ? t('alreadyLogged') : t('logTodayMood')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : addingEntry ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('howAreYou')}</CardTitle>
                <CardDescription>{t('logEmotionalState')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>{t('mood')}</Label>
                  <div className="flex justify-between items-center space-x-2">
                    {[1, 2, 3, 4, 5].map(value => (
                      <Button
                        key={value}
                        type="button"
                        variant={newEntry.mood === value ? "default" : "outline"}
                        onClick={() => setNewEntry({ ...newEntry, mood: value })}
                        className="flex-1 flex flex-col items-center py-6"
                      >
                        {value === 1 && <Frown className="h-6 w-6 mb-1 text-red-500" />}
                        {value === 2 && <Frown className="h-6 w-6 mb-1 text-orange-500" />}
                        {value === 3 && <Meh className="h-6 w-6 mb-1 text-amber-500" />}
                        {value === 4 && <Smile className="h-6 w-6 mb-1 text-green-500" />}
                        {value === 5 && <Smile className="h-6 w-6 mb-1 text-emerald-500" />}
                        <span>{t(`moods.${getMoodText(value).toLowerCase()}`)}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sleepHours">{t('sleepHours')}</Label>
                    <div className="flex items-center space-x-2">
                      <Moon className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="sleepHours"
                        type="number"
                        min="0"
                        max="24"
                        value={newEntry.sleepHours}
                        onChange={(e) => setNewEntry({ 
                          ...newEntry, 
                          sleepHours: parseInt(e.target.value) || 0 
                        })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="anxietyLevel">{t('anxietyLevel')}</Label>
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="anxietyLevel"
                        type="number"
                        min="1"
                        max="5"
                        value={newEntry.anxietyLevel}
                        onChange={(e) => setNewEntry({ 
                          ...newEntry, 
                          anxietyLevel: parseInt(e.target.value) || 1 
                        })}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>{t('activities')}</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newEntry.activities.map(activity => (
                      <Badge key={activity} variant="secondary" className="px-3 py-1">
                        {activity}
                        <X
                          className="ml-1 h-3 w-3 cursor-pointer"
                          onClick={() => removeActivity(activity)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select value={selectedActivity} onValueChange={setSelectedActivity}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={t('selectActivity')} />
                      </SelectTrigger>
                      <SelectContent>
                        {activityOptions.map(activity => (
                          <SelectItem key={activity} value={activity}>
                            {activity}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={addActivity}
                      disabled={!selectedActivity}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">{t('notes')}</Label>
                  <Textarea
                    id="notes"
                    placeholder={t('notePlaceholder')}
                    value={newEntry.notes}
                    onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                    rows={4}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setAddingEntry(false)}>
                  {t('cancel')}
                </Button>
                <Button onClick={handleAddEntry}>
                  {t('save')}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Tabs defaultValue="chart">
              <TabsList className="mb-4">
                <TabsTrigger value="chart">{t('chart')}</TabsTrigger>
                <TabsTrigger value="list">{t('list')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chart">
                {renderMoodChart()}
              </TabsContent>
              
              <TabsContent value="list">
                {moodEntries.length > 0 ? (
                  <div className="space-y-4">
                    {moodEntries.map((entry, index) => (
                      <Card key={entry.id || index}>
                        <CardHeader className="py-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              {getMoodIcon(entry.mood)}
                              <CardTitle className="text-lg">{t(`moods.${getMoodText(entry.mood).toLowerCase()}`)}</CardTitle>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(convertToDate(entry.createdAt), 'PPP')}
                            </p>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="py-2 space-y-3">
                          {entry.notes && (
                            <p className="text-sm">{entry.notes}</p>
                          )}
                          
                          <div className="flex flex-wrap gap-3 text-sm">
                            {entry.sleepHours !== undefined && (
                              <div className="flex items-center">
                                <Moon className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span>{t('sleepHours')}: {entry.sleepHours}h</span>
                              </div>
                            )}
                            
                            {entry.anxietyLevel !== undefined && (
                              <div className="flex items-center">
                                <Activity className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span>{t('anxietyLevel')}: {entry.anxietyLevel}/5</span>
                              </div>
                            )}
                          </div>
                          
                          {entry.activities && entry.activities.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {entry.activities.map(activity => (
                                <Badge key={activity} variant="outline" className="px-2 py-1">
                                  {activity}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 border rounded-md bg-muted/10">
                    <Calendar size={40} className="text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">{t('noData')}</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setAddingEntry(true)}
                      disabled={hasLoggedToday}
                    >
                      {hasLoggedToday ? t('alreadyLogged') : t('logFirstEntry')}
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </AnimatedSection>
  );
};

export default MoodTracker;
