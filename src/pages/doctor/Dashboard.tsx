
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DoctorLayout from '@/components/layout/DoctorLayout';
import { appointmentService } from '@/services/appointmentService';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DashboardHeader } from '@/components/doctor/DashboardHeader';
import { DashboardStats } from '@/components/doctor/DashboardStats';
import { DashboardPatientList } from '@/components/doctor/DashboardPatientList';
import { DashboardAppointments } from '@/components/doctor/DashboardAppointments';
import { PatientActivityTimeline } from '@/components/doctor/PatientActivityTimeline';
import { AnimatedSection } from '@/components/ui/animated-section';
import { Appointment, convertToDate } from '@/services/appointmentService';
import { useTranslation } from 'react-i18next';

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const { t } = useTranslation(['doctorDashboard']);
  const [stats, setStats] = useState({
    totalPatients: 0,
    newPatientsThisMonth: 0,
    todayAppointments: 0,
    completedToday: 0,
    pendingMessages: 0,
    attentionRequired: 0
  });

  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        // Fetch appointments
        const doctorAppointments = await appointmentService.getDoctorAppointments(currentUser.uid);
        setAppointments(doctorAppointments);
        
        // Fetch unique patients
        const uniquePatientIds = [...new Set(doctorAppointments.map(app => app.patientId))];
        
        // Get patient details
        const patientDetailsPromises = uniquePatientIds.map(async (patientId) => {
          try {
            const userDoc = await getDocs(query(
              collection(db, "users"),
              where("uid", "==", patientId)
            ));
            
            if (!userDoc.empty) {
              return { id: patientId, ...userDoc.docs[0].data() };
            }
            return { id: patientId, name: "Unknown Patient" };
          } catch (error) {
            console.error("Error fetching patient:", error);
            return { id: patientId, name: "Unknown Patient" };
          }
        });
        
        const patientDetails = await Promise.all(patientDetailsPromises);
        setPatients(patientDetails);
        
        // Calculate stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Today's appointments
        const todayApps = doctorAppointments.filter(app => {
          const appDate = convertToDate(app.date);
          const appDateStart = new Date(appDate);
          appDateStart.setHours(0, 0, 0, 0);
          return appDateStart.getTime() === today.getTime();
        });
        
        const completedToday = todayApps.filter(app => app.status === 'completed').length;
        
        // Count patients who joined this month
        const newPatientsThisMonth = patientDetails.filter(patient => {
          if (patient && typeof patient === 'object' && 'createdAt' in patient && patient.createdAt) {
            let createdAtDate: Date;
            
            if (patient.createdAt instanceof Timestamp) {
              createdAtDate = patient.createdAt.toDate();
            } else if (typeof patient.createdAt === 'string' || typeof patient.createdAt === 'number') {
              createdAtDate = new Date(patient.createdAt);
            } else {
              return false; // Skip if createdAt is not a valid type
            }
            
            return createdAtDate >= firstDayOfMonth;
          }
          return false;
        }).length;
        
        // For now, let's use mock data for messages and attention required
        const pendingMessagesCount = 5;
        const attentionRequiredCount = 2;
        
        setStats({
          totalPatients: uniquePatientIds.length,
          newPatientsThisMonth,
          todayAppointments: todayApps.length,
          completedToday,
          pendingMessages: pendingMessagesCount,
          attentionRequired: attentionRequiredCount
        });
        
      } catch (error) {
        console.error("Error fetching doctor data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDoctorData();
  }, [currentUser]);

  const handleViewCalendar = () => navigate('/doctor/appointments');
  const handlePatientMessages = () => navigate('/doctor/chat');

  if (loading) {
    return (
      <DoctorLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <div className="space-y-3 p-3 max-w-7xl mx-auto">
        <DashboardHeader
          doctorName={currentUser?.displayName?.split(' ')[0] || 'User'}
          onViewCalendar={handleViewCalendar}
          onPatientMessages={handlePatientMessages}
        />
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="overview">{t('doctorDashboard:tabs.overview')}</TabsTrigger>
            <TabsTrigger value="patients">{t('doctorDashboard:tabs.patients')}</TabsTrigger>
            <TabsTrigger value="appointments">{t('doctorDashboard:tabs.appointments')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-3 mt-3">
            <DashboardStats stats={stats} />
            
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
              <AnimatedSection delay={0.2} direction="up">
                <DashboardPatientList />
              </AnimatedSection>
              <AnimatedSection delay={0.3} direction="up">
                <DashboardAppointments />
              </AnimatedSection>
            </div>
          
            <AnimatedSection delay={0.4} direction="up">
              <PatientActivityTimeline />
            </AnimatedSection>
          </TabsContent>
        
          <TabsContent value="patients" className="mt-3">
            <AnimatedSection delay={0.1}>
              <DashboardPatientList />
            </AnimatedSection>
          </TabsContent>
        
          <TabsContent value="appointments" className="mt-3">
            <AnimatedSection delay={0.1}>
              <DashboardAppointments />
            </AnimatedSection>
          </TabsContent>
        </Tabs>
      </div>
    </DoctorLayout>
  );
};

export default DoctorDashboard;
