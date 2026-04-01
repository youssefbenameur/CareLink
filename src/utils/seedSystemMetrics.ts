
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

// Function to seed system metrics data for testing charts
export async function seedSystemMetrics() {
  console.log("Seeding system metrics data...");
  
  const categories = ['cpu', 'memory', 'storage', 'users', 'sessions', 'api', 'uptime', 'appointments', 'messages', 'views', 'ai'];
  const now = new Date();
  const metrics = [];
  
  // Generate 24 hours of data for each category
  for (const category of categories) {
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000); // Last 24 hours
      
      let value;
      switch (category) {
        case 'cpu':
          value = Math.floor(Math.random() * 30) + 10; // 10-40%
          break;
        case 'memory':
          value = Math.random() * 4 + 2; // 2-6 GB
          break;
        case 'storage':
          value = Math.floor(Math.random() * 20) + 40; // 40-60%
          break;
        case 'users':
          value = Math.floor(Math.random() * 50) + 150; // 150-200 active users
          break;
        case 'sessions':
          value = Math.floor(Math.random() * 80) + 200; // 200-280 sessions
          break;
        case 'api':
          value = Math.floor(Math.random() * 200) + 800; // 800-1000 API calls
          break;
        case 'uptime':
          value = 30 + (i * 0.04); // Growing uptime (days)
          break;
        case 'appointments':
          value = Math.floor(Math.random() * 10) + 5; // 5-15 appointments
          break;
        case 'messages':
          value = Math.floor(Math.random() * 100) + 200; // 200-300 messages
          break;
        case 'views':
          value = Math.floor(Math.random() * 50) + 100; // 100-150 views
          break;
        case 'ai':
          value = Math.floor(Math.random() * 200) + 300; // 300-500ms AI response time
          break;
        default:
          value = Math.random() * 100;
      }
      
      metrics.push({
        category,
        name: category,
        value,
        timestamp: Timestamp.fromDate(timestamp)
      });
    }
  }
  
  // Save to Firebase
  for (const metric of metrics) {
    try {
      await addDoc(collection(db, 'systemMetrics'), metric);
    } catch (error) {
      console.error(`Error adding ${metric.category} metric:`, error);
    }
  }
  
  console.log(`Successfully seeded ${metrics.length} metrics for system charts.`);
}

// To run this function, uncomment the line below or call it from another component
// seedSystemMetrics();
