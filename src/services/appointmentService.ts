import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp, orderBy, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { activityService } from './activityService';
import { format } from 'date-fns';

export interface Appointment {
  id?: string;
  patientId: string;
  doctorId: string;
  date: Date | Timestamp;
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending';
  type: 'Video Call' | 'Chat Session' | 'In-person';
  notes?: string;
  patientName?: string;
  doctorName?: string;
  reason?: string;
}

// Helper function to convert Timestamp to Date
export const convertToDate = (dateOrTimestamp: Date | Timestamp): Date => {
  if (dateOrTimestamp instanceof Timestamp) {
    return dateOrTimestamp.toDate();
  }
  return dateOrTimestamp as Date;
};

export const appointmentService = {
  // Get appointments for a patient
  getPatientAppointments: async (patientId: string): Promise<Appointment[]> => {
    try {
      const appointmentsQuery = query(
        collection(db, "appointments"),
        where("patientId", "==", patientId)
      );

      const querySnapshot = await getDocs(appointmentsQuery);
      const appointments: Appointment[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        appointments.push({
          id: doc.id,
          patientId: data.patientId,
          doctorId: data.doctorId,
          // Handle different date formats by checking the type
          date: data.date instanceof Timestamp ? data.date :
            typeof data.date === 'string' ? new Date(data.date) :
              data.dateTime ? new Date(data.dateTime) : new Date(),
          status: data.status,
          type: data.type || 'Video Call',
          notes: data.notes,
          patientName: data.patientName,
          doctorName: data.doctorName,
          reason: data.reason,
        });
      });

      // Sort by date
      return appointments.sort((a, b) => {
        const dateA = a.date instanceof Timestamp ? a.date.toDate().getTime() : new Date(a.date).getTime();
        const dateB = b.date instanceof Timestamp ? b.date.toDate().getTime() : new Date(b.date).getTime();
        return dateA - dateB;
      });
    } catch (error) {
      console.error('Error getting patient appointments:', error);
      throw error;
    }
  },

  // Get available doctors
  getAvailableDoctors: async () => {
    try {
      const doctorsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'doctor')
      );

      const querySnapshot = await getDocs(doctorsQuery);

      const doctors = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        doctors.push({
          id: doc.id,
          name: data.name || 'Unknown Doctor',
          specialty: data.specialty || 'General',
          // Add other relevant doctor fields
        });
      });

      return doctors;
    } catch (error) {
      console.error('Error getting available doctors:', error);
      // Return a mock list of doctors when API fails
      return [
        { id: 'doc1', name: 'Dr. Smith', specialty: 'Psychiatrist' },
        { id: 'doc2', name: 'Dr. Johnson', specialty: 'Psychologist' },
        { id: 'doc3', name: 'Dr. Williams', specialty: 'Therapist' }
      ];
    }
  },

  // Get upcoming appointments for a patient
  getUpcomingAppointments: async (patientId: string): Promise<Appointment[]> => {
    try {
      const allAppointments = await appointmentService.getPatientAppointments(patientId);
      const now = new Date();

      // Filter to only include future appointments that aren't cancelled
      return allAppointments
        .filter(app => {
          const appDate = app.date instanceof Timestamp ?
            app.date.toDate() :
            new Date(app.date);
          return appDate > now && app.status !== 'cancelled';
        })
        .sort((a, b) => {
          const dateA = a.date instanceof Timestamp ? a.date.toDate().getTime() : new Date(a.date).getTime();
          const dateB = b.date instanceof Timestamp ? b.date.toDate().getTime() : new Date(b.date).getTime();
          return dateA - dateB;
        });
    } catch (error) {
      console.error('Error getting upcoming appointments:', error);
      throw error;
    }
  },

  // Get appointments for a doctor
  getDoctorAppointments: async (doctorId: string): Promise<Appointment[]> => {
    try {
      console.log(`Fetching appointments for doctor: ${doctorId}`);
      const appointmentsQuery = query(
        collection(db, "appointments"),
        where("doctorId", "==", doctorId)
      );

      const querySnapshot = await getDocs(appointmentsQuery);
      const appointments: Appointment[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("Appointment data:", data);
        appointments.push({
          id: doc.id,
          patientId: data.patientId,
          doctorId: data.doctorId,
          // Handle different date formats by checking the type
          date: data.date instanceof Timestamp ? data.date :
            typeof data.date === 'string' ? new Date(data.date) :
              data.dateTime ? new Date(data.dateTime) : new Date(),
          status: data.status,
          type: data.type || 'Video Call',
          notes: data.notes,
          patientName: data.patientName,
          doctorName: data.doctorName,
          reason: data.reason,
        });
      });

      console.log(`Found ${appointments.length} appointments for doctor ${doctorId}`);
      // Sort by date
      return appointments.sort((a, b) => {
        const dateA = a.date instanceof Timestamp ? a.date.toDate().getTime() : new Date(a.date).getTime();
        const dateB = b.date instanceof Timestamp ? b.date.toDate().getTime() : new Date(b.date).getTime();
        return dateA - dateB;
      });
    } catch (error) {
      console.error('Error getting doctor appointments:', error);
      throw error;
    }
  },

  // Create a new appointment
  createAppointment: async (appointment: Omit<Appointment, 'id'>): Promise<string> => {
    try {
      console.log("Creating appointment with data:", appointment);

      // Get doctor name if doctorId is provided
      let doctorName = 'Unknown Doctor';
      if (appointment.doctorId) {
        const doctorDoc = await getDoc(doc(db, "users", appointment.doctorId));
        if (doctorDoc.exists()) {
          doctorName = doctorDoc.data().name || 'Unknown Doctor';
        }
      }

      // Get patient name
      const patientDoc = await getDoc(doc(db, "users", appointment.patientId));
      const patientName = patientDoc.exists() ? patientDoc.data().name : 'Unknown Patient';

      // Store consistent date format
      const appointmentData = {
        ...appointment,
        doctorName,
        patientName,
        date: appointment.date instanceof Date ?
          Timestamp.fromDate(appointment.date) :
          appointment.date,
        createdAt: Timestamp.now()
      };

      console.log("Saving appointment with data:", appointmentData);
      const docRef = await addDoc(collection(db, "appointments"), appointmentData);

      // Log this as an activity
      await activityService.createActivity({
        userId: appointment.patientId,
        type: 'appointment',
        description: `Scheduled an appointment with ${doctorName}`,
        timestamp: new Date()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  },

  // Update appointment status
  updateAppointmentStatus: async (appointmentId: string, status: Appointment['status'], patientId?: string): Promise<void> => {
    try {
      const appointmentRef = doc(db, "appointments", appointmentId);
      const appointmentDoc = await getDoc(appointmentRef);

      if (appointmentDoc.exists()) {
        const appointmentData = appointmentDoc.data();
        await updateDoc(appointmentRef, { status });

        // Log this as an activity only if patientId is provided
        if (patientId) {
          await activityService.createActivity({
            userId: patientId,
            type: 'appointment',
            description: `Appointment with ${appointmentData.doctorName} is now ${status}`,
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId: string, patientId: string): Promise<void> => {
    try {
      const appointmentRef = doc(db, "appointments", appointmentId);
      const appointmentDoc = await getDoc(appointmentRef);

      if (appointmentDoc.exists()) {
        const appointmentData = appointmentDoc.data();
        await updateDoc(appointmentRef, { status: 'cancelled' });

        // Log this as an activity
        await activityService.createActivity({
          userId: patientId,
          type: 'appointment',
          description: `Cancelled appointment with ${appointmentData.doctorName}`,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error canceling appointment:', error);
      throw error;
    }
  },

  // Get booked time slots for a doctor on a specific date
  getBookedSlots: async (doctorId: string, date: Date): Promise<string[]> => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const q = query(
        collection(db, 'appointments'),
        where('doctorId', '==', doctorId),
        where('status', 'in', ['scheduled', 'pending'])
      );
      const snapshot = await getDocs(q);
      const booked: string[] = [];
      snapshot.forEach(d => {
        const data = d.data();
        const apptDate = data.date instanceof Timestamp ? data.date.toDate() :
          typeof data.date === 'string' ? new Date(data.date) : new Date();
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

  // Delete appointment (admin only)
  deleteAppointment: async (appointmentId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, "appointments", appointmentId));
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  }
};
