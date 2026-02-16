import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Dumbbell, BarChart3, Trophy, User, LogOut } from "lucide-react";
import fitstarLogo from "@/assets/fitstar-logo.png";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/programs", icon: Dumbbell, label: "Programs" },
  { to: "/progress", icon: BarChart3, label: "Progress" },
  { to: "/achievements", icon: Trophy, label: "Badges" },
  { to: "/profile", icon: User, label: "Profile" },
];

const AppLayout = () => {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={fitstarLogo} alt="FitStar logo" className="h-8 w-8 rounded-lg" />
            <h1 className="font-display text-xl font-bold text-gradient-primary">FitStar</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {profile?.display_name}
            </span>
            <button
              onClick={handleSignOut}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container flex-1 py-6">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="sticky bottom-0 z-50 border-t border-border bg-background/90 backdrop-blur-xl">
        <div className="container flex items-center justify-around py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
