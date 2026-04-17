import { Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const PendingApproval = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card text-card-foreground rounded-xl border shadow-sm p-8 text-center space-y-6">
        <div className="flex justify-center">
          <Clock className="h-16 w-16 text-amber-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Your application is under review
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            We're reviewing your credentials. This process typically takes 3–5
            business days. You'll receive an email notification once a decision
            has been made.
          </p>
        </div>
        <Button variant="outline" onClick={logout} className="w-full">
          Sign out
        </Button>
      </div>
    </div>
  );
};

export default PendingApproval;
