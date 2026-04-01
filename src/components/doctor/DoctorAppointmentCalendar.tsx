
import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { isSameDay, format, isToday, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { appointmentService } from '@/services/appointmentService';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Appointment, convertToDate } from '@/services/appointmentService';

interface DoctorAppointmentCalendarProps {
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
}

export const DoctorAppointmentCalendar: React.FC<DoctorAppointmentCalendarProps> = ({
  onDateSelect,
  selectedDate: externalSelectedDate,
}) => {
  const { t } = useTranslation(['appointments', 'common']);
  const { currentUser } = useAuth();
  const [date, setDate] = useState<Date>(externalSelectedDate || new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (externalSelectedDate) {
      setDate(externalSelectedDate);
    }
  }, [externalSelectedDate]);

  const fetchAppointments = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Get the first and last days of the selected month
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      // Use getDoctorAppointments
      const doctorAppointments = await appointmentService.getDoctorAppointments(currentUser.uid);
      
      // Filter appointments for the current month
      const filteredAppointments = doctorAppointments.filter(app => {
        // Convert appointment date to a JavaScript Date object safely
        const appDate = convertToDate(app.date);
        return isWithinInterval(appDate, { start, end });
      });
      
      setAppointments(filteredAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasAppointmentOnDate = (date: Date): boolean => {
    return appointments.some((appointment) => {
      // Use the convertToDate helper to safely get a JavaScript Date
      const appointmentDate = convertToDate(appointment.date);
      return isSameDay(appointmentDate, date);
    });
  };

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      if (onDateSelect) {
        onDateSelect(newDate);
      }
    }
  };

  const renderDay = (date: Date, cellProps: any) => {
    // Check if the date has an appointment
    const hasAppointment = hasAppointmentOnDate(date);
    
    // Determine if the date is today
    const isCurrentDay = isToday(date);
    
    return (
      <div
        className={cn(
          "relative flex h-9 w-9 items-center justify-center p-0 font-normal",
          hasAppointment && "bg-primary/10 text-primary font-semibold",
          isCurrentDay && "bg-primary text-primary-foreground rounded-full"
        )}
      >
        {date.getDate()}
        {hasAppointment && (
          <div className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
        )}
      </div>
    );
  };

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={handleDateChange}
      className="border rounded-md p-3"
      components={{
        Day: ({ date, ...props }) => renderDay(date, props)
      }}
    />
  );
};

export default DoctorAppointmentCalendar;
