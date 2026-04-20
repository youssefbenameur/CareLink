
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { appointmentService } from '@/services/appointmentService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { BookAppointmentForm } from '@/components/appointments/BookAppointmentForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar';
import { useToast } from '@/components/ui/use-toast';
import { useAppointmentQueryParams } from '@/components/appointments/AppointmentBooking';
import { convertToDate } from '@/services/appointmentService';
import { Video, MessageSquare, MapPin, Clock, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const Appointments = () => {
  const { t } = useTranslation(['appointments', 'common']);
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
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const patientId = currentUser?.uid || '';
  const [searchParams, setSearchParams] = useSearchParams();
  
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

  // Reschedule — cancel old and switch to Book tab with same doctor
  const handleReschedule = async (appointment: any) => {
    setSelectedDoctorId(appointment.doctorId);
    setSelectedDoctorName(appointment.doctorName?.replace(/^Dr\.\s*/i, '') ?? appointment.doctorName);
    setActiveTab('schedule');
  };

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
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('schedule')}
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="upcoming" data-value="upcoming">{t('upcoming')}</TabsTrigger>
            <TabsTrigger value="schedule" data-value="schedule">{t('book')}</TabsTrigger>
            <TabsTrigger value="past" data-value="past">{t('past')}</TabsTrigger>
          </TabsList>
          
          {/* Upcoming appointments */}
          <TabsContent value="upcoming">
            <div className="flex flex-col gap-4">
              {isLoading ? (
                <p>{t('common:loading')}</p>
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
                <p>{t('noUpcoming')}</p>
              )}
            </div>
          </TabsContent>
          
          {/* Schedule new appointment */}
          <TabsContent value="schedule">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="md:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('doctorAvailability')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>{t('selectDoctor')}</Label>
                        <Select 
                          value={selectedDoctorId || ''} 
                          onValueChange={handleDoctorChange}
                          disabled={loadingDoctors}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectDoctor')} />
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
                      <p>{t('selectDoctorFirst')}</p>
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
                <p>{t('common:loading')}</p>
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
                <p>{t('noPast')}</p>
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
    </>
  );
};

// Appointment type config
const typeConfig = {
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
  const config = typeConfig[appointment.type as keyof typeof typeConfig] ?? typeConfig['Video Call'];
  const Icon = config.icon;
  const d = convertToDate(appointment.date);

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
          {showActions && appointment.status === 'scheduled' && (
            <div className="flex gap-2 shrink-0">
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
      </CardContent>
    </Card>
  );
};

export default Appointments;
