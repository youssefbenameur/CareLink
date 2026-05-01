import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Moon, Activity, Plus, TrendingUp, X, Frown, Meh, Smile, SmilePlus, Edit2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { moodTrackerService, MoodEntry } from '@/services/moodTracker';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const MOOD_CONFIG = [
  { value: 1, label: 'Poor',  Icon: Frown,     iconColor: 'text-red-500',    color: 'bg-red-500',    text: 'text-red-500',    bar: 'bg-red-500' },
  { value: 2, label: 'Low',   Icon: Frown,     iconColor: 'text-orange-500', color: 'bg-orange-500', text: 'text-orange-500', bar: 'bg-orange-500' },
  { value: 3, label: 'Okay',  Icon: Meh,       iconColor: 'text-amber-500',  color: 'bg-amber-500',  text: 'text-amber-500',  bar: 'bg-amber-500' },
  { value: 4, label: 'Good',  Icon: Smile,     iconColor: 'text-teal-500',   color: 'bg-teal-500',   text: 'text-teal-500',   bar: 'bg-teal-500' },
  { value: 5, label: 'Great', Icon: SmilePlus, iconColor: 'text-green-500',  color: 'bg-green-500',  text: 'text-green-500',  bar: 'bg-green-500' },
];

const ACTIVITIES = [
  'Exercise', 'Reading', 'Meditation', 'Socializing',
  'Working', 'Studying', 'Family time', 'Nature walk',
  'Creative hobby', 'Screen time', 'Rest',
];

const convertToDate = (d: Date | Timestamp): Date =>
  d instanceof Timestamp ? d.toDate() : d as Date;

const MoodTracker = () => {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingEntry, setAddingEntry] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hasLoggedToday, setHasLoggedToday] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const [newEntry, setNewEntry] = useState({
    mood: 3, notes: '', sleepHours: 7, anxietyLevel: 2, activities: [] as string[],
  });
  const [selectedActivity, setSelectedActivity] = useState('');

  const fetchMoodEntries = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const entries = await moodTrackerService.getUserMoodEntries(currentUser.uid);
      setMoodEntries(entries);
      setHasLoggedToday(await moodTrackerService.hasLoggedMoodToday(currentUser.uid));
    } catch {
      toast({ variant: 'destructive', title: 'Failed to load', description: 'Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMoodEntries(); }, [currentUser]);

  const handleAddEntry = async () => {
    if (!currentUser) return;
    if (hasLoggedToday && !editingId) {
      toast({ variant: 'destructive', title: 'Already logged today', description: 'Come back tomorrow.' });
      return;
    }
    try {
      if (editingId) {
        // Update existing entry
        await moodTrackerService.updateMoodEntry(editingId, { ...newEntry });
        toast({ title: 'Mood updated', description: 'Your entry has been saved.' });
        setEditingId(null);
      } else {
        // Add new entry
        await moodTrackerService.addMoodEntry({ userId: currentUser.uid, ...newEntry });
        toast({ title: 'Mood logged', description: 'Your entry has been saved.' });
      }
      setAddingEntry(false);
      setNewEntry({ mood: 3, notes: '', sleepHours: 7, anxietyLevel: 2, activities: [] });
      fetchMoodEntries();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed to save', description: e.message });
    }
  };

  const handleEditEntry = (entry: MoodEntry) => {
    setNewEntry({
      mood: entry.mood,
      notes: entry.notes || '',
      sleepHours: entry.sleepHours || 7,
      anxietyLevel: entry.anxietyLevel || 2,
      activities: entry.activities || [],
    });
    setEditingId(entry.id || null);
    setAddingEntry(true);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      await moodTrackerService.deleteMoodEntry(entryId);
      toast({ title: 'Deleted', description: 'Entry has been removed.' });
      fetchMoodEntries();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed to delete', description: e.message });
    }
  };

  const moodConfig = (v: number) => MOOD_CONFIG.find(m => m.value === v) ?? MOOD_CONFIG[2];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  if (addingEntry) {
    const cfg = moodConfig(newEntry.mood);
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{editingId ? 'Edit mood entry' : 'How are you feeling?'}</CardTitle>
              <CardDescription>{editingId ? 'Update your emotional state' : 'Log your emotional state for today'}</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => { setAddingEntry(false); setEditingId(null); }}><X className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mood selector */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Mood level</Label>
            <div className="flex gap-2">
              {MOOD_CONFIG.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setNewEntry(p => ({ ...p, mood: m.value }))}
                  className={cn(
                    'flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all flex flex-col items-center gap-1',
                    newEntry.mood === m.value
                      ? `border-transparent ${m.color} text-white shadow-md scale-105`
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  )}
                >
                  <m.Icon className={cn('h-6 w-6', newEntry.mood === m.value ? 'text-white' : m.iconColor)} />
                  <span className="text-xs">{m.label}</span>
                </button>
              ))}
            </div>
            <div className={cn('text-center text-sm font-medium flex items-center justify-center gap-1.5', cfg.text)}>
              <cfg.Icon className={cn('h-4 w-4', cfg.iconColor)} /> Selected: {cfg.label}
            </div>
          </div>

          {/* Sleep & Anxiety */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm"><Moon className="h-3.5 w-3.5" /> Sleep hours</Label>
              <input
                type="range" min="0" max="12" step="0.5"
                value={newEntry.sleepHours}
                onChange={e => setNewEntry(p => ({ ...p, sleepHours: parseFloat(e.target.value) }))}
                className="w-full accent-primary"
              />
              <div className="text-center text-sm font-semibold">{newEntry.sleepHours}h</div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm"><Activity className="h-3.5 w-3.5" /> Anxiety level</Label>
              <input
                type="range" min="1" max="5" step="1"
                value={newEntry.anxietyLevel}
                onChange={e => setNewEntry(p => ({ ...p, anxietyLevel: parseInt(e.target.value) }))}
                className="w-full accent-primary"
              />
              <div className="text-center text-sm font-semibold">{newEntry.anxietyLevel}/5</div>
            </div>
          </div>

          {/* Activities */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Activities today</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {newEntry.activities.map(a => (
                <Badge key={a} variant="secondary" className="gap-1 pr-1">
                  {a}
                  <button onClick={() => setNewEntry(p => ({ ...p, activities: p.activities.filter(x => x !== a) }))}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Select value={selectedActivity} onValueChange={setSelectedActivity}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Add activity" /></SelectTrigger>
                <SelectContent>
                  {ACTIVITIES.filter(a => !newEntry.activities.includes(a)).map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon"
                disabled={!selectedActivity}
                onClick={() => {
                  if (selectedActivity) {
                    setNewEntry(p => ({ ...p, activities: [...p.activities, selectedActivity] }));
                    setSelectedActivity('');
                  }
                }}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              placeholder="How was your day? What's on your mind?"
              value={newEntry.notes}
              onChange={e => setNewEntry(p => ({ ...p, notes: e.target.value }))}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => { setAddingEntry(false); setEditingId(null); }}>Cancel</Button>
            <Button className="flex-1" onClick={handleAddEntry}>{editingId ? 'Save changes' : 'Save entry'}</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Mood Tracker</CardTitle>
            <CardDescription>Track your daily emotional wellbeing</CardDescription>
          </div>
          <Button onClick={() => setAddingEntry(true)} disabled={hasLoggedToday && !editingId} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            {hasLoggedToday ? 'Logged today' : 'Log mood'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {moodEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <TrendingUp className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium">No entries yet</p>
            <p className="text-sm text-muted-foreground mt-1">Start tracking your mood to see insights here</p>
            <Button variant="outline" className="mt-4" onClick={() => setAddingEntry(true)}>
              Log your first entry
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="overview">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
              <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Recent 7 days */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recent entries</p>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {moodEntries.slice(0, 7).map((entry, i) => {
                    const cfg = moodConfig(entry.mood);
                    const d = convertToDate(entry.createdAt);
                    return (
                      <div key={entry.id ?? i} className={cn('flex flex-col items-center gap-1.5 min-w-[72px] p-3 rounded-xl border-2', `border-${cfg.color.replace('bg-', '')}`)}>
                        <span className="text-[11px] text-muted-foreground font-medium">{format(d, 'MMM d')}</span>
                        <cfg.Icon className={cn('h-7 w-7', cfg.iconColor)} />
                        <span className={cn('text-xs font-semibold', cfg.text)}>{cfg.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Distribution bars */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Mood distribution</p>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map(v => {
                    const cfg = moodConfig(v);
                    const count = moodEntries.filter(e => e.mood === v).length;
                    const pct = moodEntries.length > 0 ? Math.round((count / moodEntries.length) * 100) : 0;
                    return (
                      <div key={v} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className={cn('font-semibold flex items-center gap-1.5', cfg.text)}>
                            <cfg.Icon className={cn('h-4 w-4', cfg.iconColor)} /> {cfg.label}
                          </span>
                          <span className="text-muted-foreground">{count} day{count !== 1 ? 's' : ''} · {pct}%</span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full transition-all duration-500', cfg.bar)} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-3">
              {moodEntries.map((entry, i) => {
                const cfg = moodConfig(entry.mood);
                const d = convertToDate(entry.createdAt);
                return (
                  <div key={entry.id ?? i} className="flex items-start gap-3 p-3 rounded-xl border group hover:bg-muted/50 transition-colors">
                    <div className={cn('h-9 w-9 rounded-full flex items-center justify-center shrink-0 bg-muted', cfg.color.replace('bg-', 'bg-') + '/10')}>
                      <cfg.Icon className={cn('h-5 w-5', cfg.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={cn('text-sm font-semibold', cfg.text)}>{cfg.label}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{format(d, 'MMM d, yyyy')}</span>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleEditEntry(entry)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive" onClick={() => handleDeleteEntry(entry.id!)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      {entry.notes && <p className="text-xs text-muted-foreground mt-0.5">{entry.notes}</p>}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {entry.sleepHours !== undefined && <span><Moon className="h-3 w-3 inline mr-0.5" />{entry.sleepHours}h sleep</span>}
                        {entry.anxietyLevel !== undefined && <span><Activity className="h-3 w-3 inline mr-0.5" />Anxiety {entry.anxietyLevel}/5</span>}
                      </div>
                      {entry.activities && entry.activities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {entry.activities.map(a => <Badge key={a} variant="outline" className="text-[10px] px-1.5 py-0">{a}</Badge>)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default MoodTracker;
