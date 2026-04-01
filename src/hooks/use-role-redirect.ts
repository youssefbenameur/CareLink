
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const useRoleRedirect = () => {
  const { currentUser, userData, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && currentUser && userData) {
      setTimeout(() => {
        switch (userData.role) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'doctor':
            navigate('/doctor/dashboard');
            break;
          case 'patient':
            navigate('/dashboard');
            break;
          default:
            navigate('/dashboard');
            break;
        }
      }, 1000); // Small delay for smooth transition
    }
  }, [currentUser, userData, loading, navigate]);

  return { loading, currentUser, userData };
};
