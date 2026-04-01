
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useDashboardData() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    moodTrend: null,
    nextSession: null,
    recommendedResources: [],
    streak: null
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;
      
      try {
        // This is placeholder data - in a real app this would fetch from an API or database
        setData({
          moodTrend: {
            currentMood: '8/10',
            trend: 'up',
            percentage: 15
          },
          nextSession: {
            date: new Date(Date.now() + 86400000), // Tomorrow
            doctorName: 'Dr. Smith'
          },
          recommendedResources: [
            { id: '1', title: 'Mindfulness Techniques' },
            { id: '2', title: 'Sleep Improvement Guide' }
          ],
          streak: {
            days: 5,
            entries: [true, true, true, true, true, false, false]
          }
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [currentUser]);
  
  return { data, loading };
}
