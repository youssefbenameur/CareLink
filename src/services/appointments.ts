
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp, updateDoc, doc, getDoc } from 'firebase/firestore';

// Interface for the appointment
export interface Appointment {
  id?: string;
  patientId: string;
  doctorId?: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  type: 'video' | 'chat';
  notes?: string;
  reason?: string;
  doctorName?: string; // Added doctorName property
}

// Service for appointments
export const appointmentService = {
  // Add a new appointment
  createAppointment: async (appointment: Omit<Appointment, 'id' | 'status'>) => {
    try {
      const docRef = await addDoc(collection(db, 'appointments'), {
        ...appointment,
        status: 'pending',
        date: Timestamp.fromDate(appointment.date)
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  },

  // Get appointments for a specific patient
  getPatientAppointments: async (patientId: string) => {
    try {
      const q = query(
        collection(db, 'appointments'),
        where('patientId', '==', patientId)
      );
      
      const querySnapshot = await getDocs(q);
      const appointments: Appointment[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        appointments.push({
          id: doc.id,
          ...data,
          date: (data.date as Timestamp).toDate(),
        } as Appointment);
      });
      
      return appointments;
    } catch (error) {
      console.error('Error getting patient appointments:', error);
      throw error;
    }
  },

  // Update appointment status
  updateAppointmentStatus: async (appointmentId: string, status: Appointment['status']) => {
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await updateDoc(appointmentRef, { status });
      return true;
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  },

  // Get available doctors
  getAvailableDoctors: async () => {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'doctor')
      );
      
      const querySnapshot = await getDocs(q);
      const doctors: any[] = [];
      
      querySnapshot.forEach((doc) => {
        doctors.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return doctors;
    } catch (error) {
      console.error('Error getting available doctors:', error);
      throw error;
    }
  }
};
