import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import LogoutButton from "@/components/auth/LogoutButton";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetClose,
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
import { Menu, Bell } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useNavBadges } from "@/hooks/useNavBadges";
import { useNotifications } from "@/contexts/NotificationContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Import icons directly to avoid circular dependency issues
import {
  Home,
  Users,
  MessageSquare,
  Calendar,
  FileText,
  UserCircle,
} from "lucide-react";

const DoctorSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const { t } = useTranslation(["navigation", "common"]);
  const isMobile = useIsMobile();
  const badges = useNavBadges();
  const { notifications, unreadCount: totalUnread, markAsRead, markAllAsRead } = useNotifications();

  const handleNotifClick = async (notif: any) => {
    await markAsRead(notif.id);
    if (notif.actionUrl) navigate(notif.actionUrl);
  };

  const navItems = [
    {
      name: t("navigation:dashboard"),
      href: "/doctor/dashboard",
      icon: <Home className="h-5 w-5" />,
      badge: 0,
    },
    {
      name: t("navigation:patients"),
      href: "/doctor/patients",
      icon: <Users className="h-5 w-5" />,
      badge: 0,
    },
    {
      name: t("navigation:chat"),
      href: "/doctor/chat",
      icon: <MessageSquare className="h-5 w-5" />,
      badge: badges.unreadPatientMessages,
    },
    {
      name: t("navigation:appointments"),
      href: "/doctor/appointments",
      icon: <Calendar className="h-5 w-5" />,
      badge: badges.pendingAppointmentRequests,
    },
    {
      name: t("navigation:medicalRecords"),
      href: "/doctor/medical-records",
      icon: <FileText className="h-5 w-5" />,
      badge: 0,
    },
    {
      name: t("navigation:profile"),
      href: "/doctor/profile",
      icon: <UserCircle className="h-5 w-5" />,
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
                "D"}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="font-medium text-sm">
              {userData?.name || t("common:doctor")}
            </p>
            <p className="text-xs text-muted-foreground">
              {userData?.specialty || userData?.specialization || t("common:doctor")}
            </p>
          </div>
        </div>

        <nav className="space-y-2 mb-6">
          {navItems.map((item) => {
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
            <ThemeToggle />

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
                        <span className={cn(
                          "w-2.5 h-2.5 rounded-full shrink-0",
                          notif.type === "success" && "bg-green-500",
                          notif.type === "error" && "bg-red-500",
                          notif.type === "warning" && "bg-yellow-500",
                          notif.type === "info" && "bg-blue-500",
                        )} />
                        <span className="font-medium text-sm">{notif.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground pl-4 leading-snug">{notif.message}</p>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <LogoutButton />
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
              <SheetDescription>
                {t("navigation:doctorPortal")}
              </SheetDescription>
            </SheetHeader>
            {renderNavContent()}
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <span className="font-semibold">
            {userData?.name || t("common:doctor")}
          </span>
          <Avatar className="h-8 w-8">
            <AvatarImage src={userData?.avatarBase64} />
            <AvatarFallback className="bg-primary">
              {userData?.name?.charAt(0) || currentUser?.email?.charAt(0) || "D"}
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
          {t("navigation:doctorPortal")}
        </p>
      </div>

      {renderNavContent()}
    </div>
  );
};

export default DoctorSidebar;
