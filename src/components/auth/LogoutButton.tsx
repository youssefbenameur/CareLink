
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const LogoutButton = () => {
  const { logout } = useAuth();

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={logout} 
      aria-label="Logout"
      title="Logout"
    >
      <LogOut className="h-5 w-5" />
    </Button>
  );
};

export default LogoutButton;
