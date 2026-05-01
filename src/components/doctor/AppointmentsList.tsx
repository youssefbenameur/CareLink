
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Appointment, convertToDate } from '@/services/appointmentService';
import { format } from 'date-fns';
import { Clock, MessageSquare, MapPin, Video } from 'lucide-react';

interface AppointmentsListProps {
  appointments: Appointment[];
  filteredAppointments: Appointment[];
  loading: boolean;
  onStatusUpdate: (appointmentId: string, status: 'scheduled' | 'completed' | 'cancelled') => Promise<void>;
  selectedDate: Date;
}

export const AppointmentsList = ({
  appointments,
  filteredAppointments,
  loading,
  onStatusUpdate,
  selectedDate
}: AppointmentsListProps) => {
  if (loading) {
    return <AppointmentSkeletons />;
  }

  if (filteredAppointments.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No appointments for this date
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredAppointments
        .sort((a, b) => {
          const dateA = convertToDate(a.date);
          const dateB = convertToDate(b.date);
          return dateA.getTime() - dateB.getTime();
        })
        .map((appointment) => (
          <AppointmentCard 
            key={appointment.id} 
            appointment={appointment} 
            onStatusUpdate={onStatusUpdate} 
          />
        ))}
    </div>
  );
};

const AppointmentSkeletons = () => (
  <div className="space-y-4">
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-24 w-full" />
  </div>
);

interface AppointmentCardProps {
  appointment: Appointment;
  onStatusUpdate: (appointmentId: string, status: 'scheduled' | 'completed' | 'cancelled' | 'pending') => Promise<void>;
}

const AppointmentCard = ({ appointment, onStatusUpdate }: AppointmentCardProps) => {
  const formatAppointmentTime = (date: any) => {
    try {
      return format(convertToDate(date), 'p');
    } catch (error) {
      return 'Invalid time';
    }
  };
  
  const getAppointmentTypeIcon = (type: string) => {
    switch (type) {
      case 'Chat Session':
        return <MessageSquare className="h-4 w-4" />;
      case 'Video Call':
        return <Video className="h-4 w-4 text-blue-500" />;
      case 'In-person Visit':
      case 'In-person':
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-4 mb-4 sm:mb-0">
        <Avatar className="h-10 w-10">
          <AvatarFallback>
            {appointment.patientName?.split(' ').map(n => n[0]).join('') || 'P'}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium">{appointment.patientName}</h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-4 w-4" />
            {formatAppointmentTime(appointment.date)}
            <span className="mx-2">•</span>
            {getAppointmentTypeIcon(appointment.type)}
            <span className="ml-1">{appointment.type}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant={
          appointment.status === 'pending' ? 'outline' :
          appointment.status === 'scheduled' ? 'default' :
          appointment.status === 'completed' ? 'secondary' : 'destructive'
        }>{appointment.status}</Badge>
        <AppointmentActions 
          appointmentId={appointment.id!} 
          status={appointment.status as 'scheduled' | 'completed' | 'cancelled' | 'pending'}
          onStatusUpdate={onStatusUpdate} 
        />
      </div>
    </div>
  );
};

interface AppointmentActionsProps {
  appointmentId: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending';
  onStatusUpdate: (appointmentId: string, status: 'scheduled' | 'completed' | 'cancelled' | 'pending') => Promise<void>;
}

const AppointmentActions = ({ appointmentId, status, onStatusUpdate }: AppointmentActionsProps) => {
  if (status === 'pending') {
    return (
      <div className="flex space-x-2">
        <Button 
          variant="default" 
          size="sm"
          onClick={() => onStatusUpdate(appointmentId, 'scheduled')}
        >
          Approve
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-destructive border-destructive"
          onClick={() => onStatusUpdate(appointmentId, 'cancelled')}
        >
          Reject
        </Button>
      </div>
    );
  }

  if (status === 'scheduled') {
    return (
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onStatusUpdate(appointmentId, 'completed')}
        >
          Complete
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-destructive border-destructive"
          onClick={() => onStatusUpdate(appointmentId, 'cancelled')}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return null;
};

export default AppointmentsList;
