
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, limit as firestoreLimit } from 'firebase/firestore';

export interface UserActivity {
  id?: string;
  userId: string;
  type: 'mood' | 'appointment' | 'resource' | 'session' | 'login';
  description: string;
  timestamp: Date;
  metadata?: any; // Optional additional data
}

export const activityFeedService = {
  // Add a new activity
  addActivity: async (activity: Omit<UserActivity, 'timestamp'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, "activities"), {
        ...activity,
        timestamp: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding activity:', error);
      throw error;
    }
  },
  
  // Get activities for a specific user
  getUserActivities: async (userId: string, limitCount = 10): Promise<UserActivity[]> => {
    try {
      const q = query(
        collection(db, "activities"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        firestoreLimit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const activities: UserActivity[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp)
        } as UserActivity);
      });
      
      return activities;
    } catch (error) {
      console.error('Error getting user activities:', error);
      throw error;
    }
  }
};
