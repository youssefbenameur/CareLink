
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp, 
  updateDoc,
  onSnapshot 
} from 'firebase/firestore';

export interface MessageToSend {
  senderId: string;
  recipientId: string;
  content: string;
  read: boolean;
  senderName?: string;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: any;
  read: boolean;
  senderName?: string;
}

export const chatService = {
  sendMessage: async (messageData: MessageToSend) => {
    try {
      console.log("Sending message:", messageData);
      const messageToSend = {
        ...messageData,
        timestamp: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'messages'), messageToSend);
      console.log("Message sent with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },
  
  // Get messages between two users
  getMessages: async (userId1: string, userId2: string) => {
    try {
      console.log(`Getting messages between users ${userId1} and ${userId2}`);
      
      // We need to get messages where either user is sender and the other is recipient
      const q1 = query(
        collection(db, 'messages'),
        where('senderId', '==', userId1),
        where('recipientId', '==', userId2)
      );
      
      const q2 = query(
        collection(db, 'messages'),
        where('senderId', '==', userId2),
        where('recipientId', '==', userId1)
      );
      
      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);
      
      console.log(`Found ${snapshot1.size} messages sent by user ${userId1}`);
      console.log(`Found ${snapshot2.size} messages sent by user ${userId2}`);
      
      // Combine and sort messages
      const messages: Message[] = [];
      
      snapshot1.forEach(doc => {
        messages.push({
          id: doc.id,
          ...doc.data()
        } as Message);
      });
      
      snapshot2.forEach(doc => {
        messages.push({
          id: doc.id,
          ...doc.data()
        } as Message);
      });
      
      // Sort by timestamp
      const sortedMessages = messages.sort((a, b) => {
        const toMs = (t: any) => {
          if (!t) return 0;
          if (typeof t?.toDate === 'function') return t.toDate().getTime();
          if (t instanceof Date) return t.getTime();
          // Firestore-admin imported Timestamp-like object
          if (typeof t?._seconds === 'number') return t._seconds * 1000;
          return 0;
        };

        return toMs(a.timestamp) - toMs(b.timestamp);
      });
      
      console.log(`Returning ${sortedMessages.length} combined messages`);
      return sortedMessages;
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  },
  
  // Set up real-time listener for messages between two users
  subscribeToMessages: (userId1: string, userId2: string, callback: (messages: Message[]) => void) => {
    const q1 = query(
      collection(db, 'messages'),
      where('senderId', '==', userId1),
      where('recipientId', '==', userId2)
    );
    
    const q2 = query(
      collection(db, 'messages'),
      where('senderId', '==', userId2),
      where('recipientId', '==', userId1)
    );
    
    // Unfortunately Firebase doesn't support OR queries, so we need two listeners
    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      // When either collection changes, get both and combine
      chatService.getMessages(userId1, userId2).then(callback);
    });
    
    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      // When either collection changes, get both and combine
      chatService.getMessages(userId1, userId2).then(callback);
    });
    
    // Return a function to unsubscribe from both listeners
    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  },
  
  markMessagesAsRead: async (currentUserId: string, otherUserId: string) => {
    try {
      const q = query(
        collection(db, 'messages'),
        where('senderId', '==', otherUserId),
        where('recipientId', '==', currentUserId),
        where('read', '==', false)
      );
      
      const snapshot = await getDocs(q);
      console.log(`Marking ${snapshot.size} messages as read`);
      
      const updatePromises = snapshot.docs.map(doc => {
        return updateDoc(doc.ref, { read: true });
      });
      
      await Promise.all(updatePromises);
      return snapshot.size; // Number of messages marked as read
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }
};
