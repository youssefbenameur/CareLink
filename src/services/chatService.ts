
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  serverTimestamp, 
  doc, 
  updateDoc,
  Timestamp,
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
        where('recipientId', '==', userId2),
        orderBy('timestamp', 'asc')
      );
      
      const q2 = query(
        collection(db, 'messages'),
        where('senderId', '==', userId2),
        where('recipientId', '==', userId1),
        orderBy('timestamp', 'asc')
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
        // Handle cases where timestamp might be null (new unsaved messages)
        if (!a.timestamp) return -1;
        if (!b.timestamp) return 1;
        
        const timestampA = a.timestamp ? (typeof a.timestamp.toDate === 'function' ? a.timestamp.toDate().getTime() : a.timestamp instanceof Date ? a.timestamp.getTime() : 0) : 0;
        const timestampB = b.timestamp ? (typeof b.timestamp.toDate === 'function' ? b.timestamp.toDate().getTime() : b.timestamp instanceof Date ? b.timestamp.getTime() : 0) : 0;
        return timestampA - timestampB;
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
      where('recipientId', '==', userId2),
      orderBy('timestamp', 'asc')
    );
    
    const q2 = query(
      collection(db, 'messages'),
      where('senderId', '==', userId2),
      where('recipientId', '==', userId1),
      orderBy('timestamp', 'asc')
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
