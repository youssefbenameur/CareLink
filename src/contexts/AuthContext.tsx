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
            const hasFiles = Object.values(doctorDocuments).some(Boolean);
            if (hasFiles) {
              try {
                credentialDocuments = await uploadDoctorDocuments(user.uid, doctorDocuments) as Record<string, string>;
              } catch (uploadError) {
                // Upload failed (e.g. CORS) — register anyway without documents
                // Admin will see empty document slots
                console.warn("Document upload failed, registering without documents:", uploadError);
              }
            }
          }

          // Step 3: write complete Firestore doc atomically
          await setDoc(firestoreDoc(db, "users", user.uid), {
            ...userDataWithRole,
            doctorVerificationStatus: "pending",
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

        if (freshUserData?.role === "doctor" && freshUserData?.doctorVerificationStatus === "pending") {
          navigate("/doctor/pending");
          return;
        }

        if (freshUserData?.role === "doctor" && freshUserData?.doctorVerificationStatus === "rejected") {
          navigate("/doctor/rejected");
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
