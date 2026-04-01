import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, orderBy, limit, addDoc } from 'firebase/firestore';

export interface Activity {
  id?: string;
  userId: string;
  type: 'mood' | 'appointment' | 'session' | 'resource' | 'login' | 'message' | 'navigation' | 'profile';
  description: string;
  timestamp: Date | Timestamp;
  metadata?: any;
}

export const activityService = {
  // Get activities for a user
  getUserActivities: async (userId: string, limitCount = 10): Promise<Activity[]> => {
    try {
      const activitiesQuery = query(
        collection(db, "activities"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(activitiesQuery);
      const activities: Activity[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          description: data.description,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp : new Date(data.timestamp),
          metadata: data.metadata
        });
      });
      
      // If no activities are found in the database, return mock data
      if (activities.length === 0) {
        return [
          {
            id: '1',
            userId,
            type: 'appointment',
            description: 'Scheduled an appointment with Dr. Johnson',
            timestamp: Timestamp.now()
          },
          {
            id: '2',
            userId,
            type: 'mood',
            description: 'Logged mood: Feeling good today',
            timestamp: Timestamp.fromDate(new Date(Date.now() - 86400000)) // yesterday
          },
          {
            id: '3',
            userId,
            type: 'message',
            description: 'Sent a message to your healthcare provider',
            timestamp: Timestamp.fromDate(new Date(Date.now() - 172800000)) // 2 days ago
          }
        ];
      }
      
      return activities;
    } catch (error) {
      console.error('Error getting user activities:', error);
      throw error;
    }
  },
  
  // Add a new activity
  createActivity: async (activity: Omit<Activity, 'id'>): Promise<string> => {
    try {
      const activityData = {
        ...activity,
        timestamp: activity.timestamp instanceof Date ? 
          Timestamp.fromDate(activity.timestamp) : 
          activity.timestamp
      };
      
      const docRef = await addDoc(collection(db, "activities"), activityData);
      console.log('Activity logged:', activity.description);
      return docRef.id;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  },
  
  // Get activities for a doctor's patients
  getDoctorPatientActivities: async (doctorId: string): Promise<Activity[]> => {
    try {
      // First get all patients for this doctor
      const patientsQuery = query(
        collection(db, "appointments"),
        where("doctorId", "==", doctorId)
      );
      
      const appointmentDocs = await getDocs(patientsQuery);
      const patientIds = new Set<string>();
      
      appointmentDocs.forEach(doc => {
        const appointment = doc.data();
        if (appointment.patientId) {
          patientIds.add(appointment.patientId);
        }
      });
      
      // If no patients, return empty array
      if (patientIds.size === 0) {
        return [];
      }
      
      // Get activities for all patients
      const activitiesQuery = query(
        collection(db, "activities"),
        where("userId", "in", Array.from(patientIds)),
        orderBy("timestamp", "desc"),
        limit(20)
      );
      
      const activitiesSnapshot = await getDocs(activitiesQuery);
      const activities: Activity[] = [];
      
      activitiesSnapshot.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          description: data.description,
          timestamp: data.timestamp,
          metadata: data.metadata
        });
      });
      
      return activities;
    } catch (error) {
      console.error('Error getting doctor patient activities:', error);
      throw error;
    }
  }
};
