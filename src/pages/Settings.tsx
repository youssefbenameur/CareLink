
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Home,
  Save, 
  Check,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedSection } from '@/components/ui/animated-section';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Textarea } from '@/components/ui/textarea';
import { userService } from '@/services/userService';
import { changePassword, deleteUserAccount } from '@/lib/firebase';

interface ProfileFormData {
  name: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  bio: string;
}

const Settings = () => {
  const { currentUser, userData } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileFormData>({
    defaultValues: {
      name: '',
      phone: '',
      dateOfBirth: '',
      address: '',
      bio: ''
    }
  });
  
  const [notifications, setNotifications] = useState({
    email: true,
    appointments: true,
    messages: true,
    updates: false
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [isSaving, setSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  useEffect(() => {
    if (userData) {
      setValue('name', userData.name || '');
      setValue('phone', userData.phone || '');
      setValue('dateOfBirth', userData.dateOfBirth || '');
      setValue('address', userData.address || '');
      setValue('bio', userData.bio || '');
    }
  }, [userData, setValue]);
  
  const handleNotificationChange = (key: string, checked: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: checked }));
  };
  
  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!currentUser) return;
    
    setSaving(true);
    try {
      await userService.updateUserData(currentUser.uid, data);
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "There was a problem updating your profile.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleSaveNotifications = () => {
    toast({
      title: "Notification Preferences Updated",
      description: "Your notification settings have been saved.",
    });
  };
  
  const handleChangePassword = async () => {
    // Validation
    if (!passwordData.currentPassword) {
      toast({
        title: "Validation Error",
        description: "Please enter your current password",
        variant: "destructive"
      });
      return;
    }

    if (!passwordData.newPassword) {
      toast({
        title: "Validation Error",
        description: "Please enter a new password",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Validation Error",
        description: "New password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "New passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword === passwordData.currentPassword) {
      toast({
        title: "Validation Error",
        description: "New password must be different from current password",
        variant: "destructive"
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      // Clear the form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      toast({
        title: "Success",
        description: "Your password has been changed successfully.",
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: "Password Change Failed",
        description: error.message || "There was a problem changing your password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast({
        title: "Validation Error",
        description: "Please enter your password to confirm account deletion",
        variant: "destructive"
      });
      return;
    }

    setIsDeletingAccount(true);
    try {
      await deleteUserAccount(deletePassword);
      
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });

      // Redirect to home page
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "There was a problem deleting your account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteConfirm(false);
      setDeletePassword('');
    }
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AnimatedSection className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
        </AnimatedSection>
        
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6">
            <AnimatedSection delay={0.1}>
              <form onSubmit={handleSubmit(onProfileSubmit)}>
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal information and profile details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <Avatar className="h-24 w-24">
                        <AvatarFallback className="text-2xl">
                          {userData?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">{userData?.name || 'Your Name'}</h3>
                        <p className="text-xs text-muted-foreground">{userData?.email}</p>
                        <Button size="sm" variant="outline" type="button">Change Avatar</Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="name"
                            placeholder="John Doe" 
                            className="pl-10"
                            {...register('name', { required: 'Name is required' })}
                          />
                        </div>
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="email"
                            type="email" 
                            value={currentUser?.email || ''}
                            className="pl-10"
                            disabled
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Email cannot be changed directly</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="phone"
                              placeholder="+1 (555) 123-4567" 
                              className="pl-10"
                              {...register('phone')}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth">Date of Birth</Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="dateOfBirth"
                              type="date" 
                              className="pl-10"
                              {...register('dateOfBirth')}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <div className="relative">
                          <Home className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="address"
                            placeholder="123 Main St, City, Country" 
                            className="pl-10"
                            {...register('address')}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bio">About You</Label>
                        <Textarea
                          id="bio"
                          placeholder="A brief description about yourself"
                          rows={4}
                          {...register('bio')}
                        />
                        <p className="text-xs text-muted-foreground">
                          This information helps us personalize your experience and allows your care team to understand you better.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </AnimatedSection>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-6">
            <AnimatedSection delay={0.1}>
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Control how and when you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive email notifications about important updates
                        </p>
                      </div>
                      <Switch 
                        id="email-notifications" 
                        checked={notifications.email}
                        onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="appointment-reminders">Appointment Reminders</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about upcoming appointments
                        </p>
                      </div>
                      <Switch 
                        id="appointment-reminders" 
                        checked={notifications.appointments}
                        onCheckedChange={(checked) => handleNotificationChange('appointments', checked)}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="message-notifications">Message Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when you receive new messages
                        </p>
                      </div>
                      <Switch 
                        id="message-notifications" 
                        checked={notifications.messages}
                        onCheckedChange={(checked) => handleNotificationChange('messages', checked)}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="platform-updates">Platform Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications about new features and updates
                        </p>
                      </div>
                      <Switch 
                        id="platform-updates" 
                        checked={notifications.updates}
                        onCheckedChange={(checked) => handleNotificationChange('updates', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveNotifications}>
                    <Check className="mr-2 h-4 w-4" />
                    Save Notification Preferences
                  </Button>
                </CardFooter>
              </Card>
            </AnimatedSection>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-6">
            <AnimatedSection delay={0.1}>
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input 
                      id="current-password"
                      type="password"
                      placeholder="Enter your current password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input 
                        id="new-password"
                        type="password"
                        placeholder="Enter new password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input 
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm new password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Password must be at least 8 characters and include a combination of letters, numbers, and special characters.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </AnimatedSection>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
