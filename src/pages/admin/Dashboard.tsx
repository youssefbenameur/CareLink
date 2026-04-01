import { useEffect, useState } from 'react';
import { 
  Users, 
  Activity, 
  Server, 
  Settings,
  MessageSquare,
  UserPlus,
  UserCheck,
  HelpCircle,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/components/layout/AdminLayout';
import { Link } from 'react-router-dom';
import { AnimatedSection } from '@/components/ui/animated-section';
import { adminService, SupportTicket } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import SystemMetricChart from '@/components/admin/SystemMetricChart';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: '0',
    activeDoctors: '0',
    activePatients: '0',
    systemHealth: '99.9%',
  });
  
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation(['admin', 'common']);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch dashboard statistics
        const statsData = await adminService.getStats();
        setStats({
          totalUsers: statsData.totalUsers.toString(),
          activeDoctors: statsData.activeDoctors.toString(),
          activePatients: statsData.activePatients.toString(),
          systemHealth: statsData.systemHealth,
        });
        
        // Fetch support tickets
        const tickets = await adminService.getSupportTickets();
        setSupportTickets(tickets);
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
      title: t('admin:dashboard.stats.totalUsers'),
      value: stats.totalUsers,
      change: '+12%',
      increasing: true,
      icon: Users,
    },
    {
      title: t('admin:dashboard.stats.activeDoctors'),
      value: stats.activeDoctors,
      change: '+3',
      increasing: true,
      icon: UserCheck,
    },
    {
      title: t('admin:dashboard.stats.activePatients'),
      value: stats.activePatients,
      change: '+245',
      increasing: true,
      icon: UserPlus,
    },
    {
      title: t('admin:dashboard.stats.systemHealth'),
      value: stats.systemHealth,
      change: t('admin:dashboard.stats.stable'),
      increasing: true,
      icon: Server,
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
            <p className="text-muted-foreground">
              {t('admin:dashboard.welcome')}
            </p>
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
        
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">{t('admin:dashboard.overview')}</TabsTrigger>
            <TabsTrigger value="analytics">{t('admin:dashboard.analytics')}</TabsTrigger>
            <TabsTrigger value="system">{t('admin:dashboard.system')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6 mt-6">
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
                      <p className={`text-xs ${stat.increasing ? 'text-green-500' : 'text-red-500'}`}>
                        {stat.change} {t('admin:dashboard.stats.change')}
                      </p>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              ))}
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <AnimatedSection delay={0.2} direction="left">
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>{t('admin:dashboard.cards.userActivity')}</CardTitle>
                    <CardDescription>{t('admin:dashboard.cards.userActivityDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <SystemMetricChart 
                        title="User Activity" 
                        category="users" 
                        color="#4f46e5" 
                        valueLabel="Active Users"
                        height={280} 
                      />
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>
              
              <AnimatedSection delay={0.3} direction="right">
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>{t('admin:dashboard.cards.supportRequests')}</CardTitle>
                    <CardDescription>{t('admin:dashboard.cards.supportRequestsDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {supportTickets.map((ticket, i) => {
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
                                {ticket.time instanceof Date ? 
                                  ticket.time.toLocaleString() : 
                                  typeof ticket.time === 'object' && 'toDate' in ticket.time ? 
                                  ticket.time.toDate().toLocaleString() : 
                                  new Date(ticket.time).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>
            </div>
            
            <AnimatedSection delay={0.4}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{t('admin:dashboard.cards.aiPerformance')}</CardTitle>
                      <CardDescription>{t('admin:dashboard.cards.aiPerformanceDesc')}</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Activity className="mr-2 h-4 w-4" />
                      {t('admin:dashboard.cards.tuneAi')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <SystemMetricChart 
                      title="AI Response Time" 
                      category="ai" 
                      color="#059669" 
                      valueLabel="Response Time (ms)"
                      height={280} 
                    />
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-6">
            <AnimatedSection>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{t('admin:dashboard.cards.detailedAnalytics')}</CardTitle>
                      <CardDescription>{t('admin:dashboard.cards.detailedAnalyticsDesc')}</CardDescription>
                    </div>
                    <Button variant="outline">
                      <Activity className="mr-2 h-4 w-4" />
                      {t('admin:dashboard.cards.fullAnalytics')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    <SystemMetricChart 
                      title="User Sessions" 
                      category="sessions" 
                      color="#0ea5e9" 
                      valueLabel="Sessions"
                      height={220}
                    />
                    <SystemMetricChart 
                      title="Appointment Bookings" 
                      category="appointments" 
                      color="#8b5cf6"
                      valueLabel="Bookings"
                      height={220}
                    />
                    <SystemMetricChart 
                      title="Chat Messages" 
                      category="messages" 
                      color="#f59e0b"
                      valueLabel="Messages"
                      height={220}
                    />
                    <SystemMetricChart 
                      title="Resource Views" 
                      category="views" 
                      color="#10b981"
                      valueLabel="Views"
                      height={220}
                    />
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>
          </TabsContent>
          
          <TabsContent value="system" className="mt-6">
            <AnimatedSection>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{t('admin:dashboard.cards.systemHealth')}</CardTitle>
                      <CardDescription>{t('admin:dashboard.cards.systemHealthDesc')}</CardDescription>
                    </div>
                    <Button variant="outline">
                      <Settings className="mr-2 h-4 w-4" />
                      {t('admin:dashboard.cards.advancedSettings')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                      <SystemMetricChart 
                        title={t('navigation:admin.cpuUsage')} 
                        category="cpu" 
                        color="#8884d8"
                        valueLabel="CPU %"
                        height={220}
                      />
                      <SystemMetricChart 
                        title={t('navigation:admin.memory')} 
                        category="memory" 
                        color="#82ca9d"
                        valueLabel="Memory (GB)"
                        height={220}
                      />
                      <SystemMetricChart 
                        title={t('navigation:admin.storage')} 
                        category="storage" 
                        color="#ffa726"
                        valueLabel="Storage %"
                        height={220}
                      />
                    </div>
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                      <SystemMetricChart 
                        title="API Requests" 
                        category="api" 
                        color="#ef4444"
                        valueLabel="Requests/min"
                        height={220}
                      />
                      <SystemMetricChart 
                        title="Server Uptime" 
                        category="uptime" 
                        color="#3b82f6"
                        valueLabel="Uptime (days)"
                        height={220}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
