import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { userService } from '@/services/userService';
import { chatService } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import { PatientChat } from '@/components/chat/PatientChat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Bot, TicketCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SupportTicketForm } from '@/components/support/SupportTicketForm';
import { useNotifications } from '@/contexts/NotificationContext';

const ChatPage = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const { currentUser } = useAuth();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { markReadByActionUrl } = useNotifications();
  // Keep a stable ref to the doctor list for the polling interval
  const doctorsRef = useRef<any[]>([]);

  // Auto-clear chat notifications when this page is opened
  useEffect(() => {
    markReadByActionUrl('/chat');
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      if (!currentUser) return;
      try {
        setLoading(true);
        // getAssignedDoctors returns { id: doc.id, ...data } — doctor.id is
        // always the authoritative Firestore document ID (= Firebase Auth UID).
        const userDoctors = await userService.getAssignedDoctors(currentUser.uid);
        setDoctors(userDoctors);
        doctorsRef.current = userDoctors;
      } catch (error) {
        console.error('Error fetching doctors:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load your doctors. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [currentUser, toast]);

  // Refresh unread counts for every doctor every 5 seconds
  useEffect(() => {
    if (!currentUser) return;

    const refreshUnread = async () => {
      const entries = await Promise.all(
        doctorsRef.current.map(async (doctor) => {
          const count = await chatService.getUnreadCount(currentUser.uid, doctor.id);
          return [doctor.id, count] as [string, number];
        }),
      );
      setUnreadCounts(Object.fromEntries(entries));
    };

    // Run immediately, then every 5 seconds
    refreshUnread();
    const interval = setInterval(refreshUnread, 5000);
    return () => clearInterval(interval);
  }, [currentUser, doctors]);

  return (
    <DashboardLayout>
      <div className="space-y-2">
        <Tabs defaultValue="doctors" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="ai" className="flex items-center">
              <Bot className="mr-2 h-4 w-4" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="doctors" className="flex items-center">
              <MessageSquare className="mr-2 h-4 w-4" />
              Your Doctors
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center">
              <TicketCheck className="mr-2 h-4 w-4" />
              Support
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="ai"
            className="mt-0 rounded-xl border overflow-hidden"
            style={{ height: 'calc(100vh - 120px)' }}
          >
            <ChatWindow />
          </TabsContent>

          <TabsContent value="doctors" className="mt-0">
            <div className="grid gap-4 md:grid-cols-5">
              {/* Doctor contact list */}
              <div
                className="col-span-2 border rounded-md p-4 overflow-y-auto"
                style={{ height: 'calc(100vh - 180px)' }}
              >
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
                      // Always use doctor.id — the authoritative Firestore doc ID.
                      // Never fall back to doctor.uid to avoid the identity mismatch bug
                      // where clicking one doctor shows another's name in the header.
                      const id = doctor.id;
                      const unread = unreadCounts[id] ?? 0;
                      return (
                        <Button
                          key={id}
                          variant={id === doctorId ? "default" : "outline"}
                          className="w-full justify-start h-auto py-3"
                          onClick={() => navigate(`/chat/${id}`)}
                        >
                          <div className="relative mr-2 shrink-0">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={doctor.avatarBase64} alt={doctor.name} />
                              <AvatarFallback>
                                {doctor.name
                                  ?.split(' ')
                                  .map((n: string) => n[0])
                                  .join('') || 'DR'}
                              </AvatarFallback>
                            </Avatar>
                            {/* Per-doctor unread badge */}
                            {unread > 0 && (
                              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none">
                                {unread > 99 ? '99+' : unread}
                              </span>
                            )}
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-sm">{doctor.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {doctor.specialty || doctor.specialization || 'Healthcare Provider'}
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <MessageSquare className="h-10 w-10 text-primary/60" />
                    </div>
                    <h3 className="text-lg font-semibold">No Healthcare Providers</h3>
                    <p className="text-muted-foreground text-sm mt-1 max-w-xs">
                      You haven't connected with any doctors yet. Book an appointment to start your care journey.
                    </p>
                    <Button className="mt-5" onClick={() => navigate('/find-doctor')}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Find a Doctor
                    </Button>
                  </div>
                )}
              </div>

              {/* Chat window */}
              <div
                className="col-span-3 border rounded-md overflow-hidden"
                style={{ height: 'calc(100vh - 180px)' }}
              >
                {doctorId ? (
                  <PatientChat key={doctorId} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">
                      Select a doctor to start chatting
                    </h3>
                    <p className="text-muted-foreground mt-1">
                      Choose one of your healthcare providers from the list on the left
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
    </DashboardLayout>
  );
};

export default ChatPage;
