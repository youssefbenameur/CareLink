import { useState, useEffect } from "react";
import { Settings, Save, RefreshCw, Globe, Mail, Users, UserCheck, ShieldCheck } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AnimatedSection } from "@/components/ui/animated-section";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface GlobalSettings {
  platformName: string;
  adminContact: string;
  allowPatientRegistration: boolean;
  allowDoctorRegistration: boolean;
  requireDoctorApproval: boolean;
}

const DEFAULTS: GlobalSettings = {
  platformName: "CareLink",
  adminContact: "admin@carelink.com",
  allowPatientRegistration: true,
  allowDoctorRegistration: true,
  requireDoctorApproval: true,
};

const SystemSettings = () => {
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULTS);
  const [saved, setSaved] = useState<GlobalSettings>(DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const snap = await getDoc(doc(db, "systemConfig", "global"));
        if (snap.exists()) {
          const data = { ...DEFAULTS, ...(snap.data() as Partial<GlobalSettings>) };
          setSettings(data);
          setSaved(data);
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

  const isDirty = JSON.stringify(settings) !== JSON.stringify(saved);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "systemConfig", "global"), {
        ...settings,
        updatedAt: new Date(),
        updatedBy: currentUser?.uid ?? "system",
      });
      setSaved(settings);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
            <p className="text-muted-foreground">
              Configure how the platform behaves. Changes take effect immediately after saving.
            </p>
          </div>
          {isDirty && (
            <Badge variant="outline" className="text-amber-600 border-amber-400">
              Unsaved changes
            </Badge>
          )}
        </div>

        {/* Platform Identity */}
        <AnimatedSection>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Platform Identity
              </CardTitle>
              <CardDescription>
                Basic information about this CareLink instance
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
                <p className="text-xs text-muted-foreground">
                  Displayed in the sidebar and email notifications.
                </p>
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
                  Shown to users who need to contact support.
                </p>
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Registration Control */}
        <AnimatedSection delay={0.05}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Registration Control
              </CardTitle>
              <CardDescription>
                Control who can sign up on the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allowPatientReg">Allow Patient Registration</Label>
                  <p className="text-sm text-muted-foreground">
                    When off, new patients cannot create accounts.
                  </p>
                </div>
                <Switch
                  id="allowPatientReg"
                  checked={settings.allowPatientRegistration}
                  onCheckedChange={(v) => handleChange("allowPatientRegistration", v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allowDoctorReg">Allow Doctor Registration</Label>
                  <p className="text-sm text-muted-foreground">
                    When off, new healthcare providers cannot apply.
                  </p>
                </div>
                <Switch
                  id="allowDoctorReg"
                  checked={settings.allowDoctorRegistration}
                  onCheckedChange={(v) => handleChange("allowDoctorRegistration", v)}
                />
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Doctor Verification */}
        <AnimatedSection delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Doctor Verification
              </CardTitle>
              <CardDescription>
                Control how doctor accounts are approved
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="requireApproval">Require Manual Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    When on, every new doctor must be reviewed and approved by an admin before accessing the platform. Turning this off auto-approves all new doctors.
                  </p>
                </div>
                <Switch
                  id="requireApproval"
                  checked={settings.requireDoctorApproval}
                  onCheckedChange={(v) => handleChange("requireDoctorApproval", v)}
                />
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Save */}
        <AnimatedSection delay={0.15}>
          <Button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </AnimatedSection>
      </div>
    </AdminLayout>
  );
};

export default SystemSettings;
