import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
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

      // Unread messages from patients — single-field query, filter client-side.
      unsubs.push(
        onSnapshot(
          query(
            collection(db, "messages"),
            where("recipientId", "==", uid),
          ),
          (snap) => {
            const count = snap.docs.filter((d) => d.data().read === false).length;
            setBadges((b) => ({ ...b, unreadPatientMessages: count }));
          },
        ),
      );
    }

    if (role === "patient") {
      // Single-field query for unread messages — no composite index needed.
      unsubs.push(
        onSnapshot(
          query(
            collection(db, "messages"),
            where("recipientId", "==", uid),
          ),
          (snap) => {
            const count = snap.docs.filter((d) => d.data().read === false).length;
            setBadges((b) => ({ ...b, unreadMessages: count }));
          },
        ),
      );
    }

    return () => unsubs.forEach((u) => u());
  }, [isAdmin, currentUser, userData]);

  return badges;
}
