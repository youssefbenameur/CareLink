import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
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
  Menu,
  LogOut,
  LayoutDashboard,
  Calendar,
  MessageSquare,
  UserSearch,
  BarChart2,
  Heart,
  Settings,
  User,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { MoonIcon, SunIcon } from "lucide-react";

const PatientSidebar = () => {
  const location = useLocation();
  const { logout, userData, currentUser } = useAuth();
  const { t } = useTranslation(["navigation", "common", "auth"]);
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const navigation = [
    {
      name: t("navigation:dashboard"),
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: t("navigation:findDoctor"),
      href: "/find-doctor",
      icon: <UserSearch className="h-5 w-5" />,
    },
    {
      name: t("navigation:appointments"),
      href: "/appointments",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      name: t("navigation:chat"),
      href: "/chat",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      name: t("navigation:moodTracker"),
      href: "/mood-tracker",
      icon: <BarChart2 className="h-5 w-5" />,
    },
    {
      name: t("navigation:profile"),
      href: "/profile",
      icon: <User className="h-5 w-5" />,
    },
    {
      name: t("navigation:settings"),
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const renderNavContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-4">
        <div className="flex items-center mb-6">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary">
              {userData?.name?.charAt(0) ||
                currentUser?.email?.charAt(0) ||
                "P"}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="font-medium text-sm">
              {userData?.name || t("common:patient")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("common:patient")}
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
                  {item.icon}
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
                  ? t("common:switchToLight")
                  : t("common:switchToDark")
              }
            >
              {theme === "dark" ? (
                <SunIcon className="h-4 w-4" />
              ) : (
                <MoonIcon className="h-4 w-4" />
              )}
            </Button>
            <LanguageSwitcher />
          </div>

          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={logout}
            size="icon"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">{t("auth:signOut")}</span>
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
              <SheetDescription>{t("common:patient")}</SheetDescription>
            </SheetHeader>
            {renderNavContent()}
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <span className="font-semibold">
            {userData?.name || t("common:patient")}
          </span>
          <Avatar className="h-8 w-8">
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
          {t("common:patientPortal")}
        </p>
      </div>
      {renderNavContent()}
    </div>
  );
};

export default PatientSidebar;
