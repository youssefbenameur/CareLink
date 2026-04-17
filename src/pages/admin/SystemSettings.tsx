import { useState, useEffect } from "react";
import {
  Settings,
  Users,
  Server,
  Database,
  Shield,
  Mail,
  FileText,
  X,
  Check,
  Info,
  AlertCircle,
  TerminalSquare,
  BadgeInfo,
  Layers,
  Bell,
  Save,
  Code,
  RefreshCw,
  Globe,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AnimatedSection } from "@/components/ui/animated-section";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import systemSettingsService, {
  SystemSetting,
  SystemMetric,
} from "@/services/systemSettingsService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

const formatDateForChart = (date: Date) => {
  return format(date, "HH:mm");
};

const SystemSettings = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [currentTab, setCurrentTab] = useState("general");

  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { t } = useTranslation(["navigation"]);

  const getSetting = (name: string) => {
    return settings.find((setting) => setting.name === name);
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const fetchedSettings = await systemSettingsService.getSystemSettings();
        setSettings(fetchedSettings);

        // Apply settings to local state
        const maintenanceSetting = fetchedSettings.find(
          (s) => s.name === "maintenanceMode",
        );
        const debugSetting = fetchedSettings.find(
          (s) => s.name === "debugMode",
        );
        const notificationsSetting = fetchedSettings.find(
          (s) => s.name === "notificationsEnabled",
        );

        if (maintenanceSetting) setMaintenanceMode(maintenanceSetting.value);
        if (debugSetting) setDebugMode(debugSetting.value);
        if (notificationsSetting)
          setNotificationsEnabled(notificationsSetting.value);
      } catch (error) {
        console.error("Error loading settings:", error);
        toast({
          title: "Error loading settings",
          description: "Could not load system settings. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Subscribe to real-time updates
    const unsubscribe = systemSettingsService.subscribeToSettings(
      (updatedSettings) => {
        setSettings(updatedSettings);

        // Update local state when settings change
        const maintenanceSetting = updatedSettings.find(
          (s) => s.name === "maintenanceMode",
        );
        const debugSetting = updatedSettings.find(
          (s) => s.name === "debugMode",
        );
        const notificationsSetting = updatedSettings.find(
          (s) => s.name === "notificationsEnabled",
        );

        if (maintenanceSetting) setMaintenanceMode(maintenanceSetting.value);
        if (debugSetting) setDebugMode(debugSetting.value);
        if (notificationsSetting)
          setNotificationsEnabled(notificationsSetting.value);
      },
    );

    loadSettings();

    return () => {
      unsubscribe();
    };
  }, [toast]);

  const handleSaveSettings = async () => {
    setIsSaving(true);

    try {
      // Update maintenance mode
      const maintenanceSetting = getSetting("maintenanceMode");
      if (maintenanceSetting && maintenanceSetting.value !== maintenanceMode) {
        await systemSettingsService.updateSetting(
          maintenanceSetting.id!,
          maintenanceMode,
          currentUser?.uid || "system",
        );
      } else if (!maintenanceSetting) {
        // Create setting if it doesn't exist
        await systemSettingsService.createSetting(
          {
            name: "maintenanceMode",
            value: maintenanceMode,
            category: "general",
            description: "Enable maintenance mode",
          },
          currentUser?.uid || "system",
        );
      }

      // Update debug mode
      const debugSetting = getSetting("debugMode");
      if (debugSetting && debugSetting.value !== debugMode) {
        await systemSettingsService.updateSetting(
          debugSetting.id!,
          debugMode,
          currentUser?.uid || "system",
        );
      } else if (!debugSetting) {
        await systemSettingsService.createSetting(
          {
            name: "debugMode",
            value: debugMode,
            category: "advanced",
            description: "Enable debug mode",
          },
          currentUser?.uid || "system",
        );
      }

      // Update notifications
      const notificationsSetting = getSetting("notificationsEnabled");
      if (
        notificationsSetting &&
        notificationsSetting.value !== notificationsEnabled
      ) {
        await systemSettingsService.updateSetting(
          notificationsSetting.id!,
          notificationsEnabled,
          currentUser?.uid || "system",
        );
      } else if (!notificationsSetting) {
        await systemSettingsService.createSetting(
          {
            name: "notificationsEnabled",
            value: notificationsEnabled,
            category: "notifications",
            description: "Enable system notifications",
          },
          currentUser?.uid || "system",
        );
      }

      toast({
        title: "Settings saved",
        description: "Your system settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error saving settings",
        description: "Could not save system settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleValueChange = async (settingId: string, value: any) => {
    try {
      await systemSettingsService.updateSetting(
        settingId,
        value,
        currentUser?.uid || "system",
      );
      toast({
        title: "Setting updated",
        description: "The setting has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating setting:", error);
      toast({
        title: "Error updating setting",
        description: "Could not update the setting. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("navigation:admin.settings")}
          </h1>
          <p className="text-muted-foreground">
            Configure platform settings and system parameters
          </p>
        </div>

        <Tabs
          defaultValue="general"
          value={currentTab}
          onValueChange={setCurrentTab}
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-5 w-full md:w-auto">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <AnimatedSection>
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Basic configuration for the CareLink platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                      <Switch
                        id="maintenanceMode"
                        checked={maintenanceMode}
                        onCheckedChange={(checked) =>
                          setMaintenanceMode(checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="debugMode">Debug Mode</Label>
                      <Switch
                        id="debugMode"
                        checked={debugMode}
                        onCheckedChange={(checked) => setDebugMode(checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notificationsEnabled">
                        Notifications Enabled
                      </Label>
                      <Switch
                        id="notificationsEnabled"
                        checked={notificationsEnabled}
                        onCheckedChange={(checked) =>
                          setNotificationsEnabled(checked)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="systemName">System Name</Label>
                      <Input
                        type="text"
                        id="systemName"
                        defaultValue={
                          getSetting("systemName")?.value || "CareLink"
                        }
                        onBlur={(e) => {
                          const setting = getSetting("systemName");
                          if (setting) {
                            handleValueChange(setting.id!, e.target.value);
                          }
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="adminEmail">Admin Email</Label>
                      <Input
                        type="email"
                        id="adminEmail"
                        defaultValue={
                          getSetting("adminEmail")?.value ||
                          "admin@carelink.com"
                        }
                        onBlur={(e) => {
                          const setting = getSetting("adminEmail");
                          if (setting) {
                            handleValueChange(setting.id!, e.target.value);
                          }
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings} disabled={isSaving}>
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
                </CardFooter>
              </Card>
            </AnimatedSection>
          </TabsContent>

          <TabsContent value="security">
            <AnimatedSection>
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Configure security parameters for the CareLink platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="passwordPolicy">Password Policy</Label>
                      <Select>
                        <SelectTrigger id="passwordPolicy">
                          <SelectValue placeholder="Select a policy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="strong">
                            Strong (Recommended)
                          </SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="weak">Weak</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="sessionTimeout">
                        Session Timeout (minutes)
                      </Label>
                      <Slider
                        defaultValue={[30]}
                        max={120}
                        step={10}
                        onValueChange={(value) => {
                          const setting = getSetting("sessionTimeout");
                          if (setting) {
                            handleValueChange(setting.id!, value[0]);
                          }
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ipWhitelist">IP Whitelist</Label>
                      <Textarea
                        id="ipWhitelist"
                        placeholder="Enter whitelisted IP addresses, separated by commas"
                        defaultValue={getSetting("ipWhitelist")?.value || ""}
                        onBlur={(e) => {
                          const setting = getSetting("ipWhitelist");
                          if (setting) {
                            handleValueChange(setting.id!, e.target.value);
                          }
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings} disabled={isSaving}>
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
                </CardFooter>
              </Card>
            </AnimatedSection>
          </TabsContent>

          <TabsContent value="notifications">
            <AnimatedSection>
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Configure notification preferences for the CareLink platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="emailNotifications">
                        Email Notifications
                      </Label>
                      <Switch
                        id="emailNotifications"
                        checked={
                          getSetting("emailNotifications")?.value || true
                        }
                        onCheckedChange={(checked) => {
                          const setting = getSetting("emailNotifications");
                          if (setting) {
                            handleValueChange(setting.id!, checked);
                          }
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="smsNotifications">
                        SMS Notifications
                      </Label>
                      <Switch
                        id="smsNotifications"
                        checked={getSetting("smsNotifications")?.value || false}
                        onCheckedChange={(checked) => {
                          const setting = getSetting("smsNotifications");
                          if (setting) {
                            handleValueChange(setting.id!, checked);
                          }
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="defaultNotificationSound">
                        Default Notification Sound
                      </Label>
                      <Select>
                        <SelectTrigger id="defaultNotificationSound">
                          <SelectValue placeholder="Select a sound" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sound1">Sound 1</SelectItem>
                          <SelectItem value="sound2">Sound 2</SelectItem>
                          <SelectItem value="sound3">Sound 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings} disabled={isSaving}>
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
                </CardFooter>
              </Card>
            </AnimatedSection>
          </TabsContent>

          <TabsContent value="integrations">
            <AnimatedSection>
              <Card>
                <CardHeader>
                  <CardTitle>Integrations</CardTitle>
                  <CardDescription>
                    Manage third-party integrations for the CareLink platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="googleAnalytics">Google Analytics</Label>
                      <Input
                        type="text"
                        id="googleAnalytics"
                        placeholder="Enter your Google Analytics tracking ID"
                        defaultValue={
                          getSetting("googleAnalytics")?.value || ""
                        }
                        onBlur={(e) => {
                          const setting = getSetting("googleAnalytics");
                          if (setting) {
                            handleValueChange(setting.id!, e.target.value);
                          }
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="slackIntegration">
                        Slack Integration
                      </Label>
                      <Button variant="outline">Connect to Slack</Button>
                    </div>
                    <div>
                      <Label htmlFor="apiKeys">API Keys</Label>
                      <Table>
                        <TableCaption>List of active API keys</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">
                              Key Name
                            </TableHead>
                            <TableHead>Key Value</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">
                              Admin API
                            </TableCell>
                            <TableCell>
                              xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                <Code className="h-4 w-4 mr-2" />
                                View Key
                              </Button>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings} disabled={isSaving}>
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
                </CardFooter>
              </Card>
            </AnimatedSection>
          </TabsContent>

          <TabsContent value="advanced">
            <AnimatedSection>
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
                  <CardDescription>
                    Advanced configuration options for the CareLink platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="databaseBackup">Database Backup</Label>
                      <Button variant="outline">
                        <Database className="h-4 w-4 mr-2" />
                        Create Backup
                      </Button>
                    </div>
                    <div>
                      <Label htmlFor="systemLogs">System Logs</Label>
                      <Textarea
                        id="systemLogs"
                        placeholder="View system logs"
                        readOnly
                        defaultValue={
                          getSetting("systemLogs")?.value || "No logs available"
                        }
                        onBlur={(e) => {
                          const setting = getSetting("systemLogs");
                          if (setting) {
                            handleValueChange(setting.id!, e.target.value);
                          }
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="customCss">Custom CSS</Label>
                      <Textarea
                        id="customCss"
                        placeholder="Enter custom CSS to override default styles"
                        defaultValue={getSetting("customCss")?.value || ""}
                        onBlur={(e) => {
                          const setting = getSetting("customCss");
                          if (setting) {
                            handleValueChange(setting.id!, e.target.value);
                          }
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings} disabled={isSaving}>
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
                </CardFooter>
              </Card>
            </AnimatedSection>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default SystemSettings;
