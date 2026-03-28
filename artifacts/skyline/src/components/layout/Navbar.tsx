import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Building2, Plus, LayoutDashboard, Globe, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [location] = useLocation();
  const { isAuthenticated, user, login, logout, isLoading } = useAuth();

  const navItems = isAuthenticated
    ? [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/feed", label: "Global Feed", icon: Globe },
      ]
    : [
        { href: "/feed", label: "Global Feed", icon: Globe },
      ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <span className="font-display text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                Skyline
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    location === item.href
                      ? "bg-white/10 text-white"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!isLoading && (
              <>
                {isAuthenticated ? (
                  <>
                    <Link href="/create-goal" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 hover:-translate-y-0.5">
                      <Plus className="h-4 w-4" />
                      Build Goal
                    </Link>
                    <div className="h-8 w-[1px] bg-white/10 hidden sm:block"></div>
                    <div className="flex items-center gap-3">
                      {user?.profileImageUrl && (
                        <img 
                          src={user.profileImageUrl} 
                          alt="Profile" 
                          className="h-8 w-8 rounded-full border border-white/10"
                        />
                      )}
                      <Button variant="ghost" size="sm" onClick={() => logout()} className="text-muted-foreground hover:text-white">
                        <LogOut className="h-4 w-4 mr-2" />
                        Log out
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button onClick={() => login()} className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
                    <LogIn className="h-4 w-4 mr-2" />
                    Log In
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
