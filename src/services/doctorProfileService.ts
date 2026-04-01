
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface DoctorProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization?: string;
  education?: string;
  bio?: string;
  experience?: string;
  languages?: string;
  available?: boolean;
  consultationFee?: string | number;
  sessionDuration?: string | number;
  profileComplete?: boolean;
  profileImage?: string;
}

export const doctorProfileService = {
  async getDoctorProfile(doctorId: string) {
    try {
      console.log('Getting doctor profile:', doctorId);
      const docRef = doc(db, 'users', doctorId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.log('No doctor profile found with ID:', doctorId);
        return null;
      }
      
      return { id: docSnap.id, ...docSnap.data() } as DoctorProfile;
    } catch (error) {
      console.error('Error getting doctor profile:', error);
      throw error;
    }
  },
  
  async updateDoctorProfile(doctorId: string, profileData: Partial<DoctorProfile>) {
    try {
      console.log('Updating doctor profile:', doctorId, profileData);
      const docRef = doc(db, 'users', doctorId);
      
      // Check if we're updating enough fields to mark profile as complete
      let updatedData = { ...profileData };
      
      // If updating key profile fields, determine if profile is now complete
      if (
        profileData.firstName || 
        profileData.lastName || 
        profileData.specialization || 
        profileData.education ||
        profileData.bio
      ) {
        const currentData = await this.getDoctorProfile(doctorId);
        const mergedData = { ...currentData, ...profileData };
        
        // Check if all required fields are filled
        const isComplete = !!(
          mergedData.firstName &&
          mergedData.lastName &&
          mergedData.specialization &&
          mergedData.education &&
          mergedData.bio
        );
        
        updatedData.profileComplete = isComplete;
      }
      
      await updateDoc(docRef, {
        ...updatedData,
        updatedAt: new Date().toISOString()
      });
      
      console.log('Doctor profile updated successfully');
      return { id: doctorId, ...profileData };
    } catch (error) {
      console.error('Error updating doctor profile:', error);
      throw error;
    }
  },
  
  async createDoctorProfile(doctorId: string, profileData: Partial<DoctorProfile>) {
    try {
      console.log('Creating doctor profile:', doctorId, profileData);
      const docRef = doc(db, 'users', doctorId);
      
      await setDoc(docRef, {
        ...profileData,
        role: 'doctor',
        profileComplete: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      console.log('Doctor profile created successfully');
      return { id: doctorId, ...profileData };
    } catch (error) {
      console.error('Error creating doctor profile:', error);
      throw error;
    }
  },
  
  async getAllDoctors() {
    try {
      // This will need to be implemented with a query
      // For now, this is a placeholder
      console.log('This method needs to be implemented with proper querying');
      return [];
    } catch (error) {
      console.error('Error getting all doctors:', error);
      throw error;
    }
  }
};
