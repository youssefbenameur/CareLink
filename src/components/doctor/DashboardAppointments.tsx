
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { appointmentService, convertToDate } from '@/services/appointmentService';
import { Badge } from '@/components/ui/badge';
import { Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export const DashboardAppointments = () => {
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  const { t } = useTranslation(['doctorDashboard', 'appointments']);
  
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

  // Function to get dates with appointments for the calendar
  const getDatesWithAppointments = () => {
    if (!appointments) return [];
    return appointments.map(appointment => convertToDate(appointment.date));
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
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">
              {selectedDateAppointments && selectedDateAppointments.length > 0 
                ? t('doctorDashboard:appointments.forDate', { date: selectedDate?.toLocaleDateString() })
                : t('doctorDashboard:appointments.noAppointments')}
            </h4>
            <div className="space-y-2">
              {selectedDateAppointments?.map((appointment) => (
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
