import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  appointmentService,
  convertToDate,
} from "@/services/appointmentService";
import { moodTrackerService } from "@/services/moodTracker";
import { userService } from "@/services/userService";
import { activityService } from "@/services/activityService";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MessageSquare,
  TrendingUp,
  User,
  FileText,
  ArrowRight,
  Smile,
  Star,
  BookOpen,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useIsMobile } from "@/hooks/use-mobile";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data, loading } = useDashboardData();
  const isMobile = useIsMobile();
  const [localData, setLocalData] = useState({
    appointments: [],
    latestMood: null,
    hasLoggedMoodToday: false,
    doctors: [],
    recentActivities: [],
  });

  // Scroll to top when dashboard loads
  useEffect(() => {
    const main = document.querySelector('main');
    if (main) {
      main.scrollTop = 0;
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;

      try {
        const upcomingAppointments =
          await appointmentService.getUpcomingAppointments(currentUser.uid);
        const latestMoodEntry = await moodTrackerService.getLatestMoodEntry(
          currentUser.uid,
        );
        const moodLoggedToday = await moodTrackerService.hasLoggedMoodToday(
          currentUser.uid,
        );
        const assignedDoctors = await userService.getAssignedDoctors(
          currentUser.uid,
        );
        const activities = await activityService.getUserActivities(
          currentUser.uid,
          5,
        );

        setLocalData({
          appointments: upcomingAppointments,
          latestMood: latestMoodEntry,
          hasLoggedMoodToday: moodLoggedToday,
          doctors: assignedDoctors,
          recentActivities: activities,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load data",
        });
      }
    };

    fetchDashboardData();
  }, [currentUser, toast]);

  const formatAppointmentDate = (date) => {
    try {
      return format(convertToDate(date), "PPP");
    } catch (error) {
      console.error("Error formatting date:", error, date);
      return "Invalid date";
    }
  };

  const formatAppointmentTime = (date) => {
    try {
      return format(convertToDate(date), "p");
    } catch (error) {
      console.error("Error formatting time:", error, date);
      return "Invalid time";
    }
  };

  const logActivity = async (type, description) => {
    if (!currentUser) return;

    try {
      await activityService.createActivity({
        userId: currentUser.uid,
        type,
        description,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Patient Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome, {currentUser?.displayName || "Patient"}
          </p>
        </div>

        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-12">
          <div className="col-span-1 md:col-span-12 space-y-6">
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 xl:grid-cols-3">
              {/* Mood Trend Card */}
              <Card className="col-span-1 sm:col-span-1">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="flex text-sm md:text-base justify-between">
                    <span>Mood Trend</span>
                    <TrendingUp className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center p-4 pt-2">
                  {loading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : data.moodTrend ? (
                    <>
                      <h3 className="text-xl md:text-2xl font-bold">
                        {data.moodTrend.currentMood}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">
                        {data.moodTrend.trend === "up"
                          ? "+"
                          : data.moodTrend.trend === "down"
                            ? "-"
                            : ""}
                        {data.moodTrend.percentage}% from last week
                      </p>
                      <Progress
                        value={
                          data.moodTrend.trend === "up"
                            ? 70
                            : data.moodTrend.trend === "down"
                              ? 30
                              : 50
                        }
                        className="h-1.5 mt-2"
                      />
                    </>
                  ) : (
                    <div className="py-2 text-muted-foreground">
                      No mood data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Next Session Card */}
              <Card className="col-span-1 sm:col-span-1">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="flex text-sm md:text-base justify-between">
                    <span>Next Session</span>
                    <Calendar className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center p-4 pt-2">
                  {loading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : data.nextSession ? (
                    <>
                      <h3 className="text-lg md:text-xl font-bold">
                        {format(data.nextSession.date, "MMM d")}
                      </h3>
                      <p className="text-sm font-medium">
                        {format(data.nextSession.date, "p")}
                      </p>
                      <div className="flex items-center justify-center mt-1 gap-1 text-xs text-muted-foreground">
                        <span>{`with ${data.nextSession.doctorName}`}</span>
                      </div>
                    </>
                  ) : (
                    <div className="py-2 text-muted-foreground">
                      No upcoming appointments
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Streak Card */}
              <Card className="col-span-1 sm:col-span-1">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="flex text-sm md:text-base justify-between">
                    <span>Check-in Streak</span>
                    <Star className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center p-4 pt-2">
                  {loading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : data.streak ? (
                    <>
                      <h3 className="text-xl md:text-2xl font-bold">
                        {data.streak.days} days
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">
                        Consecutive check-ins
                      </p>
                      <div className="flex justify-center space-x-1 mt-2">
                        {data.streak.entries.map((entry, i) => (
                          <div
                            key={i}
                            className={`h-2 w-2 rounded-full ${entry ? "bg-primary" : "bg-muted"}`}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="py-2 text-muted-foreground">
                      Start your streak today
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
              {/* Today's Mood Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Mood</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : localData.hasLoggedMoodToday ? (
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Smile className="h-6 sm:h-8 w-6 sm:w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {localData.latestMood
                            ? moodTrackerService.getMoodText(
                                localData.latestMood.mood,
                              )
                            : "Unknown"}
                        </h3>
                        {localData.latestMood?.notes && (
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {localData.latestMood.notes}
                          </p>
                        )}
                        <Button
                          variant="link"
                          className="p-0 h-6"
                          onClick={() => navigate("/mood-tracker")}
                        >
                          View History
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-2">
                        How are you feeling today?
                      </p>
                      <Button onClick={() => navigate("/mood-tracker")}>
                        Track Mood
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Appointments Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : localData.appointments.length > 0 ? (
                    <div className="space-y-4">
                      {localData.appointments.slice(0, 2).map((appointment) => {
                        const doctor = localData.doctors.find((d: any) => d.id === appointment.doctorId || d.uid === appointment.doctorId);
                        return (
                        <div
                          key={appointment.id}
                          className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={doctor?.avatarBase64} alt={appointment.doctorName} />
                              <AvatarFallback>
                                {appointment.doctorName
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("") || "DR"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-xs sm:text-sm">
                                {appointment.doctorName || "Doctor"}
                              </p>
                              <div className="flex flex-col sm:flex-row sm:items-center text-[10px] sm:text-xs text-muted-foreground">
                                <div className="flex items-center">
                                  <Calendar className="mr-1 h-3 w-3" />
                                  <span className="truncate">
                                    {formatAppointmentDate(appointment.date)}
                                  </span>
                                </div>
                                <div className="flex items-center sm:ml-2">
                                  <Clock className="mr-1 h-3 w-3" />
                                  <span>
                                    {formatAppointmentTime(appointment.date)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant={
                              appointment.status === "scheduled"
                                ? "default"
                                : "outline"
                            }
                            className="text-[10px]"
                          >
                            {appointment.status}
                          </Badge>
                        </div>
                      );})}

                      <Button
                        variant="link"
                        className="px-0"
                        onClick={() => {
                          logActivity(
                            "navigation",
                            "Viewed all appointments",
                          );
                          navigate("/appointments");
                        }}
                      >
                        View All Appointments
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-2">
                        No upcoming appointments
                      </p>
                      <Button
                        onClick={() => {
                          logActivity("navigation", "Scheduled an appointment");
                          navigate("/appointments");
                        }}
                      >
                        Schedule Appointment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Care Team Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Care Team</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : localData.doctors.length > 0 ? (
                    <div className="space-y-4">
                      {localData.doctors.map((doctor) => (
                        <div
                          key={doctor.uid}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={doctor.avatarBase64} alt={doctor.name} />
                              <AvatarFallback>
                                {doctor.name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("") || "DR"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-xs sm:text-sm">
                                {doctor.name}
                              </p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">
                                {doctor.specialty || doctor.specialization || "Healthcare Provider"}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => {
                              logActivity(
                                "message",
                                `Started a conversation with Dr. ${doctor.name}`,
                              );
                              navigate(`/chat/${doctor.uid}`);
                            }}
                          >
                            <MessageSquare className="mr-1 h-3 w-3" />
                            Chat
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">
                        No healthcare providers assigned yet
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity Card */}
            <Card>
              <CardHeader className="p-4">
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest actions and updates
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : localData.recentActivities.length > 0 ? (
                  <div className="space-y-4">
                    {localData.recentActivities.map((activity) => {
                      const activityDate = convertToDate(activity.timestamp);

                      return (
                        <div
                          key={activity.id}
                          className="flex items-start space-x-3"
                        >
                          <div className="mt-0.5 bg-primary/10 p-1.5 rounded-full">
                            {activity.type === "appointment" ? (
                              <Calendar className="h-4 w-4" />
                            ) : activity.type === "mood" ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : activity.type === "message" ? (
                              <MessageSquare className="h-4 w-4" />
                            ) : activity.type === "profile" ? (
                              <User className="h-4 w-4" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm">
                              {activity.description}
                            </p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                              {format(activityDate, "PPp")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No recent activity to show
                  </p>
                )}
              </CardContent>
            </Card>

            {/* AI Assistant Card */}
            <Card className="col-span-1">
              <CardHeader className="p-4">
                <CardTitle>AI Assistant</CardTitle>
                <CardDescription>
                  Get help with common questions and support
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div
                  className={`border-t ${isMobile ? "h-[400px]" : "h-[500px]"}`}
                >
                  <ChatWindow />
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-2 flex justify-end">
                <Button onClick={() => navigate("/chat")}>
                  Continue conversation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
