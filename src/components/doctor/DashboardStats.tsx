
import { Users, Calendar, MessageSquare, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedSection } from "@/components/ui/animated-section";

interface StatsProps {
  stats: {
    totalPatients: number;
    newPatientsThisMonth: number;
    todayAppointments: number;
    completedToday: number;
    pendingMessages: number;
    attentionRequired: number;
  };
}

export const DashboardStats = ({ stats }: StatsProps) => {
  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
      <AnimatedSection delay={0.1}>
        <Card className="bg-white/50 backdrop-blur-sm border-neutral-200/50">
          <CardHeader className="p-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-primary/70" />
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{stats.newPatientsThisMonth} new this month
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection delay={0.2}>
        <Card className="bg-white/50 backdrop-blur-sm border-neutral-200/50">
          <CardHeader className="p-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-primary/70" />
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completedToday} completed, {stats.todayAppointments - stats.completedToday} remaining
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection delay={0.3}>
        <Card className="bg-white/50 backdrop-blur-sm border-neutral-200/50">
          <CardHeader className="p-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Pending Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-primary/70" />
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold">{stats.pendingMessages}</div>
            <p className="text-xs text-muted-foreground mt-1">
              from {Math.min(stats.pendingMessages, 3)} patients
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>
    </div>
  );
};
