
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format, addMinutes, setMinutes, setHours, isBefore, isAfter } from 'date-fns';
import { appointmentService } from '@/services/appointmentService';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface BookAppointmentFormProps {
  doctorId: string;
  doctorName: string;
  selectedDate?: Date;
  onSuccess?: () => void;
}

export const BookAppointmentForm = ({ doctorId, doctorName, selectedDate, onSuccess }: BookAppointmentFormProps) => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  const [date, setDate] = useState<Date | undefined>(selectedDate || new Date());
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [appointmentType, setAppointmentType] = useState<'Video Call' | 'Chat Session' | 'In-person'>('Video Call');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update date when selectedDate changes from parent
  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate]);
  
  // Generate available times for the selected date
  useEffect(() => {
    if (!date) {
      setAvailableTimes([]);
      setBookedSlots([]);
      return;
    }
    
    // Generate times between 9 AM and 5 PM with 30-minute intervals
    const times = [];
    const startHour = 9;
    const endHour = 17;
    
    let currentTime = setHours(setMinutes(new Date(date), 0), startHour);
    const endTime = setHours(setMinutes(new Date(date), 0), endHour);
    
    while (isBefore(currentTime, endTime)) {
      if (!isBefore(currentTime, new Date())) {
        times.push(format(currentTime, 'HH:mm'));
      }
      currentTime = addMinutes(currentTime, 30);
    }
    
    setAvailableTimes(times);
    setSelectedTime(undefined);

    // Fetch booked slots for this doctor on this date
    appointmentService.getBookedSlots(doctorId, date).then(setBookedSlots);
  }, [date, doctorId]);
  
  const handleSubmit = async () => {
    if (!date || !selectedTime || !appointmentType || !currentUser) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Combine date and time into a single Date object
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const appointmentDate = new Date(date);
    appointmentDate.setHours(hours, minutes, 0, 0);
    
    setIsSubmitting(true);
    
    try {
      await appointmentService.createAppointment({
        doctorId,
        doctorName,
        patientId: currentUser.uid,
        date: appointmentDate,
        type: appointmentType,
        notes,
        reason,
        status: 'pending',
      });
      
      toast({
        title: "Appointment requested",
        description: `${format(appointmentDate, 'PPp')} with ${doctorName} - Awaiting doctor approval`,
      });
      
      // Reset form
      setSelectedTime(undefined);
      setAppointmentType('Video Call');
      setNotes('');
      setReason('');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast({
        title: "Error",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Map the appointment type values to their labels
  const appointmentTypes = [
    { value: 'Video Call', label: 'Initial Consultation' },
    { value: 'Chat Session', label: 'Follow-up' },
    { value: 'In-person', label: 'Therapy Session' },
  ];
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Book Appointment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Appointment Type</Label>
          <Select 
            value={appointmentType} 
            onValueChange={(value) => setAppointmentType(value as 'Video Call' | 'Chat Session' | 'In-person')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select appointment type" />
            </SelectTrigger>
            <SelectContent>
              {appointmentTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {date && (
          <div className="space-y-2">
            <Label>Select time</Label>
            {availableTimes.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {availableTimes.map(time => {
                  const isBooked = bookedSlots.includes(time);
                  return (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      onClick={() => !isBooked && setSelectedTime(time)}
                      disabled={isBooked}
                      className={isBooked ? 'opacity-40 cursor-not-allowed line-through' : 'w-full'}
                      title={isBooked ? 'Already booked' : undefined}
                    >
                      {time}
                      {isBooked && <span className="ml-1 text-xs">✕</span>}
                    </Button>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No available times for this date
              </p>
            )}
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="reason">Reason for appointment</Label>
          <Textarea
            id="reason"
            placeholder="Describe the reason for your appointment"
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Add any additional notes (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit}
          disabled={!date || !selectedTime || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Submitting..." : "Confirm Appointment"}
        </Button>
      </CardFooter>
    </Card>
  );
};
