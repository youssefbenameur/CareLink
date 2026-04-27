import {
  doc,
  collection,
  addDoc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// STUN servers for NAT traversal (free Google STUN)
export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export interface CallDoc {
  callerId: string;
  callerName: string;
  calleeId: string;
  status: "calling" | "accepted" | "rejected" | "ended";
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  createdAt?: any;
}

// Create a new call document and return its ID
export async function createCall(
  callerId: string,
  callerName: string,
  calleeId: string,
  offer: RTCSessionDescriptionInit
): Promise<string> {
  const ref = await addDoc(collection(db, "videoCalls"), {
    callerId,
    callerName,
    calleeId,
    status: "calling",
    offer,
    createdAt: serverTimestamp(),
  } as CallDoc);
  return ref.id;
}

// Callee accepts: writes answer
export async function answerCall(
  callId: string,
  answer: RTCSessionDescriptionInit
): Promise<void> {
  await updateDoc(doc(db, "videoCalls", callId), {
    answer,
    status: "accepted",
  });
}

// Add an ICE candidate to a subcollection
export async function addIceCandidate(
  callId: string,
  side: "callerCandidates" | "calleeCandidates",
  candidate: RTCIceCandidateInit
): Promise<void> {
  await addDoc(
    collection(db, "videoCalls", callId, side),
    candidate
  );
}

// End / reject a call
export async function endCall(callId: string, status: "ended" | "rejected" = "ended"): Promise<void> {
  try {
    await updateDoc(doc(db, "videoCalls", callId), { status });
  } catch {
    // doc may already be gone
  }
}

// Listen for incoming calls for a user
export function listenForIncomingCall(
  userId: string,
  onCall: (callId: string, call: CallDoc) => void
): () => void {
  // We poll the videoCalls collection for docs where calleeId == userId and status == "calling"
  const { query, where, onSnapshot: snap } = require("firebase/firestore");
  const q = query(
    collection(db, "videoCalls"),
    where("calleeId", "==", userId),
    where("status", "==", "calling")
  );
  return snap(q, (snapshot: any) => {
    snapshot.docChanges().forEach((change: any) => {
      if (change.type === "added") {
        onCall(change.doc.id, change.doc.data() as CallDoc);
      }
    });
  });
}
