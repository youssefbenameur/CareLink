import { db } from '@/lib/firebase';
import {
  collection, query, where, getDocs, addDoc, Timestamp,
  doc, updateDoc, deleteDoc, getDoc, writeBatch
} from 'firebase/firestore';
import { activityService } from './activityService';
import { notificationService } from './notificationService';
import { format } from 'date-fns';

export interface Appointment {
  id?: string;
  patientId: string;
  doctorId: string;
  date: Date | Timestamp;
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending';
  type: 'Chat Session' | 'In-person' | 'Video Call';
  notes?: string;
  patientName?: string;
  doctorName?: string;
  reason?: string;
}

// Normalise any date-like value into a plain JS Date
export const convertToDate = (value: Date | Timestamp | string | undefined): Date => {
  if (!value) return new Date();
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value as string);
};

const parseDate = (data: any): Date =>
  convertToDate(data.date ?? data.dateTime);

const sortByDate = (a: Appointment, b: Appointment) =>
  convertToDate(a.date as any).getTime() - convertToDate(b.date as any).getTime();

const mapDoc = (d: any): Appointment => {
  const data = d.data();
  return {
    id: d.id,
    patientId: data.patientId,
    doctorId: data.doctorId,
    date: parseDate(data),
    status: data.status,
    type: data.type ?? 'Chat Session',
    notes: data.notes,
    patientName: data.patientName,
    doctorName: data.doctorName,
    reason: data.reason,
  };
};

export const appointmentService = {

  // Auto-complete scheduled appointments whose date has passed
  autoCompleteExpired: async (appointments: Appointment[]): Promise<void> => {
    const now = new Date();
    const toComplete = appointments.filter(
      (a) => a.id && a.status === 'scheduled' && convertToDate(a.date as any) < now
    );
    if (toComplete.length === 0) return;
    await Promise.all(
      toComplete.map((a) =>
        updateDoc(doc(db, 'appointments', a.id!), { status: 'completed' })
      )
    );
  },

  // Get all appointments for a patient
  getPatientAppointments: async (patientId: string): Promise<Appointment[]> => {
    try {
      const snap = await getDocs(
        query(collection(db, 'appointments'), where('patientId', '==', patientId))
      );
      const appointments = snap.docs.map(mapDoc).sort(sortByDate);

      // Auto-complete expired
      await appointmentService.autoCompleteExpired(appointments);
      const now = new Date();
      appointments.forEach((a) => {
        if (a.status === 'scheduled' && convertToDate(a.date as any) < now) {
          a.status = 'completed';
        }
      });

      // Backfill missing doctorName
      await Promise.all(
        appointments.map(async (appt) => {
          if (!appt.doctorName && appt.doctorId) {
            const doctorSnap = await getDoc(doc(db, 'users', appt.doctorId));
            if (doctorSnap.exists()) {
              appt.doctorName = doctorSnap.data().name ?? 'Unknown Doctor';
            }
          }
        })
      );

      return appointments;
    } catch (error) {
      console.error('Error getting patient appointments:', error);
      throw error;
    }
  },

  // Get approved doctors available for booking
  getAvailableDoctors: async () => {
    try {
      const snap = await getDocs(
        query(
          collection(db, 'users'),
          where('role', '==', 'doctor'),
          where('doctorVerificationStatus', '==', 'approved')
        )
      );
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name ?? 'Unknown Doctor',
          specialty: data.specialty || data.specialization || 'General',
        };
      });
    } catch (error) {
      console.error('Error getting available doctors:', error);
      return [];
    }
  },

  // Get upcoming (future, non-cancelled) appointments for a patient
  getUpcomingAppointments: async (patientId: string): Promise<Appointment[]> => {
    try {
      const all = await appointmentService.getPatientAppointments(patientId);
      const now = new Date();
      return all.filter(
        (a) => convertToDate(a.date as any) > now && a.status !== 'cancelled'
      );
    } catch (error) {
      console.error('Error getting upcoming appointments:', error);
      throw error;
    }
  },

  // Get all appointments for a doctor
  getDoctorAppointments: async (doctorId: string): Promise<Appointment[]> => {
    try {
      const snap = await getDocs(
        query(collection(db, 'appointments'), where('doctorId', '==', doctorId))
      );
      const appointments = snap.docs.map(mapDoc).sort(sortByDate);

      // Auto-complete expired
      await appointmentService.autoCompleteExpired(appointments);
      const now = new Date();
      appointments.forEach((a) => {
        if (a.status === 'scheduled' && convertToDate(a.date as any) < now) {
          a.status = 'completed';
        }
      });

      return appointments;
    } catch (error) {
      console.error('Error getting doctor appointments:', error);
      throw error;
    }
  },

  // Create a new appointment
  createAppointment: async (appointment: Omit<Appointment, 'id'>): Promise<string> => {
    try {
      const [doctorSnap, patientSnap] = await Promise.all([
        getDoc(doc(db, 'users', appointment.doctorId)),
        getDoc(doc(db, 'users', appointment.patientId)),
      ]);

      const doctorName = doctorSnap.exists()
        ? doctorSnap.data().name ?? 'Unknown Doctor'
        : 'Unknown Doctor';
      const patientName = patientSnap.exists()
        ? patientSnap.data().name ?? 'Unknown Patient'
        : 'Unknown Patient';

      const appointmentData = {
        ...appointment,
        doctorName,
        patientName,
        date: appointment.date instanceof Date
          ? Timestamp.fromDate(appointment.date)
          : appointment.date,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'appointments'), appointmentData);

      await activityService.createActivity({
        userId: appointment.patientId,
        type: 'appointment',
        description: `Scheduled an appointment with ${doctorName}`,
        timestamp: new Date(),
      });

      // Notify the doctor about the new appointment request
      await notificationService.createNotification({
        userId: appointment.doctorId,
        title: 'New Appointment Request 📅',
        message: `${patientName} has requested an appointment on ${format(
          appointment.date instanceof Date
            ? appointment.date
            : convertToDate(appointment.date as any),
          'PPp'
        )}.`,
        type: 'info',
        actionUrl: '/doctor/appointments',
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  },

  // Update appointment status — when approved, auto-cancel conflicting pending slots
  updateAppointmentStatus: async (
    appointmentId: string,
    status: Appointment['status'],
    patientId?: string
  ): Promise<void> => {
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      const appointmentDoc = await getDoc(appointmentRef);
      if (!appointmentDoc.exists()) return;

      const data = appointmentDoc.data();
      await updateDoc(appointmentRef, { status });

      // When doctor APPROVES → auto-cancel all other pending for same slot
      if (status === 'scheduled') {
        const approvedDate = convertToDate(data.date ?? data.dateTime);
        const approvedSlot = format(approvedDate, 'yyyy-MM-dd HH:mm');

        const conflictsSnap = await getDocs(
          query(
            collection(db, 'appointments'),
            where('doctorId', '==', data.doctorId),
            where('status', '==', 'pending')
          )
        );

        const cancellations = conflictsSnap.docs
          .filter((d) => {
            if (d.id === appointmentId) return false;
            const slotDate = convertToDate(d.data().date ?? d.data().dateTime);
            return format(slotDate, 'yyyy-MM-dd HH:mm') === approvedSlot;
          })
          .map(async (d) => {
            await updateDoc(d.ref, { status: 'cancelled' });
            const conflictData = d.data();
            if (conflictData.patientId) {
              await notificationService.createNotification({
                userId: conflictData.patientId,
                title: 'Appointment Request Cancelled',
                message: `Your appointment request with Dr. ${conflictData.doctorName} on ${format(convertToDate(conflictData.date ?? conflictData.dateTime), 'PPp')} was cancelled because another patient was approved for that slot.`,
                type: 'warning',
                actionUrl: '/appointments',
              });
            }
          });

        if (cancellations.length > 0) await Promise.all(cancellations);

        // Notify the approved patient
        if (data.patientId) {
          await notificationService.createNotification({
            userId: data.patientId,
            title: 'Appointment Confirmed! ✅',
            message: `Your appointment with Dr. ${data.doctorName} on ${format(convertToDate(data.date ?? data.dateTime), 'PPp')} has been confirmed.`,
            type: 'success',
            actionUrl: '/appointments',
          });
        }
      }

      // Notify patient when appointment is cancelled by doctor
      if (status === 'cancelled' && data.patientId) {
        await notificationService.createNotification({
          userId: data.patientId,
          title: 'Appointment Cancelled',
          message: `Your appointment with Dr. ${data.doctorName} on ${format(convertToDate(data.date ?? data.dateTime), 'PPp')} has been cancelled.`,
          type: 'error',
          actionUrl: '/appointments',
        });
      }

      if (patientId) {
        await activityService.createActivity({
          userId: patientId,
          type: 'appointment',
          description: `Appointment with ${data.doctorName} is now ${status}`,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  },

  // Cancel appointment (patient side)
  cancelAppointment: async (appointmentId: string, patientId: string): Promise<void> => {
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      const appointmentDoc = await getDoc(appointmentRef);

      if (appointmentDoc.exists()) {
        const data = appointmentDoc.data();
        await updateDoc(appointmentRef, { status: 'cancelled' });

        await activityService.createActivity({
          userId: patientId,
          type: 'appointment',
          description: `Cancelled appointment with ${data.doctorName}`,
          timestamp: new Date(),
        });

        // Notify the doctor that the patient cancelled
        if (data.doctorId) {
          await notificationService.createNotification({
            userId: data.doctorId,
            title: 'Appointment Cancelled',
            message: `${data.patientName ?? 'A patient'} has cancelled their appointment on ${format(convertToDate(data.date ?? data.dateTime), 'PPp')}.`,
            type: 'warning',
            actionUrl: '/doctor/appointments',
          });
        }
      }
    } catch (error) {
      console.error('Error canceling appointment:', error);
      throw error;
    }
  },

  // Get already-booked time slots for a doctor on a given date
  // Only counts SCHEDULED (approved) appointments — pending ones don't block the slot
  getBookedSlots: async (doctorId: string, date: Date): Promise<string[]> => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const snap = await getDocs(
        query(
          collection(db, 'appointments'),
          where('doctorId', '==', doctorId),
          where('status', '==', 'scheduled')
        )
      );
      const booked: string[] = [];
      snap.forEach((d) => {
        const apptDate = convertToDate(d.data().date ?? d.data().dateTime);
        if (format(apptDate, 'yyyy-MM-dd') === dateStr) {
          booked.push(format(apptDate, 'HH:mm'));
        }
      });
      return booked;
    } catch (error) {
      console.error('Error getting booked slots:', error);
      return [];
    }
  },

  // Reschedule: update date, reset to pending, and notify the doctor.
  // A patient-initiated time change always requires fresh doctor approval.
  rescheduleAppointment: async (appointmentId: string, newDate: Date): Promise<void> => {
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      const appointmentDoc = await getDoc(appointmentRef);

      await updateDoc(appointmentRef, {
        date: Timestamp.fromDate(newDate),
        status: 'pending',
      });

      // Notify the doctor that the patient has rescheduled and needs re-approval
      if (appointmentDoc.exists()) {
        const data = appointmentDoc.data();
        if (data.doctorId) {
          await notificationService.createNotification({
            userId: data.doctorId,
            title: 'Appointment Rescheduled 🔄',
            message: `${data.patientName ?? 'A patient'} has rescheduled their appointment to ${format(newDate, 'PPp')}. Please review and approve the new time.`,
            type: 'warning',
            actionUrl: '/doctor/appointments',
          });
        }
      }
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      throw error;
    }
  },

  // Delete appointment (admin / doctor cancel)
  deleteAppointment: async (appointmentId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'appointments', appointmentId));
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  },
};
