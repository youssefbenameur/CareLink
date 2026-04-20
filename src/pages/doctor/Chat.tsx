
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DoctorLayout from '@/components/layout/DoctorLayout';
import { userService, UserData } from '@/services/userService';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, RefreshCcw, TicketCheck } from 'lucide-react';
import { DoctorPatientChat } from '@/components/chat/DoctorPatientChat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { SupportTicketForm } from '@/components/support/SupportTicketForm';

const DoctorChatPage = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const fetchPatients = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      // First, try to get patients from appointments
      const doctorPatients = await userService.getDoctorPatients(currentUser.uid);
      console.log('Fetched doctor patients:', doctorPatients);
      
      if (doctorPatients.length === 0) {
        // If no patients are found through getDoctorPatients, try an alternative approach
        const allPatientsData = await userService.getAllPatients();
        console.log('No doctor patients found, fetching all patients:', allPatientsData);
        setPatients(allPatientsData);
      } else {
        setPatients(doctorPatients);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Error",
        description: "Failed to load patients. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPatients();
    console.log("Patient ID from URL:", patientId);
  }, [currentUser]);
  
  return (
    <DoctorLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('chat.title', 'Chat')}</h1>
            <p className="text-muted-foreground">
              {t('chat.withPatient', 'Chat with your patients')}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchPatients} disabled={loading}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="patients" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="patients" className="flex items-center">
              <MessageSquare className="mr-2 h-4 w-4" />
              Patients
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center">
              <TicketCheck className="mr-2 h-4 w-4" />
              Support
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patients" className="mt-0">
        <div className="grid gap-4 md:grid-cols-5">
          <div className="col-span-2 border rounded-md p-4 h-[calc(100vh-theme(spacing.32))] overflow-y-auto">
            <h3 className="font-medium mb-4">{t('chat.yourPatients', 'Your Patients')}</h3>
            
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : patients.length > 0 ? (
              <div className="space-y-2">
                {patients.map((patient) => (
                  <Button
                    key={patient.id}
                    variant={patient.id === patientId ? "default" : "outline"}
                    className="w-full justify-start h-auto py-3"
                    onClick={() => navigate(`/doctor/chat/${patient.id}`)}
                  >
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback>
                        {patient.name?.split(' ').map((n: string) => n[0]).join('') || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <div className="font-medium text-sm">{patient.name}</div>
                      <div className="text-xs text-muted-foreground">{patient.email}</div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t('chat.noPatients', 'No patients found')}</p>
                <p className="text-sm mt-1">{t('chat.checkPatientList', 'Check the patient list in the dashboard')}</p>
              </div>
            )}
          </div>
          
          <div className="col-span-3 border rounded-md h-[calc(100vh-theme(spacing.32))]">
            {patientId ? (
              <DoctorPatientChat key={patientId} patientId={patientId} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">{t('chat.selectPatient', 'Select a Patient')}</h3>
                <p className="text-muted-foreground mt-1">
                  {t('chat.selectPatientFromList', 'Select a patient from the list to start chatting')}
                </p>
              </div>
            )}
          </div>
        </div>
          </TabsContent>

          <TabsContent value="support" className="mt-0">
            <SupportTicketForm />
          </TabsContent>
        </Tabs>
      </div>
    </DoctorLayout>
  );
};

export default DoctorChatPage;
