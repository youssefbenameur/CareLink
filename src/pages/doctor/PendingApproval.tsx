import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PendingApproval = () => {
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
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
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

        {/* Main pending message */}
        <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-8 text-center space-y-6">
          <div className="flex justify-center">
            <Clock className="h-16 w-16 text-amber-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">
              Your application is under review
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              We're reviewing your credentials. This process typically takes 3–5
              business days. You'll receive a notification once a decision
              has been made.
            </p>
          </div>
          <Button variant="outline" onClick={logout} className="w-full">
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
