import React, { useState, useEffect, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  format,
  addMinutes,
  setMinutes,
  setHours,
  isBefore,
} from "date-fns";
import { appointmentService } from "@/services/appointmentService";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getAllDoctors } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

// Lazy-load RouteMap — it pulls in Leaflet which is heavy
const RouteMap = lazy(() =>
  import("@/components/map/RouteMap").then((m) => ({ default: m.RouteMap }))
);

interface Doctor {
  id: string;
  name: string;
  specialty?: string;
  experience?: string;
  clinicLocation?: string;
  clinicLat?: number;
  clinicLng?: number;
  [key: string]: any;
}

interface BookAppointmentFormProps {
  doctorId?: string;
  doctorName?: string;
  selectedDate?: Date;
  onSuccess?: () => void;
}

export const BookAppointmentForm = ({
  doctorId: propDoctorId,
  doctorName: propDoctorName,
  selectedDate,
  onSuccess,
}: BookAppointmentFormProps) => {
  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Doctor selection states
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    propDoctorId || "",
  );
  const [selectedDoctorName, setSelectedDoctorName] = useState<string>(
    propDoctorName || "",
  );
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [showRoute, setShowRoute] = useState(false);

  const [date, setDate] = useState<Date | undefined>(
    selectedDate || new Date(),
  );
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined,
  );
  const [appointmentType, setAppointmentType] = useState<
    "Chat Session" | "In-person" | "Video Call"
  >("Chat Session");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all approved doctors on component mount
  useEffect(() => {
    const fetchApprovedDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const approvedDoctors = await getAllDoctors("approved");
        setDoctors(approvedDoctors as Doctor[]);
      } catch (error) {
        console.error("Error fetching doctors:", error);
        toast({
          title: "Error",
          description: "Failed to load doctors",
          variant: "destructive",
        });
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchApprovedDoctors();
  }, [toast]);

  // Update date when selectedDate changes from parent
  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate]);

  // Handle doctor selection
  const handleDoctorChange = (doctorId: string) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    if (doctor) {
      setSelectedDoctorId(doctorId);
      setSelectedDoctorName(doctor.name || "");
      setSelectedDoctor(doctor);
      setShowRoute(false); // reset route when doctor changes
    }
  };

  // Generate available times for the selected date
  useEffect(() => {
    if (!date || !selectedDoctorId) {
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
        times.push(format(currentTime, "HH:mm"));
      }
      currentTime = addMinutes(currentTime, 30);
    }

    setAvailableTimes(times);
    setSelectedTime(undefined);

    // Fetch booked slots for this doctor on this date
    appointmentService
      .getBookedSlots(selectedDoctorId, date)
      .then(setBookedSlots);
  }, [date, selectedDoctorId]);

  const handleSubmit = async () => {
    if (
      !date ||
      !selectedTime ||
      !appointmentType ||
      !currentUser ||
      !selectedDoctorId
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Combine date and time into a single Date object
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const appointmentDate = new Date(date);
    appointmentDate.setHours(hours, minutes, 0, 0);

    setIsSubmitting(true);

    try {
      await appointmentService.createAppointment({
        doctorId: selectedDoctorId,
        doctorName: selectedDoctorName,
        patientId: currentUser.uid,
        date: appointmentDate,
        type: appointmentType,
        notes,
        reason,
        status: "pending",
      });

      toast({
        title: "Appointment requested",
        description: `${format(appointmentDate, "PPp")} with ${selectedDoctorName} - Awaiting doctor approval`,
      });

      // Reset form
      setSelectedTime(undefined);
      setAppointmentType("Chat Session");
      setNotes("");
      setReason("");

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

  // Appointment types
  const appointmentTypes = [
    { value: "Chat Session", label: "💬 Initial Consultation (Chat)" },
    { value: "Video Call", label: "🎥 Video Call" },
    { value: "In-person", label: "🏥 In-person Visit" },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Book Appointment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Doctor Selection */}
        <div className="space-y-2">
          <Label htmlFor="doctor">Select Doctor</Label>
          {loadingDoctors ? (
            <Skeleton className="w-full h-10" />
          ) : (
            <Select value={selectedDoctorId} onValueChange={handleDoctorChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{doctor.name}</span>
                      {doctor.specialty && (
                        <span className="text-sm text-muted-foreground">
                          ({doctor.specialty})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {selectedDoctorId && (
            <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
              Selected: {selectedDoctorName}
            </div>
          )}
        </div>

        {/* Route map — shown when selected doctor has a clinic location */}
        {selectedDoctor && (selectedDoctor.clinicLocation || selectedDoctor.clinicLat) && (
          <div className="space-y-2">
            <Separator />
            {!showRoute ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowRoute(true)}
              >
                🗺️ Show route from my location
              </Button>
            ) : (
              <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
                <RouteMap
                  doctorName={selectedDoctor.name}
                  doctorAddress={selectedDoctor.clinicLocation || ""}
                  doctorLat={selectedDoctor.clinicLat}
                  doctorLng={selectedDoctor.clinicLng}
                />
              </Suspense>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label>Appointment Type</Label>
          <Select
            value={appointmentType}
            onValueChange={(value) =>
              setAppointmentType(
                value as "Chat Session" | "In-person" | "Video Call",
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select appointment type" />
            </SelectTrigger>
            <SelectContent>
              {appointmentTypes.map((type) => (
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
                {availableTimes.map((time) => {
                  const isBooked = bookedSlots.includes(time);
                  return (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      onClick={() => !isBooked && setSelectedTime(time)}
                      disabled={isBooked}
                      className={
                        isBooked
                          ? "opacity-40 cursor-not-allowed line-through"
                          : "w-full"
                      }
                      title={isBooked ? "Already booked" : undefined}
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
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Add any additional notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSubmit}
          disabled={!date || !selectedTime || !selectedDoctorId || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Submitting..." : "Confirm Appointment"}
        </Button>
      </CardFooter>
    </Card>
  );
};
