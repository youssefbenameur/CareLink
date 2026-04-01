
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const RoleRedirectPage = () => {
  const { loading, currentUser, userData, isAuthenticated } = useAuth();
  const [redirectInfo, setRedirectInfo] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && isAuthenticated && userData) {
      console.log("User role detected:", userData.role);
      
      switch (userData.role) {
        case 'admin':
          setRedirectInfo('admin dashboard');
          setTimeout(() => navigate('/admin/dashboard'), 1500);
          break;
        case 'doctor':
          setRedirectInfo('doctor dashboard');
          setTimeout(() => navigate('/doctor/dashboard'), 1500);
          break;
        case 'patient':
          setRedirectInfo('patient dashboard');
          setTimeout(() => navigate('/dashboard'), 1500);
          break;
        default:
          setRedirectInfo('dashboard');
          toast({
            title: "Role not recognized",
            description: `Your role '${userData.role}' is not recognized. Redirecting to default dashboard.`,
            variant: "destructive"
          });
          setTimeout(() => navigate('/dashboard'), 1500);
          break;
      }
    } else if (!loading && !isAuthenticated) {
      // If not authenticated, redirect to login
      toast({
        title: "Authentication required",
        description: "Please log in to continue",
      });
      setTimeout(() => navigate('/login'), 1500);
    }
  }, [loading, userData, isAuthenticated, navigate, toast]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <h1 className="mt-6 text-2xl font-semibold">Redirecting you...</h1>
        <p className="mt-2 text-muted-foreground">
          {isAuthenticated 
            ? `Please wait while we direct you to the ${redirectInfo}.`
            : "Please wait while we redirect you to the login page."}
        </p>
      </div>
    </div>
  );
};
