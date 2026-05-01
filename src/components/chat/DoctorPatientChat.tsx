import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { userService } from '@/services/userService';
import { chatService, Message, convertTimestampToDate } from '@/services/chatService';
import { convertToDate } from '@/services/appointmentService';
import { format } from 'date-fns';
import { Send, Image as ImageIcon, X, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VideoCall, IncomingCall, CalleeVideoCall } from '@/components/chat/VideoCall';
import { CallDoc } from '@/services/videoCallService';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ImageLightbox from '@/components/ui/ImageLightbox';

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
  const [selectedImage, setSelectedImage] = useState<{ base64: string; type: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Video call state
  const [callActive, setCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ callId: string; callerName: string } | null>(null);
  const [acceptedCallId, setAcceptedCallId] = useState<string | null>(null);

  // Listen for incoming calls from this patient
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "videoCalls"),
      where("calleeId", "==", currentUser.uid),
      where("status", "==", "calling")
    );
    const unsub = onSnapshot(q, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data() as CallDoc;
          if (data.callerId === actualPatientId) {
            setIncomingCall({ callId: change.doc.id, callerName: data.callerName });
          }
        }
      });
    });
    return () => unsub();
  }, [currentUser, actualPatientId]);

  // Subscribe to real-time messages using the Map-cached listener.
  // Replaces the old setInterval polling (2 full Firestore reads every 5s).
  useEffect(() => {
    if (!currentUser || !actualPatientId) return;

    setLoading(true);

    // Load patient profile once per conversation
    userService.getUserById(actualPatientId).then(setPatientData).catch(console.error);

    const unsub = chatService.subscribeToMessages(
      currentUser.uid,
      actualPatientId,
      (msgs) => {
        setMessages(msgs);
        setLoading(false);
        chatService.markMessagesAsRead(currentUser.uid, actualPatientId).catch(console.error);
      },
    );

    return () => unsub();
  }, [currentUser, actualPatientId]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !actualPatientId || (!newMessage.trim() && !selectedImage)) return;
    
    try {
      const messageData: any = {
        senderId: currentUser.uid,
        recipientId: actualPatientId,
        content: newMessage.trim(),
        read: false,
        senderName: currentUser.displayName || 'Doctor',
      };
      if (selectedImage) {
        messageData.imageBase64 = selectedImage.base64;
        messageData.imageType = selectedImage.type;
      }
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        timestamp: new Date(),
        ...messageData,
      };
      setMessages([...messages, tempMessage]);
      setNewMessage('');
      setSelectedImage(null);
      await chatService.sendMessage(messageData);
      // subscribeToMessages updates the list automatically — no manual refetch needed
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Enforce 800KB limit on the base64-encoded string (post-encoding check)
      if (base64.length > 800 * 1024) {
        toast({ title: "Image too large", description: "Image exceeds 800KB after encoding. Please select a smaller image or compress it first.", variant: "destructive" });
        return;
      }
      setSelectedImage({ base64, type: file.type });
    };
    reader.readAsDataURL(file);
  };
  
  if (!actualPatientId) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <div>
          <h3 className="text-lg font-medium">No Patient Selected</h3>
          <p className="text-muted-foreground mt-1">Select a patient to start chatting</p>
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
            <AvatarImage src={patientData.avatarBase64} />
            <AvatarFallback>
              {patientData.name?.split(' ').map((n: string) => n[0]).join('') || 'P'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-medium">{patientData.name || 'Patient'}</div>
            <div className="text-sm text-muted-foreground">{patientData.email}</div>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full text-primary border-primary/30 hover:bg-primary/10"
            onClick={() => setCallActive(true)}
            title="Start video call"
          >
            <Video className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Caller side */}
      {callActive && currentUser && (
        <VideoCall
          localUserId={currentUser.uid}
          localUserName={currentUser.displayName || 'Doctor'}
          remoteUserId={actualPatientId!}
          remoteUserName={patientData?.name || 'Patient'}
          onClose={() => setCallActive(false)}
        />
      )}

      {/* Incoming call notification */}
      {incomingCall && currentUser && (
        <IncomingCall
          callId={incomingCall.callId}
          callerName={incomingCall.callerName}
          localUserId={currentUser.uid}
          localUserName={currentUser.displayName || 'Doctor'}
          onAccepted={(id) => { setAcceptedCallId(id); setIncomingCall(null); }}
          onRejected={() => setIncomingCall(null)}
        />
      )}

      {/* Callee side after accepting */}
      {acceptedCallId && currentUser && (
        <CalleeVideoCall
          callId={acceptedCallId}
          localUserId={currentUser.uid}
          localUserName={currentUser.displayName || 'Doctor'}
          remoteUserName={patientData?.name || 'Patient'}
          onClose={() => setAcceptedCallId(null)}
        />
      )}
      
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.length > 0 ? (
            messages.map((msg) => {
              const isCurrentUser = msg.senderId === currentUser?.uid;
              const d = convertTimestampToDate(msg.timestamp);
              const timestamp = d ? format(d, 'p') : '';
              return (
                <div key={msg.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-lg p-3 ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                    {msg.imageBase64 && (
                      <img 
                        src={msg.imageBase64} 
                        alt="Shared image" 
                        className="rounded mb-2 max-w-full h-auto max-h-64 object-contain cursor-pointer"
                        onClick={() => {
                          const imgs = messages.filter(m => m.imageBase64).map(m => m.imageBase64!);
                          const idx = imgs.indexOf(msg.imageBase64!);
                          setLightboxImages(imgs);
                          setLightboxIndex(idx >= 0 ? idx : 0);
                        }}
                      />
                    )}
                    {msg.content && <div className="text-sm">{msg.content}</div>}
                    <div className={`text-xs mt-1 ${isCurrentUser ? 'text-primary-foreground/70' : 'text-secondary-foreground/70'}`}>
                      {timestamp}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="space-y-2">
          {selectedImage && (
            <div className="relative inline-block">
              <img src={selectedImage.base64} alt="Preview" className="h-20 w-20 object-cover rounded border" />
              <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => setSelectedImage(null)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1" />
            <Button type="submit" disabled={!newMessage.trim() && !selectedImage}>
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </form>
      </div>

      {/* Full-screen image lightbox */}
      {lightboxImages.length > 0 && (
        <ImageLightbox
          images={lightboxImages}
          startIndex={lightboxIndex}
          onClose={() => setLightboxImages([])}
        />
      )}
    </div>
  );
};
