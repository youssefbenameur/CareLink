import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  updateDoc,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  doc,
  getDoc,
} from "firebase/firestore";
import { notificationService } from "./notificationService";
import { userService } from "./userService";

export interface MessageToSend {
  senderId: string;
  recipientId: string;
  content: string;
  read: boolean;
  senderName?: string;
  imageBase64?: string;
  imageType?: string;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: any;
  read: boolean;
  senderName?: string;
  imageBase64?: string;
  imageType?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Unified timestamp converter — handles all Firestore/JS date formats to
 * prevent "Invalid Date" errors from inconsistent timestamp types.
 *   - Firestore Timestamp (has .toDate())
 *   - Plain JS Date
 *   - Firestore serialised object ({ _seconds, _nanoseconds })
 *   - null / undefined → returns null so callers can skip rendering
 */
export const convertTimestampToDate = (t: any): Date | null => {
  if (!t) return null;
  if (typeof t?.toDate === "function") return t.toDate();
  if (t instanceof Date) return t;
  if (typeof t?._seconds === "number") return new Date(t._seconds * 1000);
  return null;
};

const toMs = (t: any): number => {
  const d = convertTimestampToDate(t);
  return d ? d.getTime() : 0;
};

const snapshotToMessages = (snap: QuerySnapshot<DocumentData>): Message[] =>
  snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message));

// ─── Chat Service ─────────────────────────────────────────────────────────────

export const chatService = {
  sendMessage: async (messageData: MessageToSend) => {
    try {
      // Build clean object — Firestore rejects undefined fields
      const cleanData: any = {
        senderId: messageData.senderId,
        recipientId: messageData.recipientId,
        content: messageData.content,
        read: messageData.read,
        timestamp: serverTimestamp(),
      };

      if (messageData.senderName) {
        cleanData.senderName = messageData.senderName;
      }
      if (messageData.imageBase64) {
        cleanData.imageBase64 = messageData.imageBase64;
        cleanData.imageType = messageData.imageType;
      }

      const docRef = await addDoc(collection(db, "messages"), cleanData);

      // Notify the doctor if the recipient is a doctor
      try {
        const recipientDoc = await getDoc(doc(db, 'users', messageData.recipientId));
        if (recipientDoc.exists()) {
          const recipientData = recipientDoc.data();
          if (recipientData.role === 'doctor') {
            await notificationService.createNotification({
              userId: messageData.recipientId,
              title: 'New Message 💬',
              message: `${messageData.senderName || 'A patient'} sent you a message: "${messageData.content.substring(0, 50)}${messageData.content.length > 50 ? '...' : ''}"`,
              type: 'info',
              actionUrl: `/doctor/chat/${messageData.senderId}`,
            });
          }
        }
      } catch (notifError) {
        console.error('Error creating message notification:', notifError);
        // Don't throw - message was sent successfully even if notification failed
      }

      return docRef.id;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  // Get messages between two users (one-time fetch)
  getMessages: async (userId1: string, userId2: string): Promise<Message[]> => {
    try {
      const [snap1, snap2] = await Promise.all([
        getDocs(
          query(
            collection(db, "messages"),
            where("senderId", "==", userId1),
            where("recipientId", "==", userId2),
          ),
        ),
        getDocs(
          query(
            collection(db, "messages"),
            where("senderId", "==", userId2),
            where("recipientId", "==", userId1),
          ),
        ),
      ]);

      const messages: Message[] = [
        ...snapshotToMessages(snap1),
        ...snapshotToMessages(snap2),
      ];

      return messages.sort((a, b) => toMs(a.timestamp) - toMs(b.timestamp));
    } catch (error) {
      console.error("Error getting messages:", error);
      throw error;
    }
  },

  /**
   * Real-time listener for messages between two users.
   * Uses two in-memory Maps (one per direction) and merges locally on every
   * change — avoids the old pattern of calling getMessages() (2 full reads)
   * on every snapshot event.
   */
  subscribeToMessages: (
    userId1: string,
    userId2: string,
    callback: (messages: Message[]) => void,
  ) => {
    const cache1 = new Map<string, Message>();
    const cache2 = new Map<string, Message>();

    const merge = () => {
      const combined = [...cache1.values(), ...cache2.values()];
      combined.sort((a, b) => toMs(a.timestamp) - toMs(b.timestamp));
      callback(combined);
    };

    const q1 = query(
      collection(db, "messages"),
      where("senderId", "==", userId1),
      where("recipientId", "==", userId2),
    );

    const q2 = query(
      collection(db, "messages"),
      where("senderId", "==", userId2),
      where("recipientId", "==", userId1),
    );

    const unsubscribe1 = onSnapshot(q1, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === "removed") {
          cache1.delete(change.doc.id);
        } else {
          cache1.set(change.doc.id, {
            id: change.doc.id,
            ...change.doc.data(),
          } as Message);
        }
      });
      merge();
    });

    const unsubscribe2 = onSnapshot(q2, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === "removed") {
          cache2.delete(change.doc.id);
        } else {
          cache2.set(change.doc.id, {
            id: change.doc.id,
            ...change.doc.data(),
          } as Message);
        }
      });
      merge();
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  },

  // Single-field query + client-side filter to avoid composite Firestore index requirement.
  markMessagesAsRead: async (
    currentUserId: string,
    otherUserId: string,
  ): Promise<number> => {
    try {
      const snap = await getDocs(
        query(
          collection(db, "messages"),
          where("senderId", "==", otherUserId),
          where("recipientId", "==", currentUserId),
        ),
      );

      const unread = snap.docs.filter((d) => d.data().read === false);
      await Promise.all(unread.map((d) => updateDoc(d.ref, { read: true })));
      return unread.length;
    } catch (error) {
      console.error("Error marking messages as read:", error);
      throw error;
    }
  },

  // Get count of unread messages from a specific sender.
  // Uses a single-field query (senderId + recipientId) and filters read===false
  // client-side to avoid requiring a composite Firestore index.
  getUnreadCount: async (
    currentUserId: string,
    otherUserId: string,
  ): Promise<number> => {
    try {
      const snap = await getDocs(
        query(
          collection(db, "messages"),
          where("senderId", "==", otherUserId),
          where("recipientId", "==", currentUserId),
        ),
      );
      return snap.docs.filter((d) => d.data().read === false).length;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  },
};
