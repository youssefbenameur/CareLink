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
  register: (email: string, password: string, userData: any, doctorDocuments?: { doctorLicense?: File; diploma?: File; certification?: File }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  refreshUserData: () => Promise<DocumentData | void>;
  updateSettings: (settings: any) => Promise<boolean>;
  resubmitDocuments: (documents: { doctorLicense?: File; diploma?: File; certification?: File }) => Promise<void>;
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
    doctorDocuments?: { doctorLicense?: File; diploma?: File; certification?: File }
  ) => {
    setLoading(true);
    try {
      const userDataWithRole = {
        ...userData,
        role: userData.role || "patient",
      };

      if (userDataWithRole.role === "doctor") {
        // Set flag BEFORE creating auth user so onAuthStateChanged is skipped
        isRegisteringDoctor.current = true;

        const { createUserWithEmailAndPassword, signOut: firebaseSignOut } = await import("firebase/auth");
        const { doc: firestoreDoc, setDoc, Timestamp } = await import("firebase/firestore");

        let user: User | null = null;
        try {
          // Step 1: create Firebase Auth user to get UID
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          user = userCredential.user;

          // Step 2: upload documents to Storage if provided
          let credentialDocuments: Record<string, string> = {};
          if (doctorDocuments) {
            const hasRequiredFiles = doctorDocuments.doctorLicense && doctorDocuments.diploma;
            if (hasRequiredFiles) {
              try {
                credentialDocuments = await uploadDoctorDocuments(user.uid, doctorDocuments) as Record<string, string>;
                // Verify that required documents were uploaded successfully
                if (!credentialDocuments.doctorLicense || !credentialDocuments.diploma) {
                  throw new Error("Required documents (Medical License and Diploma) failed to upload. Please try again.");
                }
              } catch (uploadError) {
                // Upload failed - clean up and throw error to block registration
                console.error("Document upload failed:", uploadError);
                throw new Error("Failed to upload required documents. Please check your internet connection and try again.");
              }
            } else {
              // Required documents not provided - block registration
              throw new Error("Medical License and Diploma are required for doctor registration.");
            }
          }

          // Step 3: write complete Firestore doc atomically
          await setDoc(firestoreDoc(db, "users", user.uid), {
            ...userDataWithRole,
            doctorVerificationStatus: "pending",
            status: 'active',
            credentialDocuments,
            createdAt: Timestamp.now(),
            email,
          });

          // Step 4: sign out — doctor must log in after admin approval
          await firebaseSignOut(auth);

        } catch (err) {
          // Cleanup: delete orphaned auth user if Firestore write failed
          if (user) {
            try { await user.delete(); } catch (_) {}
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
          description: "Your account is pending admin approval. You will be notified once approved.",
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
        if (freshUserData?.status === 'suspended') {
          await logoutUser();
          setCurrentUser(null);
          setUserData(null);
          toast({
            variant: "destructive",
            title: "Account suspended",
            description: "Your account has been suspended. Please contact support@carelink.com for assistance.",
          });
          return;
        }

        if (freshUserData?.role === "doctor" && freshUserData?.doctorVerificationStatus === "pending") {
          await logoutUser();
          setCurrentUser(null);
          setUserData(null);
          toast({
            variant: "destructive",
            title: "Account pending approval",
            description: "Your account is still pending admin approval. You cannot log in yet.",
          });
          return;
        }

        if (freshUserData?.role === "doctor" && freshUserData?.doctorVerificationStatus === "resubmit") {
          await logoutUser();
          setCurrentUser(null);
          setUserData(null);
          toast({
            variant: "destructive",
            title: "Resubmit required",
            description: "Your documents need to be resubmitted. Please contact support@carelink.com for details.",
          });
          return;
        }

        if (freshUserData?.role === "doctor" && freshUserData?.doctorVerificationStatus === "rejected") {
          await logoutUser();
          setCurrentUser(null);
          setUserData(null);
          toast({
            variant: "destructive",
            title: "Account rejected",
            description: "Your account application has been rejected. Please contact support@carelink.com for more information.",
          });
          return;
        }

        if (freshUserData?.role === "doctor" && freshUserData?.doctorVerificationStatus !== "approved") {
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

  const resubmitDocuments = async (
    documents: { doctorLicense?: File; diploma?: File; certification?: File }
  ) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const { doc: firestoreDoc, updateDoc, Timestamp } = await import("firebase/firestore");

      const credentialDocuments = await uploadDoctorDocuments(currentUser.uid, documents) as Record<string, string>;

      if (!credentialDocuments.doctorLicense || !credentialDocuments.diploma) {
        throw new Error("Required documents (Medical License and Diploma) failed to upload. Please try again.");
      }

      await updateDoc(firestoreDoc(db, "users", currentUser.uid), {
        credentialDocuments,
        doctorVerificationStatus: "pending",
        resubmitNote: null,
        resubmittedAt: Timestamp.now(),
      });

      await refreshUserData();

      toast({
        title: "Documents resubmitted!",
        description: "Your application is back under review. You will be notified once a decision is made.",
      });

      navigate("/doctor/pending");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Resubmission failed",
        description: error.message,
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
