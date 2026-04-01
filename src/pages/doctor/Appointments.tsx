
import { useState, useEffect } from 'react';
import DoctorLayout from '@/components/layout/DoctorLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentService, Appointment, convertToDate } from '@/services/appointmentService';
import { format, isToday } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { DoctorAppointmentCalendar } from '@/components/doctor/DoctorAppointmentCalendar';
import { AppointmentsList } from '@/components/doctor/AppointmentsList';

const DoctorAppointments = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation(['appointments', 'common']);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  useEffect(() => {
    fetchAppointments();
  }, [currentUser]);
  
  const fetchAppointments = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const fetchedAppointments = await appointmentService.getDoctorAppointments(currentUser.uid);
      setAppointments(fetchedAppointments);
      
      // Filter appointments for today's date initially
      filterAppointmentsByDate(new Date(), fetchedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: t('common:error'),
        description: t('common:errors.failedToLoad'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const filterAppointmentsByDate = (date: Date, appointmentsList = appointments) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    const filtered = appointmentsList.filter(appointment => {
      const appointmentDate = convertToDate(appointment.date);
      return format(appointmentDate, 'yyyy-MM-dd') === formattedDate;
    });
    
    setFilteredAppointments(filtered);
    setSelectedDate(date);
  };
  
  const updateAppointmentStatus = async (appointmentId: string, status: 'scheduled' | 'completed' | 'cancelled') => {
    try {
      await appointmentService.updateAppointmentStatus(appointmentId, status);
      
      // Update local state
      const updatedAppointments = appointments.map(appointment => 
        appointment.id === appointmentId ? { ...appointment, status } : appointment
      );
      
      setAppointments(updatedAppointments);
      
      // Also update filtered appointments
      const updatedFiltered = filteredAppointments.map(appointment => 
        appointment.id === appointmentId ? { ...appointment, status } : appointment
      );
      
      setFilteredAppointments(updatedFiltered);
      
      toast({
        title: t('common:success'),
        description: `Appointment ${status} successfully`,
      });
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast({
        title: t('common:error'),
        description: t('common:errors.failedToUpdate'),
        variant: "destructive"
      });
    }
  };
  
  return (
    <DoctorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('appointments:title')}</h1>
          <p className="text-muted-foreground">{t('appointments:schedule')}</p>
        </div>
        
        <DoctorAppointmentsContent 
          appointments={appointments}
          filteredAppointments={filteredAppointments}
          loading={loading}
          selectedDate={selectedDate}
          filterAppointmentsByDate={filterAppointmentsByDate}
          updateAppointmentStatus={updateAppointmentStatus}
        />
      </div>
    </DoctorLayout>
  );
};

interface DoctorAppointmentsContentProps {
  appointments: Appointment[];
  filteredAppointments: Appointment[];
  loading: boolean;
  selectedDate: Date;
  filterAppointmentsByDate: (date: Date) => void;
  updateAppointmentStatus: (appointmentId: string, status: 'scheduled' | 'completed' | 'cancelled') => Promise<void>;
}

const DoctorAppointmentsContent = ({
  appointments,
  filteredAppointments,
  loading,
  selectedDate,
  filterAppointmentsByDate,
  updateAppointmentStatus
}: DoctorAppointmentsContentProps) => {
  const { t } = useTranslation(['appointments', 'common']);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Calendar View */}
      <Card className="col-span-1 md:col-span-4">
        <CardHeader className="pb-3">
          <CardTitle>{t('appointments:calendar')}</CardTitle>
        </CardHeader>
        <CardContent>
          <DoctorAppointmentCalendar 
            onDateSelect={filterAppointmentsByDate}
            selectedDate={selectedDate}
          />
        </CardContent>
      </Card>
      
      {/* Appointments List */}
      <Card className="col-span-1 md:col-span-8">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {isToday(selectedDate) ? 
                  t('appointments:upcoming') : 
                  t('appointments:appointmentsFor', { date: format(selectedDate, 'PPP') })
                }
              </CardTitle>
              <CardDescription>
                {filteredAppointments.length} {filteredAppointments.length === 1 
                  ? t('appointments:appointment') 
                  : t('appointments:appointmentsPlural')}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => filterAppointmentsByDate(new Date())}
              >
                {t('appointments:today')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AppointmentsList 
            appointments={appointments}
            filteredAppointments={filteredAppointments}
            loading={loading}
            onStatusUpdate={updateAppointmentStatus}
            selectedDate={selectedDate}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorAppointments;
