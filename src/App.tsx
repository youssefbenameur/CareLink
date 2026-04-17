import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/contexts/AuthContext";
import Home from "@/pages/Index";
import Login from "@/pages/Login";
import Signup from "@/pages/Register";
import PatientDashboard from "@/pages/Dashboard";
import DoctorDashboard from "@/pages/doctor/Dashboard";
import DoctorChat from "@/pages/doctor/Chat";
import PatientList from "@/pages/doctor/PatientList";
import PatientDetails from "@/pages/doctor/PatientDetails";
import UserSettings from "@/pages/UserSettings";
import DoctorProfile from "@/pages/doctor/Profile";
import Chat from "@/pages/Chat";
import PatientProfile from "@/pages/UserProfile";
import PatientAppointments from "@/pages/Appointments";
import DoctorAppointments from "@/pages/doctor/Appointments";
import MoodTracker from "@/pages/MoodTracker";
import MedicalRecords from "@/pages/doctor/MedicalRecords";
import FindDoctor from "@/pages/FindDoctor";
import { RoleRedirectPage } from "@/pages/RoleRedirectPage";
import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import ManageUsers from "@/pages/admin/ManageUsers";
import SystemSettings from "@/pages/admin/SystemSettings";
import DoctorApprovals from "@/pages/admin/DoctorApprovals";
import About from "@/pages/About";
import Privacy from "@/pages/Privacy";
import PendingApproval from "@/pages/doctor/PendingApproval";
import RejectedApplication from "@/pages/doctor/RejectedApplication";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient();

// Public route component - redirects if user is logged in
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (currentUser) {
    if (userData?.role === "doctor") {
      const status = userData?.doctorVerificationStatus;
      if (status === "pending") return <Navigate to="/doctor/pending" replace />;
      if (status === "rejected") return <Navigate to="/doctor/rejected" replace />;
      return <Navigate to="/doctor/dashboard" replace />;
    }
    if (userData?.role === "patient") {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen">
            Loading...
          </div>
        }
      >
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <Home />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />
          <Route path="/role-redirect" element={<RoleRedirectPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ManageUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/doctor-approvals"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DoctorApprovals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/content"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <SystemSettings />
              </ProtectedRoute>
            }
          />

          {/* Patient routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/find-doctor"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <FindDoctor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:doctorId"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <PatientAppointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments/book"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <PatientAppointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mood-tracker"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <MoodTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <PatientProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <UserSettings />
              </ProtectedRoute>
            }
          />

          {/* Doctor routes */}
          <Route path="/doctor/pending" element={<PendingApproval />} />
          <Route path="/doctor/rejected" element={<RejectedApplication />} />
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/chat"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <DoctorChat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/chat/:patientId"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <DoctorChat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <PatientList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients/:patientId"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <PatientDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/appointments"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <DoctorAppointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/profile"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <DoctorProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/medical-records"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <MedicalRecords />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
