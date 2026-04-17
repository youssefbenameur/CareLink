
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, addDoc, updateDoc, getDocs, query, orderBy } from 'firebase/firestore';

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
  
  // System metrics removed (cpu/memory/storage and related charts)
};

export default systemSettingsService;
