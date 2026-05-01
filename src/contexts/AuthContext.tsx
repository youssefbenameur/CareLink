import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { User } from "firebase/auth";
import {
  auth,
  getUserData,
  loginUser,
  logoutUser,
  registerUser,
  updateUserSettings,
  uploadDoctorDocuments,
  db,
} from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { DocumentData } from "firebase/firestore";

interface AuthContextType {
  currentUser: User | null;
  userData: any | null;
  loading: boolean;
  register: (
    email: string,
    password: string,
    userData: any,
    doctorDocuments?: {
      nationalId?: File;
      medicalDiploma?: File;
      cnomCard?: File;
    },
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  refreshUserData: () => Promise<DocumentData | void>;
  updateSettings: (settings: any) => Promise<boolean>;
  resubmitDocuments: (documents: {
    nationalId?: File;
    medicalDiploma?: File;
    cnomCard?: File;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  // Flag to skip onAuthStateChanged processing during doctor registration
  const isRegisteringDoctor = useRef(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const refreshUserData = async () => {
    if (currentUser) {
      try {
        const data = await getUserData(currentUser.uid);
        setUserData(data);
        return data;
      } catch (error) {
        console.error("Error refreshing user data:", error);
        throw error;
      }
    }
  };

  const updateSettings = async (settings: any) => {
    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to update settings.",
      });
      return false;
    }
    try {
      await updateUserSettings(currentUser.uid, settings);
      await refreshUserData();
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully.",
      });
      return true;
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update settings. Please try again.",
      });
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      // Skip all processing during doctor registration — we handle it manually
      if (isRegisteringDoctor.current) return;

      setCurrentUser(user);

      if (user) {
        try {
          const data = await getUserData(user.uid);
          setUserData(data);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData(null);
          await logoutUser();
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (
    email: string,
    password: string,
    userData: any,
    doctorDocuments?: {
      nationalId?: File;
      medicalDiploma?: File;
      cnomCard?: File;
    },
  ) => {
    setLoading(true);
    try {
      const userDataWithRole = {
        ...userData,
        role: userData.role || "patient",
      };

      // Check system settings before allowing registration
      try {
        const { doc: fsDoc, getDoc: fsGetDoc } = await import("firebase/firestore");
        const snap = await fsGetDoc(fsDoc(db, "systemConfig", "global"));
        if (snap.exists()) {
          const sysSettings = snap.data();
          if (userDataWithRole.role === "doctor" && sysSettings.allowDoctorRegistration === false) {
            throw new Error("Doctor registration is currently disabled. Please contact the administrator.");
          }
          if (userDataWithRole.role === "patient" && sysSettings.allowPatientRegistration === false) {
            throw new Error("Patient registration is currently disabled. Please contact the administrator.");
          }
        }
      } catch (settingsErr: any) {
        if (settingsErr.message?.includes("disabled")) throw settingsErr;
        // If we can't read settings, allow registration to proceed
      }

      if (userDataWithRole.role === "doctor") {
        // Set flag BEFORE creating auth user so onAuthStateChanged is skipped
        isRegisteringDoctor.current = true;

        const { createUserWithEmailAndPassword, signOut: firebaseSignOut } =
          await import("firebase/auth");
        const {
          doc: firestoreDoc,
          setDoc,
          Timestamp,
        } = await import("firebase/firestore");

        let user: User | null = null;
        try {
          // Step 1: create Firebase Auth user to get UID
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password,
          );
          user = userCredential.user;

          // Step 2: upload documents to Storage if provided
          let credentialDocuments: Record<string, string> = {};
          if (doctorDocuments) {
            const hasRequiredFiles =
              doctorDocuments.nationalId && doctorDocuments.medicalDiploma && doctorDocuments.cnomCard;
            if (hasRequiredFiles) {
              try {
                credentialDocuments = (await uploadDoctorDocuments(
                  user.uid,
                  doctorDocuments,
                )) as Record<string, string>;
                if (
                  !credentialDocuments.nationalId ||
                  !credentialDocuments.medicalDiploma ||
                  !credentialDocuments.cnomCard
                ) {
                  throw new Error(
                    "Required documents failed to upload. Please try again.",
                  );
                }
              } catch (uploadError) {
                console.error("Document upload failed:", uploadError);
                throw new Error(
                  "Failed to upload required documents. Please check your internet connection and try again.",
                );
              }
            } else {
              throw new Error(
                "National ID, Medical Diploma, and Professional Card CNOM are required for doctor registration.",
              );
            }
          }

          // Step 3: write complete Firestore doc atomically
          // Check if auto-approval is enabled
          let initialStatus = "pending";
          try {
            const { doc: cfgDoc, getDoc: cfgGet } = await import("firebase/firestore");
            const settingsSnap = await cfgGet(cfgDoc(db, "systemConfig", "global"));
            if (settingsSnap.exists() && settingsSnap.data().requireDoctorApproval === false) {
              initialStatus = "approved";
            }
          } catch (_) {}

          await setDoc(firestoreDoc(db, "users", user.uid), {
            ...userDataWithRole,
            doctorVerificationStatus: initialStatus,
            status: "active",
            credentialDocuments,
            createdAt: Timestamp.now(),
            email,
          });

          // Step 4: sign out — doctor must log in after admin approval
          await firebaseSignOut(auth);
        } catch (err) {
          // Cleanup: delete orphaned auth user if Firestore write failed
          if (user) {
            try {
              await user.delete();
            } catch (_) {}
          }
          throw err;
        } finally {
          // Always clear the flag and reset state
          isRegisteringDoctor.current = false;
          setCurrentUser(null);
          setUserData(null);
          setLoading(false);
        }

        toast({
          title: "Registration submitted!",
          description:
            "Your account is pending admin approval. You will be notified once approved.",
        });
      } else {
        // Patient registration — normal flow
        await registerUser(email, password, userDataWithRole);
        toast({
          title: "Account created successfully!",
          description: "You can now log in to your account.",
        });
      }

      navigate("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await loginUser(email, password);

      const user = auth.currentUser;
      if (user) {
        const freshUserData = await getUserData(user.uid);
        setUserData(freshUserData);

        // Block suspended users immediately
        if (freshUserData?.status === "suspended") {
          await logoutUser();
          setCurrentUser(null);
          setUserData(null);
          toast({
            variant: "destructive",
            title: "Account suspended",
            description:
              "Your account has been suspended. Please contact support@carelink.com for assistance.",
          });
          return;
        }

        if (
          freshUserData?.role === "doctor" &&
          freshUserData?.doctorVerificationStatus === "pending"
        ) {
          await logoutUser();
          setCurrentUser(null);
          setUserData(null);
          toast({
            variant: "destructive",
            title: "Account pending approval",
            description:
              "Your account is still pending admin approval. You cannot log in yet.",
          });
          return;
        }

        if (
          freshUserData?.role === "doctor" &&
          freshUserData?.doctorVerificationStatus === "resubmit"
        ) {
          // Keep them logged in — they need to access the resubmit page
          setCurrentUser(user);
          setUserData(freshUserData);
          navigate("/doctor/resubmit");
          return;
        }

        if (
          freshUserData?.role === "doctor" &&
          freshUserData?.doctorVerificationStatus === "rejected"
        ) {
          await logoutUser();
          setCurrentUser(null);
          setUserData(null);
          toast({
            variant: "destructive",
            title: "Account rejected",
            description:
              "Your account application has been rejected. Please contact support@carelink.com for more information.",
          });
          return;
        }

        if (
          freshUserData?.role === "doctor" &&
          freshUserData?.doctorVerificationStatus !== "approved"
        ) {
          await logoutUser();
          setCurrentUser(null);
          setUserData(null);
          toast({
            variant: "destructive",
            title: "Login not allowed",
            description: "Your account is not approved for login.",
          });
          return;
        }
        toast({
          title: "Logged in successfully!",
          description: `Welcome back to CareLink, ${freshUserData?.name || "User"}`,
        });
      } else {
        toast({
          title: "Logged in successfully!",
          description: "Welcome back to CareLink.",
        });
      }

      navigate("/role-redirect");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      toast({ title: "Logged out successfully" });
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const resubmitDocuments = async (documents: {
    nationalId?: File;
    medicalDiploma?: File;
    cnomCard?: File;
  }) => {
    // Use auth.currentUser directly — more reliable than state during navigation
    const user = auth.currentUser;
    if (!user) {
      toast({
        variant: "destructive",
        title: "Not logged in",
        description: "Please log in again and try resubmitting.",
      });
      return;
    }

    setLoading(true);
    try {
      const {
        doc: firestoreDoc,
        updateDoc,
        Timestamp,
      } = await import("firebase/firestore");

      // Convert files to base64 and store in Firestore
      const credentialDocuments = (await uploadDoctorDocuments(
        user.uid,
        documents,
      )) as Record<string, string>;

      if (!credentialDocuments.nationalId || !credentialDocuments.medicalDiploma || !credentialDocuments.cnomCard) {
        throw new Error("All three documents are required. Please upload all files and try again.");
      }

      await updateDoc(firestoreDoc(db, "users", user.uid), {
        credentialDocuments,
        doctorVerificationStatus: "pending",
        resubmitNote: null,
        resubmittedAt: Timestamp.now(),
      });

      await refreshUserData();

      toast({
        title: "Documents submitted!",
        description: "Your documents are now under review. You will be notified once a decision is made.",
      });

      navigate("/doctor/pending");
    } catch (error: any) {
      console.error("Resubmission error:", error);
      toast({
        variant: "destructive",
        title: "Resubmission failed",
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    userData,
    loading,
    register,
    login,
    logout,
    isAuthenticated: !!currentUser,
    refreshUserData,
    updateSettings,
    resubmitDocuments,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
