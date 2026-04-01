
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, Timestamp, getDoc } from 'firebase/firestore';

export interface PatientNote {
  id?: string;
  patientId: string;
  doctorId: string;
  content: string;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  important?: boolean;
  category?: string;
}

export const patientNotesService = {
  async addNote(patientId: string, doctorId: string, content: string) {
    try {
      console.log('Adding patient note:', { patientId, doctorId, content });
      const noteData = {
        patientId,
        doctorId,
        content,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'patientNotes'), noteData);
      console.log('Note added with ID:', docRef.id);
      
      return { id: docRef.id, ...noteData };
    } catch (error) {
      console.error('Error adding patient note:', error);
      throw error;
    }
  },
  
  async updateNote(id: string, noteData: Partial<PatientNote>) {
    try {
      console.log('Updating note:', id, noteData);
      const docRef = doc(db, 'patientNotes', id);
      
      await updateDoc(docRef, {
        ...noteData,
        updatedAt: Timestamp.now()
      });
      
      console.log('Note updated successfully');
      return { id, ...noteData };
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  },
  
  async deleteNote(id: string) {
    try {
      console.log('Deleting note:', id);
      await deleteDoc(doc(db, 'patientNotes', id));
      console.log('Note deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  },
  
  async getNote(id: string) {
    try {
      console.log('Getting note:', id);
      const docRef = await getDoc(doc(db, 'patientNotes', id));
      
      if (!docRef.exists()) {
        console.log('Note not found with ID:', id);
        return null;
      }
      
      const data = docRef.data() as PatientNote;
      return {
        id: docRef.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
      } as PatientNote;
    } catch (error) {
      console.error('Error getting note:', error);
      throw error;
    }
  },
  
  async getPatientNotes(patientId: string, doctorId?: string) {
    try {
      console.log('Getting notes for patient:', patientId, doctorId ? `by doctor ${doctorId}` : '');
      
      let q;
      if (doctorId) {
        q = query(
          collection(db, 'patientNotes'), 
          where('patientId', '==', patientId),
          where('doctorId', '==', doctorId)
        );
      } else {
        q = query(
          collection(db, 'patientNotes'), 
          where('patientId', '==', patientId)
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      const notes: PatientNote[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data() as PatientNote;
        notes.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
        } as PatientNote);
      });
      
      console.log(`Found ${notes.length} notes for patient ${patientId}`);
      
      // Sort by creation date, newest first
      return notes.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date();
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date();
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error('Error getting patient notes:', error);
      throw error;
    }
  }
};
