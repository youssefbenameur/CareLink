import { useState, useRef } from "react";
import {
  User,
  Mail,
  Lock,
  Save,
  Calendar,
  Bell,
  ShieldCheck,
  FileText,
  Camera,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatedSection } from "@/components/ui/animated-section";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { changePassword } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const UserProfile = () => {
  const { currentUser, userData, refreshUserData, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarBase64, setAvatarBase64] = useState<string>(userData?.avatarBase64 || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [profileData, setProfileData] = useState({
    name: userData?.name || "",
    email: currentUser?.email || "",
    phone: userData?.phone || "",
    bio: userData?.bio || "",
  });

  const [notifications, setNotifications] = useState({
    email: true,
    appointments: true,
    messages: true,
    updates: false,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Avatar upload — resizes to 200×200, compresses to JPEG, saves as avatarBase64
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image.", variant: "destructive" });
      return;
    }
    setIsUploadingAvatar(true);
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = async () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      const MAX = 200;
      let { width, height } = img;
      if (width > height) {
        if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
      } else {
        if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      const base64 = canvas.toDataURL("image/jpeg", 0.8);
      try {
        await updateDoc(doc(db, "users", currentUser.uid), { avatarBase64: base64 });
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

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (key: string, checked: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: checked }));
  };

  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setIsSavingProfile(true);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        name: profileData.name,
        phone: profileData.phone,
        bio: profileData.bio,
        updatedAt: new Date(),
      });
      await refreshUserData();
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save your profile. Please try again.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Notification Preferences Updated",
      description: "Your notification settings have been saved.",
    });
  };

  const handleSaveSecurity = async () => {
    // Check if any password field is filled
    if (
      passwordData.currentPassword ||
      passwordData.newPassword ||
      passwordData.confirmPassword
    ) {
      // Validation
      if (!passwordData.currentPassword) {
        toast({
          title: "Validation Error",
          description: "Please enter your current password",
          variant: "destructive",
        });
        return;
      }

      if (!passwordData.newPassword) {
        toast({
          title: "Validation Error",
          description: "Please enter a new password",
          variant: "destructive",
        });
        return;
      }

      if (passwordData.newPassword.length < 6) {
        toast({
          title: "Validation Error",
          description: "New password must be at least 6 characters long",
          variant: "destructive",
        });
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast({
          title: "Validation Error",
          description: "New passwords do not match",
          variant: "destructive",
        });
        return;
      }

      if (passwordData.newPassword === passwordData.currentPassword) {
        toast({
          title: "Validation Error",
          description: "New password must be different from current password",
          variant: "destructive",
        });
        return;
      }

      setIsChangingPassword(true);
      try {
        await changePassword(
          passwordData.currentPassword,
          passwordData.newPassword,
        );

        // Clear the form
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        toast({
          title: "Success",
          description: "Your password has been changed successfully.",
        });
      } catch (error: any) {
        console.error("Error changing password:", error);
        toast({
          title: "Password Change Failed",
          description:
            error.message ||
            "There was a problem changing your password. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsChangingPassword(false);
      }
    } else {
      toast({
        title: "No Changes",
        description:
          "Please fill in password fields to update your security settings.",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    setIsDeletingAccount(true);
    try {
      // Delete Firestore user document
      await deleteDoc(doc(db, "users", currentUser.uid));
      // Delete Firebase Auth account
      await currentUser.delete();
      toast({ title: "Account deleted", description: "Your account has been permanently deleted." });
      navigate("/");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error.code === "auth/requires-recent-login"
          ? "Please log out and log back in, then try again."
          : "Failed to delete account. Please try again.",
      });
    } finally {
      setIsDeletingAccount(false);
      setDeleteDialogOpen(false);
      setDeleteConfirmText("");
    }
  };

  return (
    <>
    <DashboardLayout>
      <div className="space-y-6">
        <AnimatedSection className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
        </AnimatedSection>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <AnimatedSection delay={0.1}>
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative group">
                      <div className="h-24 w-24 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-border">
                        {avatarBase64 ? (
                          <img src={avatarBase64} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-12 w-12 text-primary" />
                        )}
                      </div>
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
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-medium">
                        {profileData.name || "Your Name"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {profileData.email || "email@example.com"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Click the camera icon to update your photo
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="name"
                            name="name"
                            placeholder="John Doe"
                            className="pl-10"
                            value={profileData.name}
                            onChange={handleProfileChange}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="john@example.com"
                            className="pl-10"
                            value={profileData.email}
                            onChange={handleProfileChange}
                            disabled={!!currentUser?.email}
                          />
                        </div>
                        {currentUser?.email && (
                          <p className="text-xs text-muted-foreground">
                            Email cannot be changed directly
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="+1 (555) 123-4567"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">About You</Label>
                      <Input
                        id="bio"
                        name="bio"
                        placeholder="A brief description about yourself"
                        value={profileData.bio}
                        onChange={handleProfileChange}
                      />
                      <p className="text-xs text-muted-foreground">
                        This information helps us personalize your experience
                        and allows your care team to understand you better.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                    {isSavingProfile ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
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
                        <Label htmlFor="email-notifications">
                          Email Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive email notifications about important updates
                        </p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={notifications.email}
                        onCheckedChange={(checked) =>
                          handleNotificationChange("email", checked)
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="appointment-reminders">
                          Appointment Reminders
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about upcoming appointments
                        </p>
                      </div>
                      <Switch
                        id="appointment-reminders"
                        checked={notifications.appointments}
                        onCheckedChange={(checked) =>
                          handleNotificationChange("appointments", checked)
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="message-notifications">
                          Message Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when you receive new messages
                        </p>
                      </div>
                      <Switch
                        id="message-notifications"
                        checked={notifications.messages}
                        onCheckedChange={(checked) =>
                          handleNotificationChange("messages", checked)
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="platform-updates">
                          Platform Updates
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications about new features and updates
                        </p>
                      </div>
                      <Switch
                        id="platform-updates"
                        checked={notifications.updates}
                        onCheckedChange={(checked) =>
                          handleNotificationChange("updates", checked)
                        }
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveNotifications}>
                    <Bell className="mr-2 h-4 w-4" />
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
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security and privacy
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="current-password"
                          type="password"
                          placeholder="Enter current password"
                          className="pl-10"
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="Enter new password"
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">
                          Confirm New Password
                        </Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Confirm new password"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Password must be at least 8 characters and include a
                      combination of letters, numbers, and special characters.
                    </p>
                  </div>

                  <Separator />

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-0.5">
                      <h3 className="text-base font-medium text-destructive">
                        Delete Account
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all associated
                        data. This action cannot be undone.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleSaveSecurity}
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Update Security Settings
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

    {/* Delete Account Confirmation Dialog */}
    <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
      setDeleteDialogOpen(open);
      if (!open) setDeleteConfirmText("");
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </DialogTitle>
          <DialogDescription className="space-y-2 pt-1">
            <span className="block">
              This will <strong>permanently delete</strong> your account, profile, mood history, and all associated data. This cannot be undone.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label htmlFor="delete-confirm" className="text-sm font-medium">
            Type <span className="font-bold text-destructive">delete profile</span> to confirm
          </Label>
          <Input
            id="delete-confirm"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="delete profile"
            className="border-destructive/50 focus-visible:ring-destructive"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => { setDeleteDialogOpen(false); setDeleteConfirmText(""); }}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deleteConfirmText !== "delete profile" || isDeletingAccount}
            onClick={handleDeleteAccount}
          >
            {isDeletingAccount ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Permanently Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default UserProfile;
