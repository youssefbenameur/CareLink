import { useEffect, useState } from "react";
import { XCircle, Mail, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RejectedApplication = () => {
  const { logout, currentUser } = useAuth();
  const { notifications, markAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  // Show notifications if there are any
  useEffect(() => {
    if (notifications.length > 0) {
      setShowNotifications(true);
    }
  }, [notifications]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        {/* Notifications */}
        {showNotifications && notifications.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-red-800 flex items-center gap-2">
                <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                Notifications ({notifications.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.map((notification) => (
                <div key={notification.id} className="bg-white p-3 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAsRead(notification.id!)}
                      className="h-6 px-2 text-xs"
                    >
                      Mark read
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Main rejection message */}
        <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-8 text-center space-y-6">
          <div className="flex justify-center">
            <XCircle className="h-16 w-16 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">
              Application not approved
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Unfortunately, your application was not approved. This may be due
              to incomplete or unverifiable credentials.
            </p>
            <p className="text-muted-foreground text-sm">
              For assistance or to reapply, please contact our support team.
            </p>
          </div>

          {/* Contact options */}
          <div className="space-y-3">
            <Button
              variant="default"
              className="w-full"
              onClick={() => window.location.href = 'mailto:support@carelink.tn'}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email Support
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = 'tel:+216-71-123-456'}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Call Support
            </Button>
          </div>

          <Button variant="outline" onClick={logout} className="w-full">
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RejectedApplication;
