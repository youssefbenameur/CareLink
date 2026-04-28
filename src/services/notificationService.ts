import { collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Notification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Timestamp;
  actionUrl?: string;
}

export const notificationService = {
  // Create a notification — deduplicates by userId + title + actionUrl within the same day.
  // If an unread notification with the same key already exists today, update it instead of
  // creating a duplicate (prevents spam when the same action is triggered multiple times).
  async createNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) {
    try {
      // Dedup: check for existing unread notification with same userId + title + actionUrl today.
      // Use only single-field queries to avoid requiring a composite Firestore index.
      const dupQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', notification.userId),
        where('read', '==', false),
      );

      const dupSnap = await getDocs(dupQuery);

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const startOfDayMs = startOfDay.getTime();

      // Filter client-side for title + actionUrl + same day
      const existing = dupSnap.docs.find((d) => {
        const data = d.data();
        const createdMs = data.createdAt instanceof Timestamp
          ? data.createdAt.toMillis()
          : 0;
        return (
          data.title === notification.title &&
          (data.actionUrl ?? '') === (notification.actionUrl ?? '') &&
          createdMs >= startOfDayMs
        );
      });

      if (existing) {
        await updateDoc(doc(db, 'notifications', existing.id), {
          message: notification.message,
          createdAt: Timestamp.now(),
        });
        return existing.id;
      }

      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notification,
        read: false,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  // Get notifications for a user
  async getUserNotifications(userId: string) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      const querySnapshot = await getDocs(q);
      const notifications: Notification[] = [];
      querySnapshot.forEach((doc) => {
        notifications.push({ id: doc.id, ...doc.data() } as Notification);
      });
      return notifications;
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  },

  // Mark notification as read
  async markAsRead(notificationId: string) {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string) {
    try {
      const notifications = await this.getUserNotifications(userId);
      const promises = notifications.map(notification =>
        updateDoc(doc(db, 'notifications', notification.id!), { read: true })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
};