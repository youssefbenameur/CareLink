import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  User, 
  ChevronRight, 
  Calendar,
  MessageSquare,
  Loader
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import DoctorLayout from '@/components/layout/DoctorLayout';
import { AnimatedSection } from '@/components/ui/animated-section';
import { useAuth } from '@/contexts/AuthContext';
import { userService, UserData } from '@/services/userService';
import { appointmentService, convertToDate } from '@/services/appointmentService';
import { useToast } from '@/hooks/use-toast';

interface Patient {
  id: string;
  name: string;
  email: string;
  status: string;
  lastVisit: string;
  nextAppointment: string;
  mood?: string;
}

const PatientList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchPatients = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        const appointments = await appointmentService.getDoctorAppointments(currentUser.uid);
        const uniquePatientIds = [...new Set(appointments.map(app => app.patientId))];
        
        const patientsData = await Promise.all(
          uniquePatientIds.map(async (patientId) => {
            const userData = await userService.getUserById(patientId);
            
            if (!userData) {
              return null;
            }
            
            const patientAppointments = appointments.filter(app => app.patientId === patientId);
            
            const pastAppointments = patientAppointments
              .filter(app => {
                const appDate = convertToDate(app.date);
                return appDate <= new Date() && app.status === 'completed';
              })
              .sort((a, b) => {
                const dateA = convertToDate(a.date).getTime();
                const dateB = convertToDate(b.date).getTime();
                return dateB - dateA;
              });
            
            const futureAppointments = patientAppointments
              .filter(app => {
                const appDate = convertToDate(app.date);
                return appDate > new Date() && app.status !== 'cancelled';
              })
              .sort((a, b) => {
                const dateA = convertToDate(a.date).getTime();
                const dateB = convertToDate(b.date).getTime();
                return dateA - dateB;
              });
            
            let lastVisit = 'Never';
            if (pastAppointments.length > 0) {
              const lastAppDate = convertToDate(pastAppointments[0].date);
              const diffDays = Math.floor((new Date().getTime() - lastAppDate.getTime()) / (1000 * 3600 * 24));
              
              if (diffDays === 0) {
                lastVisit = 'Today';
              } else if (diffDays === 1) {
                lastVisit = 'Yesterday';
              } else if (diffDays < 7) {
                lastVisit = `${diffDays} days ago`;
              } else if (diffDays < 30) {
                lastVisit = `${Math.floor(diffDays / 7)} weeks ago`;
              } else {
                lastVisit = `${Math.floor(diffDays / 30)} months ago`;
              }
            }
            
            let nextAppointment = 'Not scheduled';
            if (futureAppointments.length > 0) {
              const nextApp = futureAppointments[0];
              const nextDate = convertToDate(nextApp.date);
              
              const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              const dayName = days[nextDate.getDay()];
              
              const timeStr = nextDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              if (new Date().toDateString() === nextDate.toDateString()) {
                nextAppointment = `Today, ${timeStr}`;
              } else if (new Date(new Date().setDate(new Date().getDate() + 1)).toDateString() === nextDate.toDateString()) {
                nextAppointment = `Tomorrow, ${timeStr}`;
              } else {
                nextAppointment = `${dayName}, ${timeStr}`;
              }
            }
            
            let status = 'Active';
            
            if (pastAppointments.length === 0 && futureAppointments.length === 0) {
              status = 'Inactive';
            } else {
              const recentNotes = [...pastAppointments, ...futureAppointments]
                .sort((a, b) => {
                  const dateA = convertToDate(a.date).getTime();
                  const dateB = convertToDate(b.date).getTime();
                  return dateB - dateA;
                })
                .slice(0, 3)
                .map(app => app.notes || '');
              
              if (recentNotes.some(note => note.toLowerCase().includes('concern') || note.toLowerCase().includes('urgent'))) {
                status = 'Needs attention';
              } else if (recentNotes.some(note => note.toLowerCase().includes('improve') || note.toLowerCase().includes('better'))) {
                status = 'Improving';
              }
            }
            
            return {
              id: patientId,
              name: userData.name,
              email: userData.email,
              status,
              lastVisit,
              nextAppointment,
            };
          })
        );
        
        setPatients(patientsData.filter(patient => patient !== null) as Patient[]);
      } catch (error) {
        console.error('Error fetching patients:', error);
        toast({
          title: "Error",
          description: "Failed to load patients data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatients();
  }, [currentUser, toast]);
  
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          patient.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || patient.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });
  
  return (
    <DoctorLayout>
      <div className="space-y-6">
        <AnimatedSection className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Patient List</h1>
            <p className="text-muted-foreground">Manage and view all your patients</p>
          </div>
        </AnimatedSection>
        
        <AnimatedSection delay={0.1} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="needs attention">Needs Attention</SelectItem>
                <SelectItem value="improving">Improving</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </AnimatedSection>
        
        <AnimatedSection delay={0.2}>
          <Card>
            <CardHeader>
              <CardTitle>Patients ({filteredPatients.length})</CardTitle>
              <CardDescription>View and manage your patient list</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((patient, index) => (
                      <AnimatedSection key={patient.id} delay={0.05 * index} className="flex items-center p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                        <Avatar className="h-10 w-10 mr-4">
                          <AvatarFallback>
                            {patient.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
                            <h4 className="text-sm font-medium truncate">{patient.name}</h4>
                            <Badge 
                              variant={
                                patient.status === 'Needs attention' ? 'destructive' : 
                                patient.status === 'Improving' ? 'default' : 
                                patient.status === 'Active' ? 'secondary' : 'outline'
                              }
                              className="sm:ml-2 mt-1 sm:mt-0 self-start sm:self-center"
                            >
                              {patient.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{patient.email}</p>
                          <div className="flex flex-col sm:flex-row text-xs text-muted-foreground mt-1 gap-y-1 sm:gap-x-4">
                            <span className="flex items-center">
                              <Calendar className="mr-1 h-3 w-3" />
                              Last visit: {patient.lastVisit}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="mr-1 h-3 w-3" />
                              Next: {patient.nextAppointment}
                            </span>
                          </div>
                        </div>
                        
                        <div className="ml-4 flex items-center space-x-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/doctor/chat/${patient.id}`}>
                              <MessageSquare className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/doctor/patients/${patient.id}`}>
                              <User className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">View</span>
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      </AnimatedSection>
                    ))
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">
                      {searchQuery || statusFilter !== 'all' ? 
                        'No patients match your filters. Try adjusting your search criteria.' : 
                        'You have no patients yet. Patients will appear here after they book appointments with you.'}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedSection>
      </div>
    </DoctorLayout>
  );
};

export default PatientList;
