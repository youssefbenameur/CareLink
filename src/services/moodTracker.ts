
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';

export interface MoodEntry {
  id?: string;
  userId: string;
  mood: number; // 1-5 scale
  notes?: string;
  activities?: string[];
  sleepHours?: number;
  anxietyLevel?: number;
  createdAt: Date | Timestamp;
}

export const moodTrackerService = {
  // Add a new mood entry
  addMoodEntry: async (entry: Omit<MoodEntry, 'id' | 'createdAt'>): Promise<string> => {
    try {
      const entryData = {
        ...entry,
        createdAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, "moodEntries"), entryData);
      
      // Also log this as an activity
      await addDoc(collection(db, "activities"), {
        userId: entry.userId,
        type: 'mood',
        description: `Logged mood: ${getMoodText(entry.mood)}`,
        timestamp: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding mood entry:', error);
      throw error;
    }
  },
  
  // Get all mood entries for a user
  getUserMoodEntries: async (userId: string): Promise<MoodEntry[]> => {
    try {
      const entriesQuery = query(
        collection(db, "moodEntries"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(entriesQuery);
      const entries: MoodEntry[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt
        } as MoodEntry);
      });
      
      return entries;
    } catch (error) {
      console.error('Error getting mood entries:', error);
      throw error;
    }
  },
  
  // Get latest mood entry for a user
  getLatestMoodEntry: async (userId: string): Promise<MoodEntry | null> => {
    try {
      const entriesQuery = query(
        collection(db, "moodEntries"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      
      const querySnapshot = await getDocs(entriesQuery);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt
      } as MoodEntry;
    } catch (error) {
      console.error('Error getting latest mood entry:', error);
      throw error;
    }
  },
  
  // Check if user has logged mood today
  hasLoggedMoodToday: async (userId: string): Promise<boolean> => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const entriesQuery = query(
        collection(db, "moodEntries"),
        where("userId", "==", userId),
        where("createdAt", ">=", Timestamp.fromDate(today))
      );
      
      const querySnapshot = await getDocs(entriesQuery);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking if mood logged today:', error);
      throw error;
    }
  },
  
  // Adding the getMoodText function as a method of the service
  getMoodText: (mood: number): string => {
    switch (mood) {
      case 5: return "Great";
      case 4: return "Good";
      case 3: return "Okay";
      case 2: return "Low";
      case 1: return "Poor";
      default: return "Unknown";
    }
  }
};

// Helper function to convert mood number to text
export function getMoodText(mood: number): string {
  return moodTrackerService.getMoodText(mood);
}
