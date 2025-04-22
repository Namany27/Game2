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
      <Route path="/" component={HomePage} />
      <Route path="/games" component={GamesPage} />
      <Route path="/wallet" component={WalletPage} />
      <Route path="/profile" component={ProfilePage} />
      
      {/* Game routes */}
      <Route path="/game/slots/:id" component={SlotsPage} />
      <Route path="/game/roulette/:id" component={RoulettePage} />
      <Route path="/game/blackjack/:id" component={BlackjackPage} />
      
      {/* Admin routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/games" component={AdminGamesConfig} />
      <Route path="/admin/transactions" component={AdminTransactions} />
      
      {/* Auth page */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
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
