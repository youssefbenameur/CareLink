
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { userService } from '@/services/userService';
import { useAuth } from '@/contexts/AuthContext';
import { PatientChat } from '@/components/chat/PatientChat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ChatPage = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const { currentUser } = useAuth();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const userDoctors = await userService.getAssignedDoctors(currentUser.uid);
        console.log('Fetched doctors:', userDoctors);
        setDoctors(userDoctors);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load your doctors. Please try again."
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDoctors();
  }, [currentUser, toast]);
  
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chat Support</h1>
          <p className="text-muted-foreground">
            Connect with your healthcare providers or chat with our AI assistant
          </p>
        </div>
        
        <Tabs defaultValue={doctorId ? "doctors" : "ai"} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="ai" className="flex items-center">
              <Bot className="mr-2 h-4 w-4" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="doctors" className="flex items-center">
              <MessageSquare className="mr-2 h-4 w-4" />
              Your Doctors
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="ai" className="mt-0 border rounded-md h-[calc(100vh-theme(spacing.32))]">
            <ChatWindow />
          </TabsContent>
          
          <TabsContent value="doctors" className="mt-0">
            <div className="grid gap-4 md:grid-cols-5">
              <div className="col-span-2 border rounded-md p-4 h-[calc(100vh-theme(spacing.32))] overflow-y-auto">
                <h3 className="font-medium mb-4">Your Care Team</h3>
                
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : doctors.length > 0 ? (
                  <div className="space-y-2">
                    {doctors.map((doctor) => {
                      const doctorUid = doctor.uid || doctor.id;
                      return (
                        <Button
                          key={doctorUid}
                          variant={doctorUid === doctorId ? "default" : "outline"}
                          className="w-full justify-start h-auto py-3"
                          onClick={() => navigate(`/chat/${doctorUid}`)}
                        >
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback>
                              {doctor.name?.split(' ').map((n: string) => n[0]).join('') || 'DR'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-left">
                            <div className="font-medium text-sm">{doctor.name}</div>
                            <div className="text-xs text-muted-foreground">{doctor.specialty || 'Healthcare Provider'}</div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No healthcare providers found</p>
                    <p className="text-sm mt-1">Visit the Appointments page to schedule a session</p>
                  </div>
                )}
              </div>
              
              <div className="col-span-3 border rounded-md h-[calc(100vh-theme(spacing.32))]">
                {doctorId ? (
                  <PatientChat />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Select a doctor to start chatting</h3>
                    <p className="text-muted-foreground mt-1">
                      Choose one of your healthcare providers from the list on the left
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ChatPage;
