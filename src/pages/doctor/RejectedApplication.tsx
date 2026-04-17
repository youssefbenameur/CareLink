import { XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const RejectedApplication = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card text-card-foreground rounded-xl border shadow-sm p-8 text-center space-y-6">
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
            For assistance, please contact us at{" "}
            <a
              href="mailto:support@carelink.com"
              className="text-primary underline underline-offset-4"
            >
              support@carelink.com
            </a>
          </p>
        </div>
        <Button variant="outline" onClick={logout} className="w-full">
          Sign out
        </Button>
      </div>
    </div>
  );
};

export default RejectedApplication;
