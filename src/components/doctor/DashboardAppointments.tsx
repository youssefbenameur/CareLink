
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentService, convertToDate } from '@/services/appointmentService';
import { Badge } from '@/components/ui/badge';
import { Timestamp } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

export const DashboardAppointments = () => {
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['doctorAppointments', currentUser?.uid],
    queryFn: () => appointmentService.getDoctorAppointments(currentUser?.uid || ''),
    enabled: !!currentUser?.uid,
  });

  // Get appointments for the selected date
  const selectedDateAppointments = appointments?.filter((appointment) => {
    // Convert appointment date to JavaScript Date object if it's a Timestamp
    const appointmentDate = convertToDate(appointment.date);
    return selectedDate && 
      appointmentDate.getDate() === selectedDate.getDate() &&
      appointmentDate.getMonth() === selectedDate.getMonth() &&
      appointmentDate.getFullYear() === selectedDate.getFullYear();
  });

  // Separate pending and scheduled appointments
  const pendingAppointments = selectedDateAppointments?.filter(a => a.status === 'pending') || [];
  const scheduledAppointments = selectedDateAppointments?.filter(a => a.status !== 'pending') || [];

  // Function to get dates with appointments for the calendar
  const getDatesWithAppointments = () => {
    if (!appointments) return [];
    return appointments.map(appointment => convertToDate(appointment.date));
  };

  const handleApprove = async (appointmentId: string) => {
    try {
      await appointmentService.updateAppointmentStatus(appointmentId, 'scheduled');
      queryClient.invalidateQueries({ queryKey: ['doctorAppointments'] });
      toast({
        title: "Approved",
        description: "Appointment has been approved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Please try again",
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (appointmentId: string) => {
    try {
      await appointmentService.updateAppointmentStatus(appointmentId, 'cancelled');
      queryClient.invalidateQueries({ queryKey: ['doctorAppointments'] });
      toast({
        title: "Rejected",
        description: "Appointment has been rejected",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Please try again",
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('doctorDashboard:appointments.title')}</CardTitle>
          <CardDescription>{t('doctorDashboard:appointments.manage')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>{t('doctorDashboard:appointments.title')}</CardTitle>
          <CardDescription>{t('doctorDashboard:appointments.manage')}</CardDescription>
        </div>
        <Button asChild>
          <Link to="/doctor/appointments">{t('doctorDashboard:appointments.manageLink')}</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
          />
          
          {/* Pending Appointments Section */}
          {pendingAppointments.length > 0 && (
            <div className="space-y-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-medium text-sm text-yellow-900 dark:text-yellow-100">
                {t('appointments:pending')} ({pendingAppointments.length})
              </h4>
              <div className="space-y-2">
                {pendingAppointments.map((appointment) => (
                  <div 
                    key={appointment.id} 
                    className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 border rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">{appointment.patientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {convertToDate(appointment.date).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => handleApprove(appointment.id!)}
                      >
                        {t('appointments:approve')}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-destructive border-destructive"
                        onClick={() => handleReject(appointment.id!)}
                      >
                        {t('appointments:reject')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scheduled Appointments Section */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">
              {scheduledAppointments && scheduledAppointments.length > 0 
                ? t('doctorDashboard:appointments.forDate', { date: selectedDate?.toLocaleDateString() })
                : selectedDateAppointments && selectedDateAppointments.length === 0
                ? t('doctorDashboard:appointments.noAppointments')
                : null}
            </h4>
            <div className="space-y-2">
              {scheduledAppointments?.map((appointment) => (
                <div 
                  key={appointment.id} 
                  className="flex items-center justify-between p-2 border rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">{appointment.patientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {convertToDate(appointment.date).toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge variant={appointment.status === 'completed' ? 'default' : 'outline'}>
                    {appointment.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" asChild>
          <Link to="/doctor/appointments">
            {t('doctorDashboard:appointments.viewAll')}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
