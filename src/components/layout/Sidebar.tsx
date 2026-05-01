import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  UserSearch,
  BarChart2,
  Heart,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { MoonIcon, SunIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Sidebar = () => {
  const location = useLocation();
  const { logout, userData } = useAuth();
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "Find Doctor",
      href: "/find-doctor",
      icon: <UserSearch className="h-5 w-5" />,
    },
    {
      name: "Appointments",
      href: "/appointments",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      name: "Chat",
      href: "/chat",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      name: "Mood Tracker",
      href: "/mood-tracker",
      icon: <BarChart2 className="h-5 w-5" />,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const renderNavContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-4">
        <div className="flex items-center mb-6">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary">
              {userData?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("") || "P"}
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
            const isActiveRoute = isActive(item.href);
            return (
              <Button
                key={item.href}
                variant={isActiveRoute ? "default" : "ghost"}
                className={`w-full justify-start ${isActiveRoute ? "bg-primary text-primary-foreground" : ""}`}
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
            <AvatarFallback className="bg-primary">
              {userData?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("") || "P"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-r bg-card">
      <div className="p-4 border-b">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-semibold">CL</span>
          </div>
          <span className="text-xl font-bold">CareLink</span>
        </Link>
      </div>

      {renderNavContent()}
    </div>
  );
};

export default Sidebar;
