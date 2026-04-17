import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import Footer from "./Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const { logout } = useAuth();
  const { t } = useTranslation(["admin", "common", "navigation"]);

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  // Remove unused routes - only keep dashboard, users, settings
  const navigation = [
    {
      name: t("navigation:admin.dashboard"),
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    { name: t("navigation:admin.users"), href: "/admin/users", icon: Users },
    {
      name: "Doctor Approvals",
      href: "/admin/doctor-approvals",
      icon: ClipboardCheck,
    },
    {
      name: t("navigation:admin.settings"),
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  const NavLinks = () => (
    <nav className="flex flex-col space-y-1">
      {navigation.map((item) => (
        <Link
          key={item.name}
          to={item.href}
          className={`flex items-center py-2 px-3 text-sm rounded-md transition-colors ${
            isActive(item.href)
              ? "bg-primary text-primary-foreground font-medium"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <item.icon className="h-4 w-4 mr-3" />
          {item.name}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card">
        <div className="p-4">
          <Link to="/admin/dashboard" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold">CL</span>
            </div>
            <span className="text-xl font-bold">CareLink</span>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
              {t("navigation:admin.title")}
            </span>
          </Link>
        </div>

        <Separator />

        <div className="flex-1 flex flex-col justify-between p-4">
          <div className="space-y-6">
            <NavLinks />
          </div>

          <div className="mt-auto space-y-4">
            <div className="flex items-center p-2 space-x-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {t("navigation:admin.user")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("navigation:admin.role")}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t("common:signOut")}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile navigation */}
      <div className="md:hidden flex items-center h-16 px-4 border-b bg-background z-10 sticky top-0">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-6 w-6" />
              <span className="sr-only">{t("common:toggleMenu")}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="p-4 flex items-center justify-between">
              <Link
                to="/admin/dashboard"
                className="flex items-center space-x-2"
              >
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold">
                    CL
                  </span>
                </div>
                <span className="text-xl font-bold">CareLink</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  {t("navigation:admin.title")}
                </span>
              </Link>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </div>

            <Separator />

            <div className="p-4 space-y-6">
              <NavLinks />

              <Separator />

              <div className="flex items-center p-2 space-x-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {t("navigation:admin.user")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("navigation:admin.role")}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={logout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t("common:signOut")}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-semibold">CL</span>
          </div>
          <span className="text-lg font-bold">CareLink</span>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
            {t("navigation:admin.title")}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default AdminLayout;
