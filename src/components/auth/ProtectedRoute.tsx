
import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, userData } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Check if route is for admin and admin access is granted via localStorage
  const isAdminRoute = allowedRoles?.includes('admin');
  const hasAdminAccess = localStorage.getItem('adminAccess') === 'true';
  
  useEffect(() => {
    // If not an admin route, proceed with normal role-based access control
    if (!isAdminRoute && !loading && isAuthenticated && userData) {
      if (allowedRoles && !allowedRoles.includes(userData.role)) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: `You need to be a ${allowedRoles.join(' or ')} to access this page.`,
        });
        
        // Redirect based on role
        let redirectPath = '/dashboard';
        if (userData.role === 'admin') {
          redirectPath = '/admin/dashboard';
        } else if (userData.role === 'doctor') {
          redirectPath = '/doctor/dashboard';
        }
        
        navigate(redirectPath);
      }
    }
  }, [loading, isAuthenticated, userData, allowedRoles, navigate, toast, isAdminRoute]);
  
  if (loading && !isAdminRoute) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading...</span>
      </div>
    );
  }
  
  // For admin routes, check if admin access is granted via localStorage
  if (isAdminRoute) {
    if (hasAdminAccess) {
      return <>{children}</>;
    } else {
      // Add state to track where the user was trying to go for proper redirection after login
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
  }
  
  // For non-admin routes, check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (allowedRoles && userData && !allowedRoles.includes(userData.role)) {
    return null; // Will be redirected by the useEffect
  }

  // Block pending/rejected doctors from accessing doctor-only routes
  if (userData?.role === 'doctor' && allowedRoles?.includes('doctor')) {
    if (userData?.doctorVerificationStatus === 'pending') {
      return <Navigate to="/doctor/pending" replace />;
    }
    if (userData?.doctorVerificationStatus === 'rejected') {
      return <Navigate to="/doctor/rejected" replace />;
    }
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
