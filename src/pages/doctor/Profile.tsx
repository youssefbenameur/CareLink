import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { User, Mail, Phone, Calendar, BookOpen, Clock, Shield, Edit2, Save, MapPin, X, Camera } from 'lucide-react';
import DoctorLayout from '@/components/layout/DoctorLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatedSection } from '@/components/ui/animated-section';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';

const LocationPicker = lazy(() =>
  import('@/components/map/LocationPicker').then(m => ({ default: m.LocationPicker }))
);

const DoctorProfile = () => {
  const { userData, currentUser, refreshUserData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarBase64, setAvatarBase64] = useState<string>(userData?.avatarBase64 || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialization: '',
    education: '',
    bio: '',
    experience: '',
    languages: '',
    available: true,
    consultationFee: '',
    sessionDuration: '50',
    clinicLocation: '',
    clinicLat: null as number | null,
    clinicLng: null as number | null,
    practiceType: '',
  });
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emailNotifications: true,
    smsNotifications: true,
    profileVisibility: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAvatarBase64(data.avatarBase64 || "");
          setProfileData({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || currentUser.email || '',
            phone: data.phone || '',
            specialization: data.specialization || '',
            education: data.education || '',
            bio: data.bio || '',
            experience: data.experience || '',
            languages: data.languages || '',
            available: data.available !== false,
            consultationFee: data.consultationFee || '',
            sessionDuration: data.sessionDuration || '50',
            clinicLocation: data.clinicLocation || '',
            clinicLat: data.clinicLat || null,
            clinicLng: data.clinicLng || null,
            practiceType: data.practiceType || '',
          });
          
          setSecurityData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
            emailNotifications: data.emailNotifications !== false,
            smsNotifications: data.smsNotifications !== false,
            profileVisibility: data.profileVisibility !== false
          });
        }
      } catch (error) {
        console.error("Error fetching doctor data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load your profile data. Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser, toast]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", description: "Please select an image.", variant: "destructive" });
      return;
    }
    setIsUploadingAvatar(true);
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = async () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const MAX = 200;
      let { width, height } = img;
      if (width > height) { if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; } }
      else { if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; } }
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), { avatarBase64: base64 });
        setAvatarBase64(base64);
        await refreshUserData();
        toast({ title: "Photo updated", description: "Your profile photo has been saved." });
      } catch {
        toast({ title: "Error", description: "Failed to save photo.", variant: "destructive" });
      } finally {
        setIsUploadingAvatar(false);
        e.target.value = "";
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); setIsUploadingAvatar(false); };
    img.src = url;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSecurityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecurityData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (fieldName: string, checked: boolean) => {
    if (fieldName === 'available') {
      setProfileData(prev => ({
        ...prev,
        available: checked
      }));
    } else {
      setSecurityData(prev => ({
        ...prev,
        [fieldName]: checked
      }));
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);

      // Geocode clinic location to get coordinates
      let clinicLat: number | null = profileData.clinicLat;
      let clinicLng: number | null = profileData.clinicLng;

      if (profileData.clinicLocation && !clinicLat && !clinicLng) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(profileData.clinicLocation)}&format=json&limit=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          if (data.length > 0) {
            clinicLat = parseFloat(data[0].lat);
            clinicLng = parseFloat(data[0].lon);
          }
        } catch {}
      }

      await updateDoc(doc(db, "users", currentUser.uid), {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        specialization: profileData.specialization,
        education: profileData.education,
        bio: profileData.bio,
        experience: profileData.experience,
        languages: profileData.languages,
        available: profileData.available,
        consultationFee: profileData.consultationFee,
        sessionDuration: profileData.sessionDuration,
        clinicLocation: profileData.clinicLocation,
        practiceType: profileData.practiceType,
        ...(clinicLat && clinicLng ? { clinicLat, clinicLng } : {}),
        updatedAt: new Date()
      });
      
      toast({
        title: "Profile updated successfully",
        description: "Your changes have been saved.",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Could not update your profile. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveSettings = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      
      // For security, we would typically verify the current password and update 
      // the password using Firebase Auth in a real application
      // Here we'll just save notification preferences
      
      await updateDoc(doc(db, "users", currentUser.uid), {
        emailNotifications: securityData.emailNotifications,
        smsNotifications: securityData.smsNotifications,
        profileVisibility: securityData.profileVisibility,
        updatedAt: new Date()
      });
      
      toast({
        title: "Settings updated successfully",
        description: "Your preferences have been saved.",
      });
      
      setIsEditing(false);
      // Clear password fields
      setSecurityData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Could not update your settings. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !userData) {
    return (
      <DoctorLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('settings:profile.title')}</h1>
            <p className="text-muted-foreground">
              {t('settings:profile.description')}
            </p>
          </div>
          <Button onClick={() => setIsEditing(!isEditing)} disabled={isLoading} variant={isEditing ? "outline" : "default"}>
            {isEditing ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </>
            )}
          </Button>
        </div>
        
        <Tabs defaultValue="personal" className="space-y-4">
          {isEditing && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary font-medium">
              <Edit2 className="h-4 w-4" />
              You are in edit mode — make your changes and click Save.
            </div>
          )}
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
            <TabsTrigger value="personal">{t('settings:profile.title')}</TabsTrigger>
            <TabsTrigger value="professional">{t('settings:doctor.professional.title')}</TabsTrigger>
            <TabsTrigger value="settings">{t('settings:title')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal">
            <AnimatedSection>
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings:profile.title')}</CardTitle>
                  <CardDescription>
                    {t('settings:profile.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-center">
                    <div className="relative group">
                      <div className="h-24 w-24 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-border">
                        {avatarBase64 ? (
                          <img src={avatarBase64} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-12 w-12 text-primary" />
                        )}
                      </div>
                      {isEditing && (
                        <button
                          type="button"
                          disabled={isUploadingAvatar}
                          onClick={() => avatarInputRef.current?.click()}
                          className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                          title="Change photo"
                        >
                          {isUploadingAvatar
                            ? <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <Camera className="h-4 w-4" />}
                        </button>
                      )}
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t('settings:profile.firstName')}</Label>
                      <Input 
                        id="firstName"
                        name="firstName"
                        value={profileData.firstName}
                        onChange={handleInputChange}
                        disabled={!isEditing || isLoading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName">{t('settings:profile.lastName')}</Label>
                      <Input 
                        id="lastName"
                        name="lastName"
                        value={profileData.lastName}
                        onChange={handleInputChange}
                        disabled={!isEditing || isLoading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('settings:profile.email')}</Label>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="email"
                          name="email"
                          value={profileData.email}
                          disabled
                          className="bg-muted cursor-not-allowed"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('settings:profile.phone')}</Label>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="phone"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleInputChange}
                          disabled={!isEditing || isLoading}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">{t('settings:profile.bio')}</Label>
                    <Textarea 
                      id="bio"
                      name="bio"
                      value={profileData.bio}
                      onChange={handleInputChange}
                      disabled={!isEditing || isLoading}
                      rows={4}
                      placeholder={t('settings:profile.bioPlaceholder')}
                    />
                  </div>
                </CardContent>
                
                {isEditing && (
                  <CardFooter className="justify-end space-x-2">
                    <Button 
                      variant="default" 
                      onClick={handleSaveProfile} 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                          {t('settings:profile.saving')}
                        </div>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {t('settings:profile.saveChanges')}
                        </>
                      )}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </AnimatedSection>
          </TabsContent>
          
          <TabsContent value="professional">
            <AnimatedSection>
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings:doctor.professional.title')}</CardTitle>
                  <CardDescription>
                    {t('settings:doctor.professional.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="specialization">{t('settings:doctor.professional.specialization')}</Label>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="specialization"
                        name="specialization"
                        value={profileData.specialization}
                        onChange={handleInputChange}
                        disabled={!isEditing || isLoading}
                        placeholder="e.g., Cognitive Behavioral Therapy"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="practiceType">Practice Type</Label>
                    <Select
                      value={profileData.practiceType}
                      onValueChange={(val) => setProfileData(prev => ({ ...prev, practiceType: val }))}
                      disabled={!isEditing || isLoading}
                    >
                      <SelectTrigger id="practiceType">
                        <SelectValue placeholder="Select practice type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hospital">🏥 Hospital</SelectItem>
                        <SelectItem value="clinic">🏨 Clinic</SelectItem>
                        <SelectItem value="private_cabinet">🚪 Private Cabinet</SelectItem>
                        <SelectItem value="teleconsultation">💻 Teleconsultation Only</SelectItem>
                        <SelectItem value="home_visits">🏠 Home Visits</SelectItem>
                        <SelectItem value="other">📍 Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clinicLocation">Clinic / Cabinet Location</Label>
                    <Suspense fallback={<Skeleton className="h-72 w-full" />}>
                      <LocationPicker
                        lat={profileData.clinicLat ?? undefined}
                        lng={profileData.clinicLng ?? undefined}
                        address={profileData.clinicLocation}
                        disabled={!isEditing || isLoading}
                        onChange={(lat, lng, address) =>
                          setProfileData(prev => ({
                            ...prev,
                            clinicLat: lat,
                            clinicLng: lng,
                            clinicLocation: address,
                          }))
                        }
                      />
                    </Suspense>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="education">{t('settings:doctor.professional.education')}</Label>
                      <Textarea 
                        id="education"
                        name="education"
                        value={profileData.education}
                        onChange={handleInputChange}
                        disabled={!isEditing || isLoading}
                        rows={3}
                        placeholder={t('settings:doctor.professional.educationPlaceholder')}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="experience">{t('settings:doctor.professional.experience')}</Label>
                      <Textarea 
                        id="experience"
                        name="experience"
                        value={profileData.experience}
                        onChange={handleInputChange}
                        disabled={!isEditing || isLoading}
                        rows={3}
                        placeholder={t('settings:doctor.professional.experiencePlaceholder')}
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="languages">{t('settings:doctor.professional.languages')}</Label>
                      <Input 
                        id="languages"
                        name="languages"
                        value={profileData.languages}
                        onChange={handleInputChange}
                        disabled={!isEditing || isLoading}
                        placeholder={t('settings:doctor.professional.languagesPlaceholder')}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="sessionDuration">
                        {t('settings:doctor.professional.sessionDuration')}
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="sessionDuration"
                          name="sessionDuration"
                          type="number"
                          value={profileData.sessionDuration}
                          onChange={handleInputChange}
                          disabled={!isEditing || isLoading}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="consultationFee">
                        {t('settings:doctor.professional.consultationFee')}
                      </Label>
                      <Input 
                        id="consultationFee"
                        name="consultationFee"
                        type="number"
                        value={profileData.consultationFee}
                        onChange={handleInputChange}
                        disabled={!isEditing || isLoading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="available" className="block mb-2">{t('settings:doctor.professional.availability')}</Label>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="available"
                          checked={profileData.available}
                          onCheckedChange={(checked) => handleSwitchChange('available', checked)}
                          disabled={!isEditing || isLoading}
                        />
                        <Label htmlFor="available" className="cursor-pointer">
                          {profileData.available ? t('settings:doctor.professional.available') : t('settings:doctor.professional.notAvailable')}
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                {isEditing && (
                  <CardFooter className="justify-end space-x-2">
                    <Button 
                      variant="default" 
                      onClick={handleSaveProfile}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                          {t('settings:doctor.professional.saving')}
                        </div>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {t('settings:doctor.professional.saveChanges')}
                        </>
                      )}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </AnimatedSection>
          </TabsContent>
          
          <TabsContent value="settings">
            <AnimatedSection>
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings:title')}</CardTitle>
                  <CardDescription>
                    {t('settings:description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('settings:security.title')}</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">{t('settings:security.currentPassword')}</Label>
                      <Input 
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={securityData.currentPassword}
                        onChange={handleSecurityInputChange}
                        disabled={!isEditing || isLoading}
                        placeholder={t('settings:security.currentPasswordPlaceholder')}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">{t('settings:security.newPassword')}</Label>
                      <Input 
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={securityData.newPassword}
                        onChange={handleSecurityInputChange}
                        disabled={!isEditing || isLoading}
                        placeholder={t('settings:security.newPasswordPlaceholder')}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">{t('settings:security.confirmPassword')}</Label>
                      <Input 
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={securityData.confirmPassword}
                        onChange={handleSecurityInputChange}
                        disabled={!isEditing || isLoading}
                        placeholder={t('settings:security.confirmPasswordPlaceholder')}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium">{t('settings:notifications.title')}</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="emailNotifications">{t('settings:notifications.email')}</Label>
                        <p className="text-sm text-muted-foreground">{t('settings:notifications.emailDescription')}</p>
                      </div>
                      <Switch 
                        id="emailNotifications" 
                        checked={securityData.emailNotifications}
                        onCheckedChange={(checked) => handleSwitchChange('emailNotifications', checked)}
                        disabled={!isEditing || isLoading} 
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="smsNotifications">{t('settings:notifications.sms')}</Label>
                        <p className="text-sm text-muted-foreground">{t('settings:notifications.smsDescription')}</p>
                      </div>
                      <Switch 
                        id="smsNotifications" 
                        checked={securityData.smsNotifications}
                        onCheckedChange={(checked) => handleSwitchChange('smsNotifications', checked)}
                        disabled={!isEditing || isLoading} 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-muted-foreground" />
                      {t('settings:privacy.title')}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="profileVisibility">{t('settings:privacy.profileVisibility')}</Label>
                        <p className="text-sm text-muted-foreground">{t('settings:privacy.profileVisibilityDescription')}</p>
                      </div>
                      <Switch 
                        id="profileVisibility" 
                        checked={securityData.profileVisibility}
                        onCheckedChange={(checked) => handleSwitchChange('profileVisibility', checked)}
                        disabled={!isEditing || isLoading} 
                      />
                    </div>
                  </div>
                </CardContent>
                
                {isEditing && (
                  <CardFooter className="justify-between">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      disabled={isLoading}
                      onClick={() => {
                        toast({
                          title: t('settings:privacy.deleteAccountTitle'),
                          description: t('settings:privacy.deleteAccountDescription'),
                        });
                      }}
                    >
                      {t('settings:privacy.deleteAccount')}
                    </Button>
                    <Button 
                      variant="default"
                      onClick={handleSaveSettings}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                          {t('settings:privacy.saving')}
                        </div>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {t('settings:privacy.saveSettings')}
                        </>
                      )}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </AnimatedSection>
          </TabsContent>
        </Tabs>
      </div>
    </DoctorLayout>
  );
};

export default DoctorProfile;
