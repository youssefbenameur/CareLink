
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, onSnapshot, collection, addDoc, updateDoc, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';

// Type for system settings
export interface SystemSetting {
  id?: string;
  name: string;
  value: any;
  category: string;
  description?: string;
  lastUpdated?: Date;
  updatedBy?: string;
}

// Type for system metrics
export interface SystemMetric {
  id?: string;
  name: string;
  value: number;
  timestamp: Date;
  category: string;
}

const systemSettingsService = {
  // Get all system settings
  getSystemSettings: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'systemSettings'));
      const settings: SystemSetting[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        settings.push({
          id: doc.id,
          name: data.name,
          value: data.value,
          category: data.category,
          description: data.description,
          lastUpdated: data.lastUpdated?.toDate(),
          updatedBy: data.updatedBy
        });
      });
      
      return settings;
    } catch (error) {
      console.error('Error getting system settings:', error);
      throw error;
    }
  },
  
  // Get a specific setting
  getSettingByName: async (name: string) => {
    try {
      const q = query(collection(db, 'systemSettings'), orderBy('name'));
      const snapshot = await getDocs(q);
      
      let setting = null;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.name === name) {
          setting = {
            id: doc.id,
            name: data.name,
            value: data.value,
            category: data.category,
            description: data.description,
            lastUpdated: data.lastUpdated?.toDate(),
            updatedBy: data.updatedBy
          };
        }
      });
      
      return setting;
    } catch (error) {
      console.error(`Error getting setting ${name}:`, error);
      throw error;
    }
  },
  
  // Update a setting
  updateSetting: async (settingId: string, value: any, userId: string) => {
    try {
      const settingRef = doc(db, 'systemSettings', settingId);
      await updateDoc(settingRef, {
        value,
        lastUpdated: new Date(),
        updatedBy: userId
      });
      return true;
    } catch (error) {
      console.error('Error updating system setting:', error);
      throw error;
    }
  },
  
  // Create a new setting
  createSetting: async (setting: SystemSetting, userId: string) => {
    try {
      const newSetting = {
        ...setting,
        lastUpdated: new Date(),
        updatedBy: userId
      };
      
      const docRef = await addDoc(collection(db, 'systemSettings'), newSetting);
      return { id: docRef.id, ...newSetting };
    } catch (error) {
      console.error('Error creating system setting:', error);
      throw error;
    }
  },
  
  // Subscribe to settings changes
  subscribeToSettings: (callback: (settings: SystemSetting[]) => void) => {
    const unsubscribe = onSnapshot(collection(db, 'systemSettings'), (snapshot) => {
      const settings: SystemSetting[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        settings.push({
          id: doc.id,
          name: data.name,
          value: data.value,
          category: data.category,
          description: data.description,
          lastUpdated: data.lastUpdated?.toDate(),
          updatedBy: data.updatedBy
        });
      });
      
      callback(settings);
    });
    
    return unsubscribe;
  },
  
  // Get system metrics for charts
  getSystemMetrics: async (category: string, limitCount: number = 30) => {
    try {
      const q = query(
        collection(db, 'systemMetrics'), 
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      const metrics: SystemMetric[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (category === 'all' || data.category === category) {
          metrics.push({
            id: doc.id,
            name: data.name,
            value: data.value,
            timestamp: data.timestamp.toDate(),
            category: data.category
          });
        }
      });
      
      return metrics.reverse(); // Reverse to get chronological order for charts
    } catch (error) {
      console.error('Error getting system metrics:', error);
      throw error;
    }
  },
  
  // Add a new metric data point
  addMetric: async (metric: Omit<SystemMetric, 'id'>) => {
    try {
      const newMetric = {
        ...metric,
        timestamp: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'systemMetrics'), newMetric);
      return { id: docRef.id, ...newMetric };
    } catch (error) {
      console.error('Error adding system metric:', error);
      throw error;
    }
  }
};

export default systemSettingsService;
