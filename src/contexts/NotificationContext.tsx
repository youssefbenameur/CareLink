import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/services/notificationService';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  refreshNotifications: () => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markReadByActionUrl: (actionUrl: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { currentUser } = useAuth();

  // Real-time listener — updates instantly when new notifications arrive
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    // Query only by userId — avoids needing a composite index.
    // Filter read === false client-side.
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
    );

    const unsub = onSnapshot(q, (snap) => {
      const notifs: Notification[] = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Notification, 'id'>) }))
        .filter((n) => n.read === false);
      // Sort newest first
      notifs.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
      setNotifications(notifs);
    }, (error) => {
      console.error('Notification listener error:', error);
    });

    return () => unsub();
  }, [currentUser]);

  const refreshNotifications = () => {
    // No-op — real-time listener keeps state up to date automatically
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser || notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        if (n.id) batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
      setNotifications([]);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Mark all unread notifications matching a specific actionUrl as read.
  // Used to auto-clear notifications when the user navigates to the relevant page.
  const markReadByActionUrl = async (actionUrl: string) => {
    const matching = notifications.filter(n => n.actionUrl === actionUrl);
    if (matching.length === 0) return;
    try {
      const batch = writeBatch(db);
      matching.forEach((n) => {
        if (n.id) batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
      setNotifications(prev => prev.filter(n => n.actionUrl !== actionUrl));
    } catch (error) {
      console.error('Error marking notifications as read by actionUrl:', error);
    }
  };

  const unreadCount = notifications.length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        markReadByActionUrl,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
