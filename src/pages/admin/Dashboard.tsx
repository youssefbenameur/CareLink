import { useEffect, useState } from 'react';
import { 
  Users, 
  Activity, 
  Settings,
  MessageSquare,
  UserCheck,
  HelpCircle,
  FileText,
  TicketCheck
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/components/layout/AdminLayout';
import { Link } from 'react-router-dom';
import { AnimatedSection } from '@/components/ui/animated-section';
import { SupportTicket } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, query, orderBy, limit, where, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: '0',
    activeDoctors: '0',
    activePatients: '0',
    pendingDoctors: '0',
    pendingSupportTickets: '0',
  });
  
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation(['admin', 'common']);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Use getCountFromServer() for all stat counts — avoids downloading
        // every user document just to count them (saves bandwidth and cost).
        const [
          activePatientsSnap,
          approvedDoctorsSnap,
          pendingDoctorsSnap,
          pendingTicketsSnap,
        ] = await Promise.all([
          getCountFromServer(query(collection(db, 'users'), where('role', '==', 'patient'))),
          getCountFromServer(query(collection(db, 'users'), where('role', '==', 'doctor'), where('doctorVerificationStatus', '==', 'approved'))),
          getCountFromServer(query(collection(db, 'users'), where('role', '==', 'doctor'), where('doctorVerificationStatus', '==', 'pending'))),
          getCountFromServer(query(collection(db, 'supportTickets'), where('status', '==', 'Open'))),
        ]);

        const activePatients = activePatientsSnap.data().count;
        const activeDoctors = approvedDoctorsSnap.data().count;
        const pendingDoctors = pendingDoctorsSnap.data().count;
        const pendingSupportTickets = pendingTicketsSnap.data().count;

        setStats({
          totalUsers: (activePatients + activeDoctors).toString(),
          activeDoctors: activeDoctors.toString(),
          activePatients: activePatients.toString(),
          pendingDoctors: pendingDoctors.toString(),
          pendingSupportTickets: pendingSupportTickets.toString(),
        });

        // Pending doctor approvals preview — fetch only the fields we need
        const pendingDoctorDocsSnap = await getDocs(
          query(
            collection(db, 'users'),
            where('role', '==', 'doctor'),
            where('doctorVerificationStatus', '==', 'pending'),
            limit(5),
          )
        );
        setRecentUsers(pendingDoctorDocsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Fetch support tickets from real Firestore collection
        const ticketsSnap = await getDocs(
          query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'), limit(5))
        );
        const realTickets = ticketsSnap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            user: data.userName || 'Unknown',
            userId: data.userId,
            issue: data.subject || data.issue || '',
            description: data.description || '',
            type: data.type || 'other',
            status: data.status || 'Open',
            priority: data.priority || 'medium',
            time: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          };
        });
        setSupportTickets(realTickets);
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        toast({
          variant: 'destructive',
          title: t('common:errors.generic'),
          description: t('common:errors.dataFetch'),
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast, t]);

  const statsArray = [
    {
      title: 'Active Patients',
      value: stats.activePatients,
      icon: Users,
    },
    {
      title: 'Approved Doctors',
      value: stats.activeDoctors,
      icon: UserCheck,
    },
    {
      title: 'Pending Support Tickets',
      value: stats.pendingSupportTickets,
      icon: TicketCheck,
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingDoctors,
      icon: HelpCircle,
    },
  ];
  
  const getTicketIcon = (type: string) => {
    switch (type) {
      case 'access':
        return HelpCircle;
      case 'appointment':
        return MessageSquare;
      default:
        return FileText;
    }
  };
  
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <AnimatedSection className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('admin:dashboard.title')}</h1>
            <p className="text-muted-foreground">{t('admin:dashboard.welcome')}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link to="/admin/settings">
                <Settings className="mr-2 h-4 w-4" />
                {t('admin:dashboard.settings')}
              </Link>
            </Button>
            <Button asChild>
              <Link to="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                {t('admin:dashboard.manageUsers')}
              </Link>
            </Button>
          </div>
        </AnimatedSection>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsArray.map((stat, i) => (
            <AnimatedSection key={i} delay={0.1 * i}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </AnimatedSection>
          ))}
        </div>

        {/* Support Tickets + Recent Registrations */}
        <div className="grid gap-6 md:grid-cols-2">
          <AnimatedSection delay={0.2}>
            <Card>
              <CardHeader>
                <CardTitle>{t('admin:dashboard.cards.supportRequests')}</CardTitle>
                <CardDescription>{t('admin:dashboard.cards.supportRequestsDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supportTickets.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No support tickets yet.</p>
                  ) : supportTickets.map((ticket, i) => {
                    const TicketIcon = getTicketIcon(ticket.type);
                    return (
                      <div key={i} className="flex items-start p-3 border rounded-lg">
                        <div className="flex-shrink-0 mr-4">
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center 
                            ${ticket.status === 'Open' ? 'bg-red-100 text-red-600' : 
                              ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-600' : 
                              'bg-green-100 text-green-600'}`}>
                            <TicketIcon className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">{ticket.user}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full 
                              ${ticket.status === 'Open' ? 'bg-red-100 text-red-600' : 
                                ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-600' : 
                                'bg-green-100 text-green-600'}`}>
                              {ticket.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{ticket.issue}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {ticket.time instanceof Date ? ticket.time.toLocaleString() : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>

          <AnimatedSection delay={0.3}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-yellow-500" />
                  Pending Doctor Approvals
                </CardTitle>
                <CardDescription>Doctors awaiting admin review</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentUsers.filter(u => u.role === 'doctor' && u.doctorVerificationStatus === 'pending').length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No pending approvals.</p>
                  ) : recentUsers
                      .filter(u => u.role === 'doctor' && u.doctorVerificationStatus === 'pending')
                      .map((user: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center text-xs font-bold text-yellow-700 dark:text-yellow-300">
                          {(user.name || user.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/admin/doctor-approvals">Review</Link>
                      </Button>
                    </div>
                  ))}
                  {parseInt(stats.pendingDoctors) > recentUsers.filter(u => u.role === 'doctor' && u.doctorVerificationStatus === 'pending').length && (
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <Link to="/admin/doctor-approvals">
                        View all {stats.pendingDoctors} pending approvals →
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
