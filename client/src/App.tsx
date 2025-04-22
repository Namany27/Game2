import { AuthProvider } from "@/hooks/use-auth";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "./lib/protected-route";

// Pages
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import GamesPage from "@/pages/games-page";
import WalletPage from "@/pages/wallet-page";
import ProfilePage from "@/pages/profile-page";

// Game pages
import SlotsPage from "@/pages/game/slots";
import RoulettePage from "@/pages/game/roulette";
import BlackjackPage from "@/pages/game/blackjack";

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminGamesConfig from "@/pages/admin/games-config";
import AdminTransactions from "@/pages/admin/transactions";

function Router() {
  return (
    <Switch>
      {/* Auth page - the only publicly accessible route */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected routes - require authentication */}
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/games" component={GamesPage} />
      <ProtectedRoute path="/wallet" component={WalletPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      
      {/* Game routes - protected */}
      <ProtectedRoute path="/game/slots/:id" component={SlotsPage} />
      <ProtectedRoute path="/game/roulette/:id" component={RoulettePage} />
      <ProtectedRoute path="/game/blackjack/:id" component={BlackjackPage} />
      
      {/* Admin routes - protected and require admin role */}
      <ProtectedRoute path="/admin" component={AdminDashboard} adminOnly={true} />
      <ProtectedRoute path="/admin/games" component={AdminGamesConfig} adminOnly={true} />
      <ProtectedRoute path="/admin/transactions" component={AdminTransactions} adminOnly={true} />
      
      {/* Fallback to 404 - also protected to prevent access to invalid routes */}
      <ProtectedRoute path="/:404*" component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" attribute="class">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
