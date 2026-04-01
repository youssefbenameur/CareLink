import React, {
  createContext,
  useContext,
  useState,
  useEffect,
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
} from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { DocumentData } from "firebase/firestore";

interface AuthContextType {
  currentUser: User | null;
  userData: any | null;
  loading: boolean;
  register: (email: string, password: string, userData: any) => Promise<void>;
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
  const navigate = useNavigate();
  const { toast } = useToast();

  const refreshUserData = async () => {
    if (currentUser) {
      try {
        const data = await getUserData(currentUser.uid);
        console.log("User data refreshed:", data);
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
      // Refresh user data after updating settings
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
      setCurrentUser(user);

      if (user) {
        try {
          const data = await getUserData(user.uid);
          console.log("User data fetched:", data);
          setUserData(data);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (email: string, password: string, userData: any) => {
    setLoading(true);
    try {
      // Ensure the role is preserved from the form
      const userDataWithRole = {
        ...userData,
        role: userData.role || "patient", // Default to patient if not specified
      };

      console.log("Registering user with data:", userDataWithRole);

      await registerUser(email, password, userDataWithRole);
      toast({
        title: "Account created successfully!",
        description: "You can now log in to your account.",
      });
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

      // After login, get fresh user data to ensure role is correct
      const user = auth.currentUser;
      if (user) {
        const freshUserData = await getUserData(user.uid);
        setUserData(freshUserData);

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

      // Redirect to role-redirect page instead of directly to dashboard
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
      toast({
        title: "Logged out successfully",
      });
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
