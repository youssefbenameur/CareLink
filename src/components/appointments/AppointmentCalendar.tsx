
import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { Appointment } from '@/services/appointmentService';
import { Timestamp } from 'firebase/firestore';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onDateSelect?: (date: Date) => void;
}

export const AppointmentCalendar = ({ appointments, onDateSelect }: AppointmentCalendarProps) => {
  const { t } = useTranslation(['appointments', 'common']);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Helper function to convert Timestamp to Date if needed
  const getDateFromTimestamp = (date: Date | Timestamp): Date => {
    if (date && 'seconds' in date) {
      return new Date(date.seconds * 1000);
    }
    return date as Date;
  };

  const appointmentDates = appointments.map(app => {
    const date = getDateFromTimestamp(app.date);
    return format(date, 'yyyy-MM-dd');
  });

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      if (onDateSelect) {
        onDateSelect(date);
      }
    }
  };

  const isDayWithAppointment = (date: Date) => {
    return appointmentDates.includes(format(date, 'yyyy-MM-dd'));
  };

  // Fix: Only disable past dates, not future dates
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={handleDateSelect}
      className="rounded-md border pointer-events-auto"
      disabled={isDateDisabled}
      modifiers={{
        hasAppointment: (date) => isDayWithAppointment(date),
      }}
      modifiersClassNames={{
        hasAppointment: "bg-primary/10 font-bold",
      }}
    />
  );
};
