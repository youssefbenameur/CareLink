
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { appointmentService } from '@/services/appointmentService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { BookAppointmentForm } from '@/components/appointments/BookAppointmentForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar';
import { useToast } from '@/components/ui/use-toast';
import { useAppointmentQueryParams } from '@/components/appointments/AppointmentBooking';
import { convertToDate } from '@/services/appointmentService';

const Appointments = () => {
  const { t } = useTranslation(['appointments', 'common']);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [selectedDoctorName, setSelectedDoctorName] = useState<string | null>(null);
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
    refetch(); // Refresh appointment list
    // Switch to upcoming tab
    const upcomingTab = document.querySelector('[data-value="upcoming"]') as HTMLElement;
    if (upcomingTab) {
      upcomingTab.dispatchEvent(new Event('click', { bubbles: true }));
    }
  };

  // Get the active tab from URL or use default
  const getDefaultTab = () => {
    if (searchParams.get('doctorId')) return "schedule";
    return "upcoming";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('schedule')}
          </p>
        </div>
        
        <Tabs defaultValue={getDefaultTab()} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="upcoming" data-value="upcoming">{t('upcoming')}</TabsTrigger>
            <TabsTrigger value="schedule" data-value="schedule">{t('book')}</TabsTrigger>
            <TabsTrigger value="past" data-value="past">{t('past')}</TabsTrigger>
          </TabsList>
          
          {/* Upcoming appointments */}
          <TabsContent value="upcoming">
            <div className="grid gap-4 md:grid-cols-2">
              {isLoading ? (
                <p>{t('common:loading')}</p>
              ) : appointments && appointments.length > 0 ? (
                appointments
                  .filter(app => 
                    new Date(convertToDate(app.date)) > new Date() && 
                    app.status !== 'cancelled'
                  )
                  .map((appointment) => (
                    <Card key={appointment.id} className="overflow-hidden">
                      <CardHeader className={`${
                        appointment.status === 'pending' ? 'bg-yellow-100' : 
                        appointment.status === 'scheduled' ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <CardTitle className="flex justify-between">
                          <span>{appointment.type}</span>
                          <span className="text-sm capitalize">{appointment.status}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <p className="font-medium">{t('with')} Dr. {appointment.doctorName || 'Unknown'}</p>
                        <p>{format(convertToDate(appointment.date), 'PPP')}</p>
                        <div className="mt-4 flex justify-end space-x-2">
                          <Button variant="outline">{t('reschedule')}</Button>
                          <Button variant="destructive">{t('cancel')}</Button>
                        </div>
                      </CardContent>
                    </Card>
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
            <div className="grid gap-4 md:grid-cols-2">
              {isLoading ? (
                <p>{t('common:loading')}</p>
              ) : appointments && appointments.length > 0 ? (
                appointments
                  .filter(app => 
                    new Date(convertToDate(app.date)) < new Date() || 
                    app.status === 'cancelled'
                  )
                  .map((appointment) => (
                    <Card key={appointment.id} className="overflow-hidden">
                      <CardHeader className={`${
                        appointment.status === 'cancelled' ? 'bg-red-100' : 
                        appointment.status === 'completed' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <CardTitle className="flex justify-between">
                          <span>{appointment.type}</span>
                          <span className="text-sm capitalize">{appointment.status}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <p className="font-medium">{t('with')} Dr. {appointment.doctorName || 'Unknown'}</p>
                        <p>{format(convertToDate(appointment.date), 'PPP')}</p>
                      </CardContent>
                    </Card>
                  ))
              ) : (
                <p>{t('noPast')}</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Appointments;
