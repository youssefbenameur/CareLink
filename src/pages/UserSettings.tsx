import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, sendPasswordResetEmail } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AnimatedSection } from '@/components/ui/animated-section';
import { useTranslation } from 'react-i18next';
import { User, Lock, Palette, Globe, Mail, Shield, ChevronRight, Save } from 'lucide-react';

const UserSettings = () => {
  const { currentUser, userData, loading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [reminderTime, setReminderTime] = useState('24');
  const [theme, setTheme] = useState('system');
  const [language, setLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [timeZone, setTimeZone] = useState('auto');
  const [dateFormat, setDateFormat] = useState('mdy');
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['settings', 'common']);
  
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setName(data.name || '');
          setEmail(currentUser?.email || '');
          setEmailNotifications(data.emailNotifications !== false);
          setPushNotifications(data.pushNotifications !== false);
          setReminderTime(data.reminderTime || '24');
          setTheme(data.theme || 'system');
          setLanguage(data.language || 'en');
          setTimeZone(data.timeZone || 'auto');
          setDateFormat(data.dateFormat || 'mdy');
        } else {
          setName(currentUser.displayName || '');
          setEmail(currentUser.email || '');
        }
      } catch (error) {
        console.error('Error fetching user settings:', error);
        toast({
          variant: 'destructive',
          title: t('common:error'),
          description: t('common:tryAgain'),
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!loading) {
      fetchUserSettings();
    }
  }, [loading, currentUser, toast, t]);
  
  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        name,
        updatedAt: new Date()
      });
      
      toast({
        title: t('settings:success.profile.title'),
        description: t('settings:success.profile.message'),
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: t('settings:error.profile.title'),
        description: t('settings:error.profile.message'),
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveNotifications = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        emailNotifications,
        pushNotifications,
        reminderTime,
        updatedAt: new Date()
      });
      
      toast({
        title: t('settings:success.notifications.title'),
        description: t('settings:success.notifications.message'),
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast({
        variant: 'destructive',
        title: t('settings:error.notifications.title'),
        description: t('settings:error.notifications.message'),
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSavePreferences = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        theme,
        language,
        timeZone,
        dateFormat,
        updatedAt: new Date()
      });
      
      // Update the app language
      if (i18n.language !== language) {
        i18n.changeLanguage(language);
      }
      
      toast({
        title: t('settings:success.preferences.title'),
        description: t('settings:success.preferences.message'),
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        variant: 'destructive',
        title: t('settings:error.preferences.title'),
        description: t('settings:error.preferences.message'),
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResetPassword = async () => {
    if (!email) return;
    
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(email);
      toast({
        title: t('settings:success.resetPassword.title'),
        description: t('settings:success.resetPassword.message'),
      });
    } catch (error) {
      console.error('Error sending reset password email:', error);
      toast({
        variant: 'destructive',
        title: t('settings:error.resetPassword.title'),
        description: t('settings:error.resetPassword.message'),
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('settings:title')}</h1>
          <p className="text-muted-foreground">
            {t('settings:description')}
          </p>
        </div>
        
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">{t('settings:tabs.profile')}</TabsTrigger>
            <TabsTrigger value="notifications">{t('settings:tabs.notifications')}</TabsTrigger>
            <TabsTrigger value="preferences">{t('settings:tabs.preferences')}</TabsTrigger>
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <AnimatedSection>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    {t('settings:profile.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('settings:profile.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('settings:profile.name')}</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('settings:profile.email')}</Label>
                    <Input
                      id="email"
                      value={email}
                      disabled
                      className="bg-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('settings:profile.emailDescription')}
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={isLoading || !name}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                        {t('common:loading')}
                      </div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {t('settings:profile.save')}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </AnimatedSection>
            
            <AnimatedSection delay={0.1}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lock className="h-5 w-5 mr-2" />
                    {t('settings:security.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('settings:security.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md border p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{t('settings:security.password.title')}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t('settings:security.password.description')}
                        </p>
                      </div>
                      <Button variant="outline" onClick={handleResetPassword} disabled={isLoading}>
                        {t('settings:security.password.action')}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="rounded-md border p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{t('settings:security.2fa.title')}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t('settings:security.2fa.description')}
                        </p>
                      </div>
                      <Button variant="outline">
                        {t('settings:security.2fa.action')}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="rounded-md border p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{t('settings:security.sessions.title')}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t('settings:security.sessions.description')}
                        </p>
                      </div>
                      <Button variant="outline">
                        {t('settings:security.sessions.action')}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>
          </TabsContent>
          
          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <AnimatedSection>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    {t('settings:notifications.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('settings:notifications.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="emailNotifications">{t('settings:notifications.email')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('settings:notifications.emailDescription')}
                      </p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="pushNotifications">{t('settings:notifications.push')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('settings:notifications.pushDescription')}
                      </p>
                    </div>
                    <Switch
                      id="pushNotifications"
                      checked={pushNotifications}
                      onCheckedChange={setPushNotifications}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="reminderTime">{t('settings:notifications.reminderTime')}</Label>
                    <Select value={reminderTime} onValueChange={setReminderTime} disabled={isLoading}>
                      <SelectTrigger id="reminderTime">
                        <SelectValue placeholder={t('settings:notifications.reminderTime')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">{t('settings:notifications.reminder1h')}</SelectItem>
                        <SelectItem value="3">{t('settings:notifications.reminder3h')}</SelectItem>
                        <SelectItem value="24">{t('settings:notifications.reminder24h')}</SelectItem>
                        <SelectItem value="48">{t('settings:notifications.reminder48h')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSaveNotifications} 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                        {t('common:loading')}
                      </div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {t('common:save')} {t('settings:tabs.notifications')}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </AnimatedSection>
          </TabsContent>
          
          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <AnimatedSection>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Palette className="h-5 w-5 mr-2" />
                    {t('settings:preferences.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('settings:preferences.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="theme">{t('settings:preferences.theme.title')}</Label>
                    <Select value={theme} onValueChange={setTheme} disabled={isLoading}>
                      <SelectTrigger id="theme">
                        <SelectValue placeholder={t('settings:preferences.theme.title')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">{t('settings:preferences.theme.light')}</SelectItem>
                        <SelectItem value="dark">{t('settings:preferences.theme.dark')}</SelectItem>
                        <SelectItem value="system">{t('settings:preferences.theme.system')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="language">{t('settings:preferences.language.title')}</Label>
                    <Select value={language} onValueChange={setLanguage} disabled={isLoading}>
                      <SelectTrigger id="language">
                        <SelectValue placeholder={t('settings:preferences.language.title')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">{t('settings:preferences.language.english')}</SelectItem>
                        <SelectItem value="fr">{t('settings:preferences.language.french')}</SelectItem>
                        <SelectItem value="es">{t('settings:preferences.language.spanish')}</SelectItem>
                        <SelectItem value="de">{t('settings:preferences.language.german')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSavePreferences} 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                        {t('common:loading')}
                      </div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {t('common:save')} {t('settings:tabs.preferences')}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </AnimatedSection>
            
            <AnimatedSection delay={0.1}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    {t('settings:regionalSettings.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('settings:regionalSettings.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="timeZone">{t('settings:regionalSettings.timezone.title')}</Label>
                    <Select value={timeZone} onValueChange={setTimeZone} disabled={isLoading}>
                      <SelectTrigger id="timeZone">
                        <SelectValue placeholder={t('settings:regionalSettings.timezone.title')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">{t('settings:regionalSettings.timezone.auto')}</SelectItem>
                        <SelectItem value="et">{t('settings:regionalSettings.timezone.et')}</SelectItem>
                        <SelectItem value="ct">{t('settings:regionalSettings.timezone.ct')}</SelectItem>
                        <SelectItem value="mt">{t('settings:regionalSettings.timezone.mt')}</SelectItem>
                        <SelectItem value="pt">{t('settings:regionalSettings.timezone.pt')}</SelectItem>
                        <SelectItem value="utc">{t('settings:regionalSettings.timezone.utc')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">{t('settings:regionalSettings.dateFormat.title')}</Label>
                    <Select value={dateFormat} onValueChange={setDateFormat} disabled={isLoading}>
                      <SelectTrigger id="dateFormat">
                        <SelectValue placeholder={t('settings:regionalSettings.dateFormat.title')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mdy">{t('settings:regionalSettings.dateFormat.mdy')}</SelectItem>
                        <SelectItem value="dmy">{t('settings:regionalSettings.dateFormat.dmy')}</SelectItem>
                        <SelectItem value="ymd">{t('settings:regionalSettings.dateFormat.ymd')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSavePreferences} 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                        {t('common:loading')}
                      </div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {t('common:save')} {t('settings:regionalSettings.title')}
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

export default UserSettings;
