
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, Timestamp, DocumentData, getDoc } from 'firebase/firestore';

export interface MedicalRecord {
  id?: string;
  patientId: string;
  patientName: string;
  type: string;
  title: string;
  description: string;
  date: Date | Timestamp;
  doctorId: string;
  doctorName: string;
  attachments?: string[];
}

// Helper function to convert Timestamp to Date
const formatDate = (date: Date | Timestamp): Date => {
  if (date instanceof Timestamp) {
    return date.toDate();
  }
  return date;
};

// Helper function to convert Date to Timestamp for Firestore
const toFirestoreDate = (date: Date | Timestamp): Timestamp => {
  if (date instanceof Date) {
    return Timestamp.fromDate(date);
  }
  return date;
};

export const medicalRecordsService = {
  async createRecord(record: Omit<MedicalRecord, 'id'>) {
    try {
      console.log('Creating medical record:', record);
      const recordData = {
        ...record,
        date: toFirestoreDate(record.date),
        createdAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'medicalRecords'), recordData);
      console.log('Medical record created with ID:', docRef.id);
      return { id: docRef.id, ...record };
    } catch (error) {
      console.error('Error creating medical record:', error);
      throw error;
    }
  },

  async updateRecord(id: string, record: Partial<MedicalRecord>) {
    try {
      console.log('Updating medical record:', id, record);
      const docRef = doc(db, 'medicalRecords', id);
      const updatedRecord = { ...record };
      
      // Convert Date to Timestamp if present
      if (record.date) {
        updatedRecord.date = toFirestoreDate(record.date);
      }
      
      await updateDoc(docRef, updatedRecord);
      console.log('Medical record updated successfully');
      return { id, ...record };
    } catch (error) {
      console.error('Error updating medical record:', error);
      throw error;
    }
  },

  async deleteRecord(id: string) {
    try {
      console.log('Deleting medical record:', id);
      await deleteDoc(doc(db, 'medicalRecords', id));
      console.log('Medical record deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting medical record:', error);
      throw error;
    }
  },

  async getRecord(id: string) {
    try {
      console.log('Getting medical record:', id);
      const docRef = await getDoc(doc(db, 'medicalRecords', id));
      
      if (!docRef.exists()) {
        console.log('No medical record found with ID:', id);
        return null;
      }
      
      const data = docRef.data();
      return {
        id: docRef.id,
        ...data,
        date: data?.date instanceof Timestamp ? data.date.toDate() : data?.date
      } as MedicalRecord;
    } catch (error) {
      console.error('Error getting medical record:', error);
      throw error;
    }
  },

  async getPatientRecords(patientId: string) {
    try {
      console.log('Getting records for patient:', patientId);
      const q = query(collection(db, 'medicalRecords'), where('patientId', '==', patientId));
      const querySnapshot = await getDocs(q);
      
      const records: MedicalRecord[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        records.push({
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate() : data.date
        } as MedicalRecord);
      });
      
      console.log(`Found ${records.length} records for patient ${patientId}`);
      return records;
    } catch (error) {
      console.error('Error getting patient records:', error);
      throw error;
    }
  },

  async getDoctorRecords(doctorId: string) {
    try {
      console.log('Getting records by doctor:', doctorId);
      const q = query(collection(db, 'medicalRecords'), where('doctorId', '==', doctorId));
      const querySnapshot = await getDocs(q);
      
      const records: MedicalRecord[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        records.push({
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate() : data.date
        } as MedicalRecord);
      });
      
      console.log(`Found ${records.length} records by doctor ${doctorId}`);
      return records;
    } catch (error) {
      console.error('Error getting doctor records:', error);
      throw error;
    }
  }
};
