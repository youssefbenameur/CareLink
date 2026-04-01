
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc, query, collection, where, getDocs, updateDoc, Timestamp } from 'firebase/firestore';

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  specialty?: string;
  bio?: string;
  education?: string;
  experience?: string;
  languages?: string[];
  consultationFee?: number;
  sessionDuration?: number;
  availability?: string;
  createdAt?: Date | Timestamp | string;
  status?: string; // Added status property
}

export const userService = {
  
  // Get current user data
  getCurrentUser: async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as UserData;
      }
      return null;
    } catch (error) {
      console.error('Error getting current user data:', error);
      throw error;
    }
  },
  
  // Update user data
  updateUserData: async (uid: string, userData: Partial<UserData>) => {
    try {
      await updateDoc(doc(db, 'users', uid), userData);
      return { success: true };
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  },
  
  // Get user by ID
  getUserById: async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as UserData;
      }
      return null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  },
  
  // Get doctor's patients
  getDoctorPatients: async (doctorId: string) => {
    try {
      // First, get all appointments for this doctor
      const appointmentQuery = query(
        collection(db, 'appointments'),
        where('doctorId', '==', doctorId)
      );
      
      const appointmentDocs = await getDocs(appointmentQuery);
      const patientIds = new Set<string>();
      
      // Collect all unique patient IDs
      appointmentDocs.forEach(doc => {
        const appointment = doc.data();
        if (appointment.patientId) {
          patientIds.add(appointment.patientId);
        }
      });
      
      // Get data for each patient
      const patients: UserData[] = [];
      for (const patientId of patientIds) {
        const patientData = await userService.getUserById(patientId);
        if (patientData) {
          patients.push(patientData);
        }
      }
      
      return patients;
    } catch (error) {
      console.error('Error getting doctor patients:', error);
      throw error;
    }
  },

  // Get all patients (for admin or doctor access)
  getAllPatients: async () => {
    try {
      const patientsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'patient')
      );
      
      const patientDocs = await getDocs(patientsQuery);
      const patients: UserData[] = [];
      
      patientDocs.forEach(doc => {
        patients.push({ id: doc.id, ...doc.data() } as UserData);
      });
      
      return patients;
    } catch (error) {
      console.error('Error getting all patients:', error);
      throw error;
    }
  },
  
  // Get assigned doctors for a patient
  getAssignedDoctors: async (patientId: string) => {
    try {
      const appointmentQuery = query(
        collection(db, 'appointments'),
        where('patientId', '==', patientId)
      );
      
      const appointmentDocs = await getDocs(appointmentQuery);
      const doctorIds = new Set<string>();
      
      appointmentDocs.forEach(doc => {
        const appointment = doc.data();
        if (appointment.doctorId) {
          doctorIds.add(appointment.doctorId);
        }
      });
      
      const doctors: UserData[] = [];
      for (const doctorId of doctorIds) {
        const doctorData = await userService.getUserById(doctorId);
        if (doctorData) {
          doctors.push(doctorData);
        }
      }
      
      return doctors;
    } catch (error) {
      console.error('Error getting assigned doctors:', error);
      throw error;
    }
  },
  
  // Create or update user profile
  createUserProfile: async (user: UserData) => {
    try {
      await setDoc(doc(db, 'users', user.id), {
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }
};
