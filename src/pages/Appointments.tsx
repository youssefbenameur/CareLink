import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState, useEffect } from 'react';
import { appointmentService } from '@/services/appointmentService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, startOfDay, isWithinInterval } from 'date-fns';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BookAppointmentForm } from '@/components/appointments/BookAppointmentForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar';
import { useToast } from '@/components/ui/use-toast';
import { useAppointmentQueryParams } from '@/components/appointments/AppointmentBooking';
import { convertToDate } from '@/services/appointmentService';
import { MessageSquare, MapPin, Clock, CalendarDays, CalendarX, CalendarCheck, UserSearch, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { useNotifications } from '@/contexts/NotificationContext';

const Appointments = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [selectedDoctorName, setSelectedDoctorName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('doctorId') || params.get('tab') === 'schedule') return 'schedule';
    return 'upcoming';
  });
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined);
  const [rescheduleTime, setRescheduleTime] = useState<string>('');
  const [rescheduling, setRescheduling] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const patientId = currentUser?.uid || '';
  const [searchParams, setSearchParams] = useSearchParams();
  const { markReadByActionUrl } = useNotifications();

  // Auto-clear appointment notifications when this page is opened
  useEffect(() => {
    markReadByActionUrl('/appointments');
  }, []);
  
  // Use appointment query params hook
  useAppointmentQueryParams();
  
  // Use query parameters for Find Doctor redirection
  useEffect(() => {
    const doctorId = searchParams.get('doctorId');
    const doctorName = searchParams.get('doctorName');
    
    if (doctorId && doctorName) {
      setSelectedDoctorId(doctorId);
      setSelectedDoctorName(decodeURIComponent(doctorName));
      // Switch to the Book tab automatically using tabRef
      const scheduleTab = document.querySelector('[data-value="schedule"]') as HTMLElement;
      if (scheduleTab) {
        scheduleTab.dispatchEvent(new Event('click', { bubbles: true }));
      }
    }
  }, [searchParams]);
  
  // Fetch appointments
  const { data: appointments, isLoading, refetch } = useQuery({
    queryKey: ['appointments', patientId],
    queryFn: () => appointmentService.getPatientAppointments(patientId),
    enabled: !!patientId,
  });

  // Fetch available doctors
  const { data: doctors, isLoading: loadingDoctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => appointmentService.getAvailableDoctors(),
  });

  // Handle doctor selection
  const handleDoctorChange = (doctorId: string) => {
    const selectedDoctor = doctors?.find(doc => doc.id === doctorId);
    if (selectedDoctor) {
      setSelectedDoctorId(doctorId);
      setSelectedDoctorName(selectedDoctor.name);
    }
  };

  // Handle successful booking
  const handleBookingSuccess = () => {
    refetch();
    setActiveTab('upcoming');
  };

  // Cancel appointment — shows confirmation first
  const handleCancel = async (appointmentId: string) => {
    setConfirmCancelId(appointmentId);
  };

  const confirmCancel = async () => {
    if (!confirmCancelId) return;
    setCancellingId(confirmCancelId);
    try {
      await appointmentService.deleteAppointment(confirmCancelId);
      await refetch();
      toast({ title: 'Appointment cancelled', description: 'Your appointment has been removed.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to cancel appointment.', variant: 'destructive' });
    } finally {
      setCancellingId(null);
      setConfirmCancelId(null);
    }
  };

  // Reschedule — opens a dialog to pick a new date/time, then updates the
  // existing appointment in Firestore (no duplicate created).
  const handleReschedule = (appointment: any) => {
    setRescheduleTarget(appointment);
    setRescheduleDate(undefined);
    setRescheduleTime('');
  };

  const confirmReschedule = async () => {
    if (!rescheduleTarget || !rescheduleDate || !rescheduleTime) return;
    const [hours, minutes] = rescheduleTime.split(':').map(Number);
    const newDate = new Date(rescheduleDate);
    newDate.setHours(hours, minutes, 0, 0);
    setRescheduling(true);
    try {
      await appointmentService.rescheduleAppointment(rescheduleTarget.id, newDate);
      await refetch();
      toast({
        title: 'Appointment rescheduled',
        description: `Rescheduled to ${format(newDate, 'PPp')} — awaiting doctor approval.`,
      });
      setRescheduleTarget(null);
    } catch {
      toast({ title: 'Error', description: 'Failed to reschedule. Please try again.', variant: 'destructive' });
    } finally {
      setRescheduling(false);
    }
  };

  // Generate 30-min slots 9 AM–5 PM for the selected reschedule date
  const rescheduleSlots: string[] = (() => {
    if (!rescheduleDate) return [];
    const slots: string[] = [];
    const now = new Date();
    for (let h = 9; h < 17; h++) {
      for (const m of [0, 30]) {
        const slot = new Date(rescheduleDate);
        slot.setHours(h, m, 0, 0);
        if (slot > now) slots.push(format(slot, 'HH:mm'));
      }
    }
    return slots;
  })();

  // Get the active tab from URL or use default
  const getDefaultTab = () => {
    if (searchParams.get('doctorId') || searchParams.get('tab') === 'schedule') return "schedule";
    return "upcoming";
  };

  return (
    <>
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">
            Schedule and manage your appointments
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="upcoming" data-value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="schedule" data-value="schedule">Book New</TabsTrigger>
            <TabsTrigger value="past" data-value="past">Past</TabsTrigger>
          </TabsList>
          
          {/* Upcoming appointments */}
          <TabsContent value="upcoming">
            <div className="flex flex-col gap-4">
              {isLoading ? (
                <p>Loading...</p>
              ) : appointments && appointments.filter(app =>
                  new Date(convertToDate(app.date)) > new Date() && app.status !== 'cancelled'
                ).length > 0 ? (
                appointments
                  .filter(app =>
                    new Date(convertToDate(app.date)) > new Date() &&
                    app.status !== 'cancelled'
                  )
                  .map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      showActions
                      onCancel={handleCancel}
                      onReschedule={handleReschedule}
                      cancellingId={cancellingId}
                    />
                  ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <CalendarX className="h-10 w-10 text-primary/60" />
                  </div>
                  <h3 className="text-lg font-semibold">No upcoming appointments</h3>
                  <p className="text-muted-foreground text-sm mt-1 max-w-xs">
                    You have no upcoming appointments. Book a session with one of your doctors to get started.
                  </p>
                  <Button className="mt-5" onClick={() => setActiveTab('schedule')}>
                    <CalendarCheck className="h-4 w-4 mr-2" />
                    Book Now
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Schedule new appointment */}
          <TabsContent value="schedule">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="md:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Doctor Availability</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Select Doctor</Label>
                        <Select 
                          value={selectedDoctorId || ''} 
                          onValueChange={handleDoctorChange}
                          disabled={loadingDoctors}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Doctor" />
                          </SelectTrigger>
                          <SelectContent>
                            {doctors?.map(doctor => (
                              <SelectItem key={doctor.id} value={doctor.id}>
                                {doctor.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <AppointmentCalendar 
                          appointments={appointments || []} 
                          onDateSelect={setSelectedDate}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-1 lg:col-span-2">
                {selectedDoctorId && selectedDoctorName ? (
                  <BookAppointmentForm 
                    doctorId={selectedDoctorId} 
                    doctorName={selectedDoctorName} 
                    selectedDate={selectedDate} 
                    onSuccess={handleBookingSuccess}
                  />
                ) : (
                  <Card className="h-full flex items-center justify-center">
                    <CardContent className="text-center p-6">
                      <p>Please select a doctor to book an appointment</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Past appointments */}
          <TabsContent value="past">
            <div className="flex flex-col gap-4">
              {isLoading ? (
                <p>Loading...</p>
              ) : appointments && appointments.filter(app =>
                  new Date(convertToDate(app.date)) < new Date() || app.status === 'cancelled'
                ).length > 0 ? (
                appointments
                  .filter(app =>
                    new Date(convertToDate(app.date)) < new Date() ||
                    app.status === 'cancelled'
                  )
                  .map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} />
                  ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                    <CalendarDays className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-semibold">No past appointments</h3>
                  <p className="text-muted-foreground text-sm mt-1 max-w-xs">
                    Your completed and cancelled appointments will appear here.
                  </p>
                  <Button variant="outline" className="mt-5" onClick={() => setActiveTab('schedule')}>
                    <UserSearch className="h-4 w-4 mr-2" />
                    Find a Doctor
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>

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

    {/* Reschedule dialog — updates the existing appointment, no duplicate created */}
    <Dialog open={!!rescheduleTarget} onOpenChange={(open) => { if (!open) setRescheduleTarget(null); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Rescheduling with <span className="font-medium">Dr. {rescheduleTarget?.doctorName}</span>.
            Pick a new date and time — the appointment will be reset to pending for doctor approval.
          </p>
          <div>
            <Label className="mb-2 block">New Date</Label>
            <Calendar
              mode="single"
              selected={rescheduleDate}
              onSelect={setRescheduleDate}
              disabled={(date) => date < startOfDay(new Date())}
              className="rounded-md border"
            />
          </div>
          {rescheduleDate && (
            <div>
              <Label className="mb-2 block">New Time</Label>
              {rescheduleSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {rescheduleSlots.map((slot) => (
                    <Button
                      key={slot}
                      size="sm"
                      variant={rescheduleTime === slot ? 'default' : 'outline'}
                      onClick={() => setRescheduleTime(slot)}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No available slots for this date.</p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setRescheduleTarget(null)}>Cancel</Button>
          <Button
            disabled={!rescheduleDate || !rescheduleTime || rescheduling}
            onClick={confirmReschedule}
          >
            {rescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

// Appointment type config
const typeConfig = {
  'Chat Session': {
    icon: MessageSquare,
    accent: 'border-l-violet-500',
    iconBg: 'bg-violet-500/10 text-violet-600',
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    label: 'Chat Session',
  },
  'Video Call': {
    icon: Video,
    accent: 'border-l-blue-500',
    iconBg: 'bg-blue-500/10 text-blue-600',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    label: 'Video Call',
  },
  'In-person': {
    icon: MapPin,
    accent: 'border-l-emerald-500',
    iconBg: 'bg-emerald-500/10 text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: 'In-person Visit',
  },
};

const statusBadge = (status: string) => {
  if (status === 'scheduled') return 'bg-green-50 text-green-700 border-green-200';
  if (status === 'cancelled') return 'bg-red-50 text-red-700 border-red-200';
  if (status === 'completed') return 'bg-gray-50 text-gray-600 border-gray-200';
  return 'bg-yellow-50 text-yellow-700 border-yellow-200';
};

interface AppointmentCardProps {
  appointment: any;
  showActions?: boolean;
  onCancel?: (id: string) => void;
  onReschedule?: (appointment: any) => void;
  cancellingId?: string | null;
}

const AppointmentCard = ({ appointment, showActions, onCancel, onReschedule, cancellingId }: AppointmentCardProps) => {
  const config = typeConfig[appointment.type as keyof typeof typeConfig] ?? typeConfig['In-person'];
  const Icon = config.icon;
  const d = convertToDate(appointment.date);
  const navigate = useNavigate();

  return (
    <Card className={cn('overflow-hidden border-l-4', config.accent)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={cn('p-2 rounded-lg shrink-0', config.iconBg)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', config.badge)}>
                  {config.label}
                </span>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border capitalize', statusBadge(appointment.status))}>
                  {appointment.status}
                </span>
              </div>
              <p className="font-semibold mt-1.5">Dr. {appointment.doctorName || 'Unknown'}</p>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {format(d, 'PPP')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {format(d, 'p')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            {/* Join Video Call button — only for scheduled video call appointments */}
            {appointment.type === 'Video Call' && appointment.status === 'scheduled' && (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => navigate(`/chat/${appointment.doctorId}`)}
              >
                <Video className="h-4 w-4 mr-1.5" />
                Join Call
              </Button>
            )}
            {showActions && appointment.status === 'scheduled' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReschedule?.(appointment)}
                >
                  Reschedule
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={cancellingId === appointment.id}
                  onClick={() => onCancel?.(appointment.id)}
                >
                  {cancellingId === appointment.id ? 'Cancelling...' : 'Cancel'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Appointments;
