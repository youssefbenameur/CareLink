import { useState, useEffect } from 'react';
import DoctorLayout from '@/components/layout/DoctorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentService, Appointment, convertToDate } from '@/services/appointmentService';
import { format, isToday, isThisWeek, isThisMonth, isBefore, startOfDay } from 'date-fns';
import { Clock, Video, MessageSquare, MapPin, CalendarDays, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { DoctorAppointmentCalendar } from '@/components/doctor/DoctorAppointmentCalendar';
import { cn } from '@/lib/utils';

type UpcomingFilter = 'today' | 'week' | 'month';

const FILTERS: { value: UpcomingFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

const typeConfig: Record<string, { icon: any; accent: string; iconBg: string; badge: string; label: string }> = {
  'Video Call': {
    icon: Video,
    accent: 'border-l-blue-500',
    iconBg: 'bg-blue-500/10 text-blue-600',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    label: 'Video Call',
  },
  'Chat Session': {
    icon: MessageSquare,
    accent: 'border-l-violet-500',
    iconBg: 'bg-violet-500/10 text-violet-600',
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    label: 'Chat Session',
  },
  'In-person': {
    icon: MapPin,
    accent: 'border-l-emerald-500',
    iconBg: 'bg-emerald-500/10 text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: 'In-person Visit',
  },
  'In-person Visit': {
    icon: MapPin,
    accent: 'border-l-emerald-500',
    iconBg: 'bg-emerald-500/10 text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: 'In-person Visit',
  },
};

const statusStyle = (status: string) => {
  if (status === 'scheduled') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (status === 'completed') return 'bg-green-50 text-green-700 border-green-200';
  if (status === 'cancelled') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-yellow-50 text-yellow-700 border-yellow-200';
};

const DoctorAppointments = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingFilter, setUpcomingFilter] = useState<UpcomingFilter>('today');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarFiltered, setCalendarFiltered] = useState<Appointment[] | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  useEffect(() => { fetchAppointments(); }, [currentUser]);

  const fetchAppointments = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const data = await appointmentService.getDoctorAppointments(currentUser.uid);
      setAppointments(data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load appointments.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'scheduled' | 'completed' | 'cancelled') => {
    try {
      if (status === 'cancelled') {
        setConfirmCancelId(id);
        return;
      }
      await appointmentService.updateAppointmentStatus(id, status);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      toast({ title: 'Updated', description: `Appointment marked as ${status}.` });
    } catch {
      toast({ title: 'Error', description: 'Failed to update.', variant: 'destructive' });
    }
  };

  const confirmCancel = async () => {
    if (!confirmCancelId) return;
    try {
      await appointmentService.deleteAppointment(confirmCancelId);
      setAppointments(prev => prev.filter(a => a.id !== confirmCancelId));
      toast({ title: 'Appointment deleted', description: 'The appointment has been removed.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete.', variant: 'destructive' });
    } finally {
      setConfirmCancelId(null);
    }
  };

  const now = startOfDay(new Date());

  const upcoming = appointments.filter(a => {
    const d = convertToDate(a.date);
    if (isBefore(d, now)) return false;
    if (upcomingFilter === 'today') return isToday(d);
    if (upcomingFilter === 'week') return isThisWeek(d, { weekStartsOn: 1 });
    return isThisMonth(d);
  }).sort((a, b) => convertToDate(a.date).getTime() - convertToDate(b.date).getTime());

  const past = appointments
    .filter(a => isBefore(convertToDate(a.date), now))
    .sort((a, b) => convertToDate(b.date).getTime() - convertToDate(a.date).getTime());

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    setCalendarFiltered(
      appointments.filter(a => format(convertToDate(a.date), 'yyyy-MM-dd') === dateStr)
    );
  };

  return (
    <>
    <DoctorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
            <p className="text-muted-foreground mt-1">Manage your schedule</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
            <Calendar className="h-4 w-4" />
            {format(new Date(), 'EEEE, MMMM d')}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Calendar */}
          <Card className="col-span-1 md:col-span-4">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-primary" /> Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DoctorAppointmentCalendar onDateSelect={handleDateSelect} selectedDate={selectedDate} />
              {calendarFiltered !== null && (
                <div className="mt-4 border-t pt-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {format(selectedDate, 'MMM d')} · {calendarFiltered.length} appointment(s)
                  </p>
                  {calendarFiltered.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No appointments this day.</p>
                  ) : calendarFiltered.map(a => (
                    <AppointmentCard key={a.id} appointment={a} onStatusUpdate={updateStatus} compact />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main content */}
          <div className="col-span-1 md:col-span-8">
            <Tabs defaultValue="upcoming" className="space-y-4">
              <TabsList className="w-full h-11 bg-muted/60">
                <TabsTrigger value="upcoming" className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Upcoming
                  <span className="ml-2 bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full">{upcoming.length}</span>
                </TabsTrigger>
                <TabsTrigger value="past" className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Past
                  <span className="ml-2 bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">{past.length}</span>
                </TabsTrigger>
              </TabsList>

              {/* Upcoming */}
              <TabsContent value="upcoming" className="space-y-4 mt-0">
                {/* Filter pills */}
                <div className="flex gap-2">
                  {FILTERS.map(f => {
                    const count = appointments.filter(a => {
                      const d = convertToDate(a.date);
                      if (isBefore(d, now)) return false;
                      if (f.value === 'today') return isToday(d);
                      if (f.value === 'week') return isThisWeek(d, { weekStartsOn: 1 });
                      return isThisMonth(d);
                    }).length;
                    return (
                      <button
                        key={f.value}
                        onClick={() => setUpcomingFilter(f.value)}
                        className={cn(
                          'px-4 py-1.5 rounded-full text-sm font-medium transition-all border flex items-center gap-1.5',
                          upcomingFilter === f.value
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                        )}
                      >
                        {f.label}
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded-full',
                          upcomingFilter === f.value ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                        )}>{count}</span>
                      </button>
                    );
                  })}
                </div>

                {loading ? <Skeletons /> : upcoming.length === 0 ? (
                  <EmptyState message={`No appointments ${upcomingFilter === 'today' ? 'today' : upcomingFilter === 'week' ? 'this week' : 'this month'}.`} />
                ) : (
                  <div className="space-y-3">
                    {upcoming.map(a => (
                      <AppointmentCard key={a.id} appointment={a} onStatusUpdate={updateStatus} showDate />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Past */}
              <TabsContent value="past" className="mt-0">
                {loading ? <Skeletons /> : past.length === 0 ? (
                  <EmptyState message="No past appointments." />
                ) : (
                  <div className="space-y-3">
                    {past.map(a => (
                      <AppointmentCard key={a.id} appointment={a} onStatusUpdate={updateStatus} showDate />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DoctorLayout>

    <AlertDialog open={!!confirmCancelId} onOpenChange={() => setConfirmCancelId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this appointment? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={confirmCancel}
          >
            Yes, Cancel It
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <CalendarDays className="h-10 w-10 text-muted-foreground/40 mb-3" />
    <p className="text-muted-foreground text-sm">{message}</p>
  </div>
);

const Skeletons = () => (
  <div className="space-y-3">
    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
  </div>
);

interface AppointmentCardProps {
  appointment: Appointment;
  onStatusUpdate: (id: string, status: 'scheduled' | 'completed' | 'cancelled') => Promise<void>;
  showDate?: boolean;
  compact?: boolean;
}

const AppointmentCard = ({ appointment, onStatusUpdate, showDate, compact }: AppointmentCardProps) => {
  const d = convertToDate(appointment.date);
  const config = typeConfig[appointment.type] ?? typeConfig['Video Call'];
  const Icon = config.icon;

  return (
    <Card className={cn('overflow-hidden border-l-4', config.accent, compact && 'shadow-none')}>
      <CardContent className={cn('p-4', compact && 'p-2.5')}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={cn('p-2 rounded-lg shrink-0', config.iconBg)}>
              <Icon className={cn('h-5 w-5', compact && 'h-4 w-4')} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', config.badge)}>
                  {config.label}
                </span>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border capitalize', statusStyle(appointment.status))}>
                  {appointment.status}
                </span>
              </div>
              <p className={cn('font-semibold mt-1.5', compact && 'text-xs mt-1')}>{appointment.patientName}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                {showDate && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {format(d, 'MMM d')}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(d, 'p')}
                </span>
              </div>
            </div>
          </div>
          {!compact && appointment.status === 'scheduled' && (
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="outline"
                className="h-7 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50"
                onClick={() => onStatusUpdate(appointment.id!, 'completed')}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Complete
              </Button>
              <Button size="sm" variant="outline"
                className="h-7 text-xs gap-1 text-red-500 border-red-200 hover:bg-red-50"
                onClick={() => onStatusUpdate(appointment.id!, 'cancelled')}>
                <XCircle className="h-3.5 w-3.5" /> Cancel
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DoctorAppointments;
