import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

export interface NavBadges {
  // Admin
  pendingDoctorApprovals: number;
  openSupportTickets: number;
  // Doctor
  pendingAppointmentRequests: number;
  unreadPatientMessages: number;
  // Patient
  upcomingAppointments: number;
  unreadMessages: number;
}

const EMPTY: NavBadges = {
  pendingDoctorApprovals: 0,
  openSupportTickets: 0,
  pendingAppointmentRequests: 0,
  unreadPatientMessages: 0,
  upcomingAppointments: 0,
  unreadMessages: 0,
};

export function useNavBadges(): NavBadges {
  const { currentUser, userData } = useAuth();
  const [badges, setBadges] = useState<NavBadges>(EMPTY);
  // Read isAdmin once at mount time (stable — admin session doesn't change mid-render)
  const [isAdmin] = useState<boolean>(
    () => localStorage.getItem("adminAccess") === "true"
  );

  useEffect(() => {
    // Admin uses localStorage auth, not Firebase Auth
    if (isAdmin) {
      const unsubs: (() => void)[] = [];

      unsubs.push(
        onSnapshot(
          query(
            collection(db, "users"),
            where("role", "==", "doctor"),
            where("doctorVerificationStatus", "==", "pending"),
          ),
          (snap) => setBadges((b) => ({ ...b, pendingDoctorApprovals: snap.size })),
        ),
      );

      unsubs.push(
        onSnapshot(
          query(
            collection(db, "supportTickets"),
            where("status", "==", "Open"),
          ),
          (snap) => setBadges((b) => ({ ...b, openSupportTickets: snap.size })),
        ),
      );

      return () => unsubs.forEach((u) => u());
    }

    // Doctor / Patient use Firebase Auth
    if (!currentUser || !userData?.role) return;

    const role: string = userData.role;
    const uid = currentUser.uid;
    const unsubs: (() => void)[] = [];

    if (role === "doctor") {
      unsubs.push(
        onSnapshot(
          query(
            collection(db, "appointments"),
            where("doctorId", "==", uid),
            where("status", "==", "pending"),
          ),
          (snap) => setBadges((b) => ({ ...b, pendingAppointmentRequests: snap.size })),
        ),
      );

      // Unread messages from patients
      unsubs.push(
        onSnapshot(
          query(
            collection(db, "messages"),
            where("recipientId", "==", uid),
            where("read", "==", false),
          ),
          (snap) => setBadges((b) => ({ ...b, unreadPatientMessages: snap.size })),
        ),
      );
    }

    if (role === "patient") {
      // Only count future scheduled appointments (date >= now)
      const now = Timestamp.now();
      unsubs.push(
        onSnapshot(
          query(
            collection(db, "appointments"),
            where("patientId", "==", uid),
            where("status", "==", "scheduled"),
            where("date", ">=", now),
          ),
          (snap) => setBadges((b) => ({ ...b, upcomingAppointments: snap.size })),
        ),
      );

      unsubs.push(
        onSnapshot(
          query(
            collection(db, "messages"),
            where("recipientId", "==", uid),
            where("read", "==", false),
          ),
          (snap) => setBadges((b) => ({ ...b, unreadMessages: snap.size })),
        ),
      );
    }

    return () => unsubs.forEach((u) => u());
  }, [isAdmin, currentUser, userData]);

  return badges;
}
