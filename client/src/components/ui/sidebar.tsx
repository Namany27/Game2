import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  Gamepad2,
  Wallet,
  History,
  User,
  LogOut,
  Settings,
  LineChart,
  Cog,
  Package2
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const isAdmin = user?.isAdmin ?? false;

  const navItems = [
    { path: "/", label: "Home", icon: <Home className="w-5 h-5" /> },
    { path: "/games", label: "Games", icon: <Gamepad2 className="w-5 h-5" /> },
    { path: "/wallet", label: "Wallet", icon: <Wallet className="w-5 h-5" /> },
    { path: "/profile", label: "Profile", icon: <User className="w-5 h-5" /> },
  ];
  
  const adminItems = [
    { path: "/admin", label: "Dashboard", icon: <LineChart className="w-5 h-5" /> },
    { path: "/admin/games", label: "Games Config", icon: <Gamepad2 className="w-5 h-5" /> },
    { path: "/admin/transactions", label: "Transactions", icon: <History className="w-5 h-5" /> },
  ];

  return (
    <aside className={cn("hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border", className)}>
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <Gamepad2 className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">CryptoCasino</h1>
        </div>
      </div>
      
      <nav className="flex-1 py-4">
        <div className="px-4 mb-2 text-xs uppercase text-muted-foreground font-semibold tracking-wider">
          Main
        </div>
        
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            className={cn(
              "nav-item flex items-center px-4 py-3 text-sidebar-foreground",
              location === item.path && "active"
            )}
          >
            <span className="w-6">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
        
        {isAdmin && (
          <>
            <div className="px-4 mt-6 mb-2 text-xs uppercase text-muted-foreground font-semibold tracking-wider">
              Admin
            </div>
            
            {adminItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={cn(
                  "nav-item flex items-center px-4 py-3 text-sidebar-foreground",
                  location === item.path && "active"
                )}
              >
                <span className="w-6">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </>
        )}
        
        <div className="px-4 mt-6 mb-2 text-xs uppercase text-muted-foreground font-semibold tracking-wider">
          Account
        </div>
        
        <button
          onClick={() => logoutMutation.mutate()}
          className="nav-item w-full flex items-center px-4 py-3 text-sidebar-foreground"
        >
          <span className="w-6"><LogOut className="w-5 h-5" /></span>
          <span>Logout</span>
        </button>
      </nav>
      
      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-accent p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Your Balance</span>
            <img 
              src="https://cryptologos.cc/logos/tether-usdt-logo.png" 
              alt="USDT Logo" 
              className="h-5 w-5" 
            />
          </div>
          <div className="font-semibold text-xl">{formatCurrency(user?.balance || 0)}</div>
          <div className="mt-3">
            <Button variant="default" className="w-full">
              Deposit
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
