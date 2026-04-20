import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { moodTrackerService } from '@/services/moodTracker';
import { appointmentService, convertToDate } from '@/services/appointmentService';
import { isBefore } from 'date-fns';

export function useDashboardData() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    moodTrend: null as { currentMood: string; trend: 'up' | 'down' | 'stable'; percentage: number } | null,
    nextSession: null as { date: Date; doctorName: string } | null,
    recommendedResources: [] as any[],
    streak: null as { days: number; entries: boolean[] } | null,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);

        // --- Mood trend: fetch last 14 entries ---
        let moodTrend = null;
        try {
          const entries = await moodTrackerService.getUserMoodEntries(currentUser.uid);
          const last14 = entries.slice(0, 14);
          if (last14.length > 0) {
            const latestMood = last14[0].mood;
            const recent = last14.slice(0, 7);
            const older = last14.slice(7);
            const recentAvg = recent.reduce((s, e) => s + Number(e.mood), 0) / recent.length;
            const olderAvg = older.length
              ? older.reduce((s, e) => s + Number(e.mood), 0) / older.length
              : recentAvg;
            const diff = recentAvg - olderAvg;
            const trend = diff > 0.3 ? 'up' : diff < -0.3 ? 'down' : 'stable';
            const percentage = Math.abs(Math.round((diff / (olderAvg || 1)) * 100));
            moodTrend = { currentMood: `${latestMood}/5`, trend, percentage };
          }
        } catch (e) {
          console.warn('Could not fetch mood trend:', e);
        }

        // --- Next session: first upcoming scheduled appointment ---
        let nextSession = null;
        try {
          const appointments = await appointmentService.getPatientAppointments(currentUser.uid);
          const now = new Date();
          const upcoming = appointments
            .filter(a => a.status !== 'cancelled' && !isBefore(convertToDate(a.date), now))
            .sort((a, b) => convertToDate(a.date).getTime() - convertToDate(b.date).getTime());

          if (upcoming.length > 0) {
            nextSession = {
              date: convertToDate(upcoming[0].date),
              doctorName: upcoming[0].doctorName || 'Doctor',
            };
          }
        } catch (e) {
          console.warn('Could not fetch next session:', e);
        }

        // --- Streak: consecutive days with mood entries ---
        let streak = null;
        try {
          const allEntries = await moodTrackerService.getUserMoodEntries(currentUser.uid);
          const today = new Date();
          const entries: boolean[] = [];
          let days = 0;

          for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const hasEntry = allEntries.some(e => {
              const entryDate = e.createdAt instanceof Date
                ? e.createdAt
                : typeof (e.createdAt as any)?.toDate === 'function'
                  ? (e.createdAt as any).toDate()
                  : new Date(e.createdAt as any);
              return entryDate.toISOString().split('T')[0] === dateStr;
            });
            entries.push(hasEntry);
            if (hasEntry && (i === 0 || entries[i - 1])) days++;
          }

          streak = { days, entries: entries.reverse() };
        } catch (e) {
          console.warn('Could not fetch streak:', e);
        }

        setData({
          moodTrend,
          nextSession,
          recommendedResources: [],
          streak,
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
