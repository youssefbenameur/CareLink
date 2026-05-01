import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DoctorLayout from '@/components/layout/DoctorLayout';
import { collection, query, where, getDocs, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DashboardPatientList } from '@/components/doctor/DashboardPatientList';
import { DashboardAppointments } from '@/components/doctor/DashboardAppointments';
import { Appointment, convertToDate } from '@/services/appointmentService';
import { appointmentService } from '@/services/appointmentService';
import { Users, Calendar, MessageSquare, CalendarDays } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    newPatientsThisMonth: 0,
    todayAppointments: 0,
    completedToday: 0,
    pendingMessages: 0,
  });

  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!currentUser) return;
      try {
        setLoading(true);
        const doctorAppointments = await appointmentService.getDoctorAppointments(currentUser.uid);
        
        // Notify doctor about upcoming appointments today
        await appointmentService.notifyDoctorsAboutUpcomingAppointments(currentUser.uid);
        
        const uniquePatientIds = [...new Set(doctorAppointments.map(app => app.patientId))];

        const patientDetailsPromises = uniquePatientIds.map(async (patientId) => {
          try {
            const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", patientId)));
            if (!userDoc.empty) return { id: patientId, ...userDoc.docs[0].data() };
            return { id: patientId };
          } catch { return { id: patientId }; }
        });
        const patientDetails = await Promise.all(patientDetailsPromises);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const todayApps = doctorAppointments.filter(app => {
          const d = convertToDate(app.date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        });

        const newPatientsThisMonth = patientDetails.filter(p => {
          if (!p?.createdAt) return false;
          const d = p.createdAt instanceof Timestamp ? p.createdAt.toDate() : new Date(p.createdAt);
          return d >= firstDayOfMonth;
        }).length;

        setStats({
          totalPatients: uniquePatientIds.length,
          newPatientsThisMonth,
          todayAppointments: todayApps.length,
          completedToday: todayApps.filter(a => a.status === 'completed').length,
          pendingMessages: 0,
        });
      } catch (error) {
        console.error("Error fetching doctor data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctorData();
  }, [currentUser]);

  // Real-time listener for pending messages
  useEffect(() => {
    if (!currentUser?.uid) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      where('recipientId', '==', currentUser.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      setStats(prevStats => ({
        ...prevStats,
        pendingMessages: snapshot.size,
      }));
    }, (error) => {
      console.error('Error listening to messages:', error);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  if (loading) {
    return (
      <DoctorLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </DoctorLayout>
    );
  }

  const doctorName = userData?.name || currentUser?.displayName || 'Doctor';

  return (
    <DoctorLayout>
      <div className="space-y-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Doctor Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/doctor/appointments')}>
              <CalendarDays className="h-4 w-4 mr-2" />
              Appointments
            </Button>
            <Button size="sm" onClick={() => navigate('/doctor/chat')}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="text-3xl font-bold">{stats.totalPatients}</p>
              <p className="text-xs text-muted-foreground mt-1">
                +{stats.newPatientsThisMonth} new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">Today's Appointments</p>
                <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              <p className="text-3xl font-bold">{stats.todayAppointments}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.completedToday} completed, {stats.todayAppointments - stats.completedToday} remaining
              </p>
            </CardContent>
          </Card>

          <Card className="col-span-2 lg:col-span-1">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">Pending Messages</p>
                <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <p className="text-3xl font-bold">{stats.pendingMessages}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pendingMessages === 0 ? 'All caught up' : 'Unread messages'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Patients + Appointments */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <DashboardPatientList />
          <DashboardAppointments />
        </div>
      </div>
    </DoctorLayout>
  );
};

export default DoctorDashboard;
