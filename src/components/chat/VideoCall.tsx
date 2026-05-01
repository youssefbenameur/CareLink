import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  RTC_CONFIG,
  createCall,
  answerCall,
  addIceCandidate,
  endCall,
  CallDoc,
} from "@/services/videoCallService";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VideoCallProps {
  /** The current user's ID */
  localUserId: string;
  localUserName: string;
  /** The remote peer's ID */
  remoteUserId: string;
  remoteUserName: string;
  /** Called when the call ends for any reason */
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const VideoCall = ({
  localUserId,
  localUserName,
  remoteUserId,
  remoteUserName,
  onClose,
}: VideoCallProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callIdRef = useRef<string | null>(null);

  const [status, setStatus] = useState<"connecting" | "calling" | "connected" | "ended">("connecting");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const cleanup = useCallback(async (callStatus: "ended" | "rejected" = "ended") => {
    if (callIdRef.current) {
      await endCall(callIdRef.current, callStatus);
    }
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setStatus("ended");
    onClose();
  }, [onClose]);

  // ── Start call (caller side) ───────────────────────────────────────────────
  useEffect(() => {
    let unsubCall: (() => void) | null = null;
    let unsubCandidates: (() => void) | null = null;

    const start = async () => {
      try {
        // 1. Get local media
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // 2. Create peer connection
        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcRef.current = pc;
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        // 3. Remote stream → remote video element
        pc.ontrack = (e) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
          setStatus("connected");
        };

        // 4. Create offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // 5. Write call doc to Firestore
        const callId = await createCall(localUserId, localUserName, remoteUserId, offer);
        callIdRef.current = callId;
        setStatus("calling");

        // 6. Send our ICE candidates to Firestore
        pc.onicecandidate = async (e) => {
          if (e.candidate) {
            await addIceCandidate(callId, "callerCandidates", e.candidate.toJSON());
          }
        };

        // 7. Listen for answer + status changes
        unsubCall = onSnapshot(doc(db, "videoCalls", callId), async (snap) => {
          const data = snap.data() as CallDoc | undefined;
          if (!data) return;

          if (data.status === "rejected" || data.status === "ended") {
            cleanup();
            return;
          }

          if (data.answer && pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          }
        });

        // 8. Listen for callee's ICE candidates
        unsubCandidates = onSnapshot(
          collection(db, "videoCalls", callId, "calleeCandidates"),
          (snap) => {
            snap.docChanges().forEach(async (change) => {
              if (change.type === "added") {
                await pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
              }
            });
          }
        );
      } catch (err: any) {
        setError(err.message ?? "Could not access camera/microphone.");
      }
    };

    start();

    return () => {
      unsubCall?.();
      unsubCandidates?.();
    };
  }, []); // run once on mount

  // ── Controls ───────────────────────────────────────────────────────────────
  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setMicOn((v) => !v);
  };

  const toggleCam = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setCamOn((v) => !v);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/95"
      style={{ zIndex: 99999 }}
    >
      <div className="relative w-full max-w-4xl mx-4 rounded-2xl overflow-hidden bg-gray-900 shadow-2xl">
        {/* Remote video (large) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full aspect-video bg-gray-800 object-cover"
        />

        {/* Status overlay when not yet connected */}
        {status !== "connected" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 text-white gap-3">
            {error ? (
              <p className="text-red-400 text-sm px-6 text-center">{error}</p>
            ) : (
              <>
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                  <Phone className="h-8 w-8 text-primary" />
                </div>
                <p className="text-lg font-semibold">{remoteUserName}</p>
                <p className="text-sm text-gray-400">
                  {status === "calling" ? "Calling…" : "Connecting…"}
                </p>
              </>
            )}
          </div>
        )}

        {/* Local video (picture-in-picture) */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-20 right-4 w-32 aspect-video rounded-lg border-2 border-white/20 object-cover bg-gray-700"
        />

        {/* Controls bar */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <Button
            variant="outline"
            size="icon"
            className={cn("rounded-full h-12 w-12 border-white/20 text-white hover:bg-white/10", !micOn && "bg-red-500/30 border-red-400")}
            onClick={toggleMic}
          >
            {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button
            variant="destructive"
            size="icon"
            className="rounded-full h-14 w-14"
            onClick={() => cleanup("ended")}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className={cn("rounded-full h-12 w-12 border-white/20 text-white hover:bg-white/10", !camOn && "bg-red-500/30 border-red-400")}
            onClick={toggleCam}
          >
            {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Incoming call component (callee side) ────────────────────────────────────

interface IncomingCallProps {
  callId: string;
  callerName: string;
  localUserId: string;
  localUserName: string;
  onAccepted: (callId: string) => void;
  onRejected: () => void;
}

export const IncomingCall = ({
  callId,
  callerName,
  localUserId,
  localUserName,
  onAccepted,
  onRejected,
}: IncomingCallProps) => {
  const handleReject = async () => {
    await endCall(callId, "rejected");
    onRejected();
  };

  return createPortal(
    <div
      className="fixed bottom-6 right-6 z-[99999] bg-gray-900 text-white rounded-2xl shadow-2xl p-5 w-72 border border-white/10"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center animate-pulse shrink-0">
          <Phone className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="font-semibold">{callerName}</p>
          <p className="text-sm text-gray-400">Incoming video call…</p>
        </div>
      </div>
      <div className="flex gap-3">
        <Button
          variant="destructive"
          className="flex-1 rounded-full"
          onClick={handleReject}
        >
          <PhoneOff className="h-4 w-4 mr-2" /> Decline
        </Button>
        <Button
          className="flex-1 rounded-full bg-green-600 hover:bg-green-700"
          onClick={() => onAccepted(callId)}
        >
          <Phone className="h-4 w-4 mr-2" /> Accept
        </Button>
      </div>
    </div>,
    document.body
  );
};

// ─── Callee video call (answer side) ─────────────────────────────────────────

interface CalleeVideoCallProps {
  callId: string;
  localUserId: string;
  localUserName: string;
  remoteUserName: string;
  onClose: () => void;
}

export const CalleeVideoCall = ({
  callId,
  localUserId,
  localUserName,
  remoteUserName,
  onClose,
}: CalleeVideoCallProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<"connecting" | "connected" | "ended">("connecting");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cleanup = useCallback(async () => {
    await endCall(callId, "ended");
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setStatus("ended");
    onClose();
  }, [callId, onClose]);

  useEffect(() => {
    let unsubCall: (() => void) | null = null;
    let unsubCandidates: (() => void) | null = null;

    const start = async () => {
      try {
        // 1. Get local media
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // 2. Create peer connection
        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcRef.current = pc;
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        // 3. Remote stream
        pc.ontrack = (e) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
          setStatus("connected");
        };

        // 4. Get offer from Firestore
        const callSnap = await getDoc(doc(db, "videoCalls", callId));
        const callData = callSnap.data() as CallDoc;
        await pc.setRemoteDescription(new RTCSessionDescription(callData.offer!));

        // 5. Create answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await answerCall(callId, answer);

        // 6. Send our ICE candidates
        pc.onicecandidate = async (e) => {
          if (e.candidate) {
            await addIceCandidate(callId, "calleeCandidates", e.candidate.toJSON());
          }
        };

        // 7. Listen for caller's ICE candidates
        unsubCandidates = onSnapshot(
          collection(db, "videoCalls", callId, "callerCandidates"),
          (snap) => {
            snap.docChanges().forEach(async (change) => {
              if (change.type === "added") {
                await pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
              }
            });
          }
        );

        // 8. Listen for call end
        unsubCall = onSnapshot(doc(db, "videoCalls", callId), (snap) => {
          const data = snap.data() as CallDoc | undefined;
          if (data?.status === "ended" || data?.status === "rejected") {
            cleanup();
          }
        });
      } catch (err: any) {
        setError(err.message ?? "Could not access camera/microphone.");
      }
    };

    start();
    return () => {
      unsubCall?.();
      unsubCandidates?.();
    };
  }, [callId, cleanup]);

  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setMicOn((v) => !v);
  };

  const toggleCam = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setCamOn((v) => !v);
  };

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black/95" style={{ zIndex: 99999 }}>
      <div className="relative w-full max-w-4xl mx-4 rounded-2xl overflow-hidden bg-gray-900 shadow-2xl">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full aspect-video bg-gray-800 object-cover" />

        {status !== "connected" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 text-white gap-3">
            {error ? (
              <p className="text-red-400 text-sm px-6 text-center">{error}</p>
            ) : (
              <>
                <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
                  <Phone className="h-8 w-8 text-green-400" />
                </div>
                <p className="text-lg font-semibold">{remoteUserName}</p>
                <p className="text-sm text-gray-400">Connecting…</p>
              </>
            )}
          </div>
        )}

        <video ref={localVideoRef} autoPlay playsInline muted
          className="absolute bottom-20 right-4 w-32 aspect-video rounded-lg border-2 border-white/20 object-cover bg-gray-700" />

        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <Button variant="outline" size="icon"
            className={cn("rounded-full h-12 w-12 border-white/20 text-white hover:bg-white/10", !micOn && "bg-red-500/30 border-red-400")}
            onClick={toggleMic}>
            {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>
          <Button variant="destructive" size="icon" className="rounded-full h-14 w-14" onClick={cleanup}>
            <PhoneOff className="h-6 w-6" />
          </Button>
          <Button variant="outline" size="icon"
            className={cn("rounded-full h-12 w-12 border-white/20 text-white hover:bg-white/10", !camOn && "bg-red-500/30 border-red-400")}
            onClick={toggleCam}>
            {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
