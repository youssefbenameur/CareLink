
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, Timestamp, where } from 'firebase/firestore';

export interface SystemMetricData {
  category: string;
  name: string;
  value: number;
  timestamp?: Date;
}

export interface SystemStatusData {
  cpu: number;
  memory: number;
  storage: number;
  users: number;
  uptime: number;
  lastChecked: Date;
}

const metricService = {
  // Add a new metric reading
  addMetricReading: async (metricData: SystemMetricData): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, 'systemMetrics'), {
        ...metricData,
        timestamp: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding metric:', error);
      throw error;
    }
  },
  
  // Get recent metrics for a specific category
  getRecentMetrics: async (category: string, hours: number = 24): Promise<SystemMetricData[]> => {
    try {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);
      
      const q = query(
        collection(db, 'systemMetrics'),
        where('category', '==', category),
        where('timestamp', '>=', Timestamp.fromDate(startTime)),
        orderBy('timestamp', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const metrics: SystemMetricData[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        metrics.push({
          category: data.category,
          name: data.name,
          value: data.value,
          timestamp: data.timestamp.toDate()
        });
      });
      
      return metrics;
    } catch (error) {
      console.error(`Error getting ${category} metrics:`, error);
      throw error;
    }
  },
  
  // Get the latest system status
  getSystemStatus: async (): Promise<SystemStatusData> => {
    try {
      const cpuQuery = query(collection(db, 'systemMetrics'), 
        where('category', '==', 'cpu'), 
        orderBy('timestamp', 'desc'), 
        limit(1)
      );
      
      const memoryQuery = query(collection(db, 'systemMetrics'), 
        where('category', '==', 'memory'), 
        orderBy('timestamp', 'desc'), 
        limit(1)
      );
      
      const storageQuery = query(collection(db, 'systemMetrics'), 
        where('category', '==', 'storage'), 
        orderBy('timestamp', 'desc'), 
        limit(1)
      );
      
      const usersQuery = query(collection(db, 'systemMetrics'), 
        where('category', '==', 'users'), 
        orderBy('timestamp', 'desc'), 
        limit(1)
      );
      
      const uptimeQuery = query(collection(db, 'systemMetrics'), 
        where('category', '==', 'uptime'), 
        orderBy('timestamp', 'desc'), 
        limit(1)
      );
      
      const [cpuSnapshot, memorySnapshot, storageSnapshot, usersSnapshot, uptimeSnapshot] = 
        await Promise.all([
          getDocs(cpuQuery),
          getDocs(memoryQuery),
          getDocs(storageQuery),
          getDocs(usersQuery),
          getDocs(uptimeQuery)
        ]);
      
      let cpu = 0, memory = 0, storage = 0, users = 0, uptime = 0;
      let lastChecked = new Date();
      
      if (!cpuSnapshot.empty) {
        const cpuData = cpuSnapshot.docs[0].data();
        cpu = cpuData.value || 0;
        lastChecked = cpuData.timestamp.toDate();
      }
      
      if (!memorySnapshot.empty) {
        const memoryData = memorySnapshot.docs[0].data();
        memory = memoryData.value || 0;
      }
      
      if (!storageSnapshot.empty) {
        const storageData = storageSnapshot.docs[0].data();
        storage = storageData.value || 0;
      }
      
      if (!usersSnapshot.empty) {
        const userData = usersSnapshot.docs[0].data();
        users = userData.value || 0;
      }
      
      if (!uptimeSnapshot.empty) {
        const uptimeData = uptimeSnapshot.docs[0].data();
        uptime = uptimeData.value || 0;
      }
      
      return {
        cpu,
        memory,
        storage,
        users,
        uptime,
        lastChecked
      };
    } catch (error) {
      console.error('Error getting system status:', error);
      throw error;
    }
  }
};

export default metricService;
