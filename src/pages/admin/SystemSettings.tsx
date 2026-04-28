import { useState, useEffect } from "react";
import { Settings, Bell, Save, RefreshCw, Globe, Mail, Wrench } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AnimatedSection } from "@/components/ui/animated-section";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";

// Firestore document path for system settings
const SETTINGS_DOC = "systemConfig/global";

interface GlobalSettings {
  platformName: string;
  adminContact: string;
  maintenanceMode: boolean;
  emailNotificationsEnabled: boolean;
  appointmentRemindersEnabled: boolean;
}

const DEFAULTS: GlobalSettings = {
  platformName: "CareLink",
  adminContact: "admin@carelink.com",
  maintenanceMode: false,
  emailNotificationsEnabled: true,
  appointmentRemindersEnabled: true,
};

const SystemSettings = () => {
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { t } = useTranslation(["navigation"]);

  // Load settings from Firestore on mount
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const snap = await getDoc(doc(db, "systemConfig", "global"));
        if (snap.exists()) {
          setSettings({ ...DEFAULTS, ...(snap.data() as Partial<GlobalSettings>) });
        }
      } catch (err) {
        console.error("Error loading system settings:", err);
        toast({
          title: "Error loading settings",
          description: "Could not load system settings. Defaults shown.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [toast]);

  const handleChange = <K extends keyof GlobalSettings>(key: K, value: GlobalSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "systemConfig", "global"), {
        ...settings,
        updatedAt: new Date(),
        updatedBy: currentUser?.uid ?? "system",
      });
      toast({
        title: "Settings saved",
        description: "System settings have been updated successfully.",
      });
    } catch (err) {
      console.error("Error saving system settings:", err);
      toast({
        title: "Error saving settings",
        description: "Could not save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("navigation:admin.settings")}
          </h1>
          <p className="text-muted-foreground">
            Configure platform settings. All changes are saved to Firestore.
          </p>
        </div>

        {/* Platform */}
        <AnimatedSection>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Platform
              </CardTitle>
              <CardDescription>
                Basic identity settings for the CareLink platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platformName">Platform Name</Label>
                <Input
                  id="platformName"
                  value={settings.platformName}
                  onChange={(e) => handleChange("platformName", e.target.value)}
                  placeholder="CareLink"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminContact">Admin Contact Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="adminContact"
                    type="email"
                    className="pl-9"
                    value={settings.adminContact}
                    onChange={(e) => handleChange("adminContact", e.target.value)}
                    placeholder="admin@carelink.com"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Used for system alerts and doctor approval notifications.
                </p>
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Maintenance */}
        <AnimatedSection delay={0.05}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Maintenance
              </CardTitle>
              <CardDescription>
                Control platform availability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, the platform shows a maintenance notice to all users.
                  </p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onCheckedChange={(v) => handleChange("maintenanceMode", v)}
                />
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Notifications */}
        <AnimatedSection delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </CardTitle>
              <CardDescription>
                Control which automated notifications the platform sends
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email notifications for appointment confirmations and cancellations.
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.emailNotificationsEnabled}
                  onCheckedChange={(v) => handleChange("emailNotificationsEnabled", v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="appointmentReminders">Appointment Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Send reminder notifications to patients before scheduled appointments.
                  </p>
                </div>
                <Switch
                  id="appointmentReminders"
                  checked={settings.appointmentRemindersEnabled}
                  onCheckedChange={(v) => handleChange("appointmentRemindersEnabled", v)}
                />
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Save */}
        <AnimatedSection delay={0.15}>
          <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save All Settings
              </>
            )}
          </Button>
        </AnimatedSection>
      </div>
    </AdminLayout>
  );
};

export default SystemSettings;
