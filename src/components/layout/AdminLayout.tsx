import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  ClipboardCheck,
  TicketCheck,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useNavBadges } from "@/hooks/useNavBadges";
import { useIsMobile } from "@/hooks/use-mobile";
import ThemeToggle from "@/components/ThemeToggle";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const badges = useNavBadges();
  const isMobile = useIsMobile();

  // Admin uses localStorage-based auth, not Firebase Auth.
  // Logout simply clears the flag and redirects to the admin login page.
  const handleAdminLogout = () => {
    localStorage.removeItem("adminAccess");
    navigate("/admin/login", { replace: true });
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      badge: 0,
    },
    {
      name: "Manage Users",
      href: "/admin/users",
      icon: <Users className="h-5 w-5" />,
      badge: 0,
    },
    {
      name: "Doctor Approvals",
      href: "/admin/doctor-approvals",
      icon: <ClipboardCheck className="h-5 w-5" />,
      badge: badges.pendingDoctorApprovals,
    },
    {
      name: "Support Tickets",
      href: "/admin/support-tickets",
      icon: <TicketCheck className="h-5 w-5" />,
      badge: badges.openSupportTickets,
    },
    {
      name: "System Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
      badge: 0,
    },
  ];

  const renderNavContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-4">
        {/* Admin avatar */}
        <div className="flex items-center mb-6">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">AD</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="font-medium text-sm">Admin User</p>
            <p className="text-xs text-muted-foreground">System Administrator</p>
          </div>
        </div>

        {/* Nav items */}
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
                  <span className="relative shrink-0">
                    {item.icon}
                    {item.badge > 0 && (
                      <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none">
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

      {/* Bottom bar */}
      <div className="mt-auto p-4 space-y-4">
        <Separator />
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ThemeToggle />

            {/* Notification Bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                  <Bell className="h-4 w-4" />
                  {(badges.pendingDoctorApprovals + badges.openSupportTickets) > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none">
                      {badges.pendingDoctorApprovals + badges.openSupportTickets > 99
                        ? "99+"
                        : badges.pendingDoctorApprovals + badges.openSupportTickets}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-72">
                <div className="px-3 py-2 text-sm font-semibold">Notifications</div>
                <DropdownMenuSeparator />

                {badges.pendingDoctorApprovals === 0 && badges.openSupportTickets === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No new notifications
                  </div>
                ) : (
                  <>
                    {badges.pendingDoctorApprovals > 0 && (
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link to="/admin/doctor-approvals" className="flex items-start gap-3 p-3">
                          <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center shrink-0">
                            <ClipboardCheck className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Doctor Approvals</p>
                            <p className="text-xs text-muted-foreground">
                              {badges.pendingDoctorApprovals} doctor{badges.pendingDoctorApprovals > 1 ? "s" : ""} waiting for review
                            </p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {badges.openSupportTickets > 0 && (
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link to="/admin/support-tickets" className="flex items-start gap-3 p-3">
                          <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center shrink-0">
                            <TicketCheck className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Support Tickets</p>
                            <p className="text-xs text-muted-foreground">
                              {badges.openSupportTickets} open ticket{badges.openSupportTickets > 1 ? "s" : ""} need attention
                            </p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={handleAdminLogout}
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
      <div className="min-h-screen bg-background flex flex-col">
        {/* Mobile top bar */}
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
                <SheetDescription>Admin</SheetDescription>
              </SheetHeader>
              {renderNavContent()}
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <span className="font-semibold">Admin User</span>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">AD</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto pt-14 p-4">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block w-64 shrink-0 h-screen">
        <div className="h-full border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">CareLink</h2>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
          {renderNavContent()}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="container py-6 px-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
