import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { userService } from '@/services/userService';
import { chatService, Message } from '@/services/chatService';
import { format } from 'date-fns';
import { Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';

interface DoctorPatientChatProps {
  patientId?: string;
}

export const DoctorPatientChat = ({ patientId: propPatientId }: DoctorPatientChatProps) => {
  const { patientId: paramPatientId } = useParams<{ patientId: string }>();
  const actualPatientId = propPatientId || paramPatientId;
  
  const { currentUser } = useAuth();
  const [patientData, setPatientData] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation(['chat', 'common']);
  const { toast } = useToast();

  // Poll for new messages every 5 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentUser && actualPatientId) {
      // Initial fetch
      fetchMessages();
      
      // Set up polling
      interval = setInterval(fetchMessages, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentUser, actualPatientId]);

  const fetchMessages = async () => {
    if (!currentUser || !actualPatientId) return;
    
    try {
      setLoading(true);
      console.log(`Fetching messages between doctor ${currentUser.uid} and patient ${actualPatientId}`);
      
      // Fetch patient data
      if (!patientData) {
        const patient = await userService.getUserById(actualPatientId);
        console.log('Fetched patient data:', patient);
        setPatientData(patient);
      }
      
      // Fetch messages
      const chatMessages = await chatService.getMessages(currentUser.uid, actualPatientId);
      console.log('Fetched messages:', chatMessages);
      setMessages(chatMessages);
      
      // Mark messages as read
      await chatService.markMessagesAsRead(currentUser.uid, actualPatientId);
    } catch (error) {
      console.error('Error loading chat:', error);
      toast({
        title: t('common:error'),
        description: t('chat:messageError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !actualPatientId || !newMessage.trim()) return;
    
    try {
      // Add the message to the UI immediately for better UX
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        senderId: currentUser.uid,
        recipientId: actualPatientId,
        content: newMessage.trim(),
        timestamp: new Date(),
        read: false,
        senderName: currentUser.displayName || 'Doctor',
      };
      
      setMessages([...messages, tempMessage]);
      setNewMessage('');
      
      // Send the message to the server
      await chatService.sendMessage({
        senderId: currentUser.uid,
        recipientId: actualPatientId,
        content: newMessage.trim(),
        read: false,
        senderName: currentUser.displayName || 'Doctor',
      });
      
      // Refresh messages to get server ID
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: t('common:error'),
        description: t('chat:messageError'),
        variant: "destructive",
      });
    }
  };
  
  if (!actualPatientId) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <div>
          <h3 className="text-lg font-medium">{t('chat:noPatientSelected')}</h3>
          <p className="text-muted-foreground mt-1">
            {t('chat:selectPatientToChat')}
          </p>
        </div>
      </div>
    );
  }
  
  if (loading && !patientData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {patientData && (
        <div className="p-4 border-b flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {patientData.name?.split(' ').map((n: string) => n[0]).join('') || t('chat:patient')}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{patientData.name || t('chat:patient')}</div>
            <div className="text-sm text-muted-foreground">{patientData.email}</div>
          </div>
        </div>
      )}
      
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.length > 0 ? (
            messages.map((msg) => {
              const isCurrentUser = msg.senderId === currentUser?.uid;
              const timestamp = msg.timestamp && typeof msg.timestamp.toDate === 'function' 
                ? format(msg.timestamp.toDate(), 'p')
                : msg.timestamp instanceof Date 
                  ? format(msg.timestamp, 'p') 
                  : '';
              
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isCurrentUser 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    <div className="text-sm">{msg.content}</div>
                    <div className={`text-xs mt-1 ${
                      isCurrentUser ? 'text-primary-foreground/70' : 'text-secondary-foreground/70'
                    }`}>
                      {timestamp}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>{t('chat:noMessagesYet')}</p>
              <p className="text-sm">{t('chat:startConversation')}</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('chat:typeMessage')}
            className="flex-1"
          />
          <Button type="submit" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4 mr-2" />
            {t('chat:send')}
          </Button>
        </form>
      </div>
    </div>
  );
};
