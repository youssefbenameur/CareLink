
import { Calendar, MessageSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "@/components/ui/animated-section";
  doctorName: string;
  onViewCalendar: () => void;
  onPatientMessages: () => void;
}

export const DashboardHeader = ({ doctorName, onViewCalendar, onPatientMessages }: DashboardHeaderProps) => {
  return (
    <AnimatedSection className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 bg-white/50 backdrop-blur-sm p-4 rounded-lg border border-neutral-200/50">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Doctor Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {doctorName}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
        <Button variant="outline" onClick={onViewCalendar} className="w-full sm:w-auto" size="sm">
          <Calendar className="mr-2 h-4 w-4" />
          View Calendar
        </Button>
        <Button onClick={onPatientMessages} className="w-full sm:w-auto" size="sm">
          <MessageSquare className="mr-2 h-4 w-4" />
          Patient Messages
        </Button>
      </div>
    </AnimatedSection>
  );
};
