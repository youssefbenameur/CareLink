import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  LogOut,
  LayoutDashboard,
  Calendar,
  MessageSquare,
  UserSearch,
  BarChart2,
  User,
  Bell,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { MoonIcon, SunIcon } from "lucide-react";
import { useNavBadges } from "@/hooks/useNavBadges";
import { useNotifications } from "@/contexts/NotificationContext";

const PatientSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, userData, currentUser } = useAuth();
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();
  const badges = useNavBadges();
  const { notifications, unreadCount: totalUnread, markAsRead, markAllAsRead } = useNotifications();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleNotifClick = async (notif: any) => {
    await markAsRead(notif.id);
    if (notif.actionUrl) navigate(notif.actionUrl);
  };

  const appointmentNotifCount = notifications.filter(n => n.actionUrl === '/appointments').length;

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      badge: 0,
    },
    {
      name: "Find Doctor",
      href: "/find-doctor",
      icon: <UserSearch className="h-5 w-5" />,
      badge: 0,
    },
    {
      name: "Appointments",
      href: "/appointments",
      icon: <Calendar className="h-5 w-5" />,
      badge: appointmentNotifCount,
    },
    {
      name: "Chat",
      href: "/chat",
      icon: <MessageSquare className="h-5 w-5" />,
      badge: badges.unreadMessages,
    },
    {
      name: "Mood Tracker",
      href: "/mood-tracker",
      icon: <BarChart2 className="h-5 w-5" />,
      badge: 0,
    },
    {
      name: "Profile Settings",
      href: "/profile",
      icon: <User className="h-5 w-5" />,
      badge: 0,
    },
  ];

  const renderNavContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-4">
        <div className="flex items-center mb-6">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userData?.avatarBase64} />
            <AvatarFallback className="bg-primary">
              {userData?.name?.charAt(0) ||
                currentUser?.email?.charAt(0) ||
                "P"}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="font-medium text-sm">
              {userData?.name || "Patient"}
            </p>
            <p className="text-xs text-muted-foreground">
              Patient
            </p>
          </div>
        </div>

        <nav className="space-y-2 mb-6">
          {navigation.map((item) => {
            const isActive =
              location.pathname === item.href ||
              location.pathname.startsWith(`${item.href}/`);
            return (
              <Button
                key={item.href}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive ? "bg-primary text-primary-foreground" : "",
                )}
                asChild
              >
                <Link to={item.href}>
                  {/* Icon with superscript badge - only shows when count > 0 */}
                  <span className="relative shrink-0">
                    {item.icon}
                    {item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-sm">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </span>
                  <span className="ml-3">{item.name}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 space-y-4">
        <Separator />
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8"
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              {theme === "dark" ? (
                <SunIcon className="h-4 w-4" />
              ) : (
                <MoonIcon className="h-4 w-4" />
              )}
            </Button>

            {/* Notification Bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                  <Bell className="h-4 w-4" />
                  {totalUnread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-sm">
                      {totalUnread > 99 ? "99+" : totalUnread}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-[480px] overflow-y-auto">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm font-semibold">Notifications</span>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline focus:outline-none"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No new notifications
                  </div>
                ) : (
                  notifications.slice(0, 8).map((notif) => (
                    <DropdownMenuItem
                      key={notif.id}
                      className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                      onClick={() => handleNotifClick(notif)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span
                          className={cn(
                            "w-2.5 h-2.5 rounded-full shrink-0",
                            notif.type === "success" && "bg-green-500",
                            notif.type === "error" && "bg-red-500",
                            notif.type === "warning" && "bg-yellow-500",
                            notif.type === "info" && "bg-blue-500",
                          )}
                        />
                        <span className="font-medium text-sm">{notif.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground pl-4 leading-snug">
                        {notif.message}
                      </p>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={logout}
            size="icon"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sign Out</span>
          </Button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed top-0 left-0 right-0 p-2 flex items-center justify-between bg-background z-50 border-b">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="px-4 py-2">
              <SheetTitle>CareLink</SheetTitle>
              <SheetDescription>Patient</SheetDescription>
            </SheetHeader>
            {renderNavContent()}
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <span className="font-semibold">
            {userData?.name || "Patient"}
          </span>
          <Avatar className="h-8 w-8">
            <AvatarImage src={userData?.avatarBase64} />
            <AvatarFallback className="bg-primary">
              {userData?.name?.charAt(0) ||
                currentUser?.email?.charAt(0) ||
                "P"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full border-r bg-card flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">CareLink</h2>
        <p className="text-xs text-muted-foreground">
          Patient Portal
        </p>
      </div>
      {renderNavContent()}
    </div>
  );
};

export default PatientSidebar;
