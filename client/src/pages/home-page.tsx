import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Layout, MainHeader } from "@/components/layout";
import { LiveWinners } from "@/components/live-winners";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameCard } from "@/components/ui/game-card";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";
import { Game } from "@shared/schema";
import { 
  ArrowUp, 
  ChartLine, 
  Trophy, 
  Play, 
  Wallet,
  Shield, 
  Zap
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  
  const { data: games = [] } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });
  
  // Select a few games to show as popular, new, etc.
  const popularGames = games.slice(0, 5);
  
  // Add badges to some games
  const gameBadges: Record<number, "popular" | "new" | "hot"> = {
    1: "popular", // First game is popular
    2: "new",     // Second game is new
    3: "hot"      // Third game is hot
  };

  return (
    <Layout>
      <MainHeader title="CryptoCasino" />
      
      {/* Hero Section */}
      <section className="relative">
        <div className="h-[250px] md:h-[400px] bg-gradient-to-r from-muted to-background relative overflow-hidden">
          {/* Background casino elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-20">
            <div className="absolute top-10 left-[10%] text-5xl text-primary">
              <i className="fas fa-dice"></i>
            </div>
            <div className="absolute top-[40%] left-[30%] text-4xl text-secondary">
              <i className="fas fa-coins"></i>
            </div>
            <div className="absolute top-[20%] right-[15%] text-5xl text-accent">
              <i className="fas fa-dollar-sign"></i>
            </div>
            <div className="absolute bottom-[20%] right-[25%] text-4xl text-primary">
              <i className="fas fa-trophy"></i>
            </div>
          </div>
          
          <div className="relative h-full flex items-center px-6 md:px-12 z-10">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
                Play, Win & Withdraw <span className="text-primary">Instantly</span> with USDT
              </h1>
              <p className="text-muted-foreground text-base md:text-lg mb-6 max-w-xl">
                The most trusted crypto casino with instant withdrawals, provably fair games, and exclusive bonuses.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/games">
                    <Play className="h-4 w-4" /> Play Now
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2">
                  <Link href="/wallet">
                    <Wallet className="h-4 w-4" /> Deposit
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* User Dashboard */}
      <section className="px-4 md:px-8 py-6 bg-background">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Your Balance</span>
                <img
                  src="https://cryptologos.cc/logos/tether-usdt-logo.png"
                  alt="USDT Logo"
                  className="h-5 w-5"
                />
              </div>
              <div className="font-semibold text-2xl">{formatCurrency(user?.balance || 0)}</div>
              <div className="flex gap-2 mt-4">
                <Button asChild className="flex-1">
                  <Link href="/wallet">Deposit</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/wallet?tab=withdraw">Withdraw</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Total Wagered</span>
                <ChartLine className="h-5 w-5 text-accent" />
              </div>
              <div className="font-semibold text-2xl">4,760.50 USDT</div>
              <div className="mt-2 text-xs flex items-center">
                <span className="bg-secondary bg-opacity-20 text-secondary py-1 px-2 rounded text-xs inline-flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" /> +520.25 (24h)
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Total Winnings</span>
                <Trophy className="h-5 w-5 text-secondary" />
              </div>
              <div className="font-semibold text-2xl">2,980.75 USDT</div>
              <div className="mt-2 flex items-center text-xs">
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-secondary h-2 rounded-full" style={{ width: "45%" }}></div>
                </div>
                <span className="ml-2 text-muted-foreground">45% ROI</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Popular Games */}
      <section className="px-4 md:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold">Popular Games</h2>
          <Link href="/games" className="text-primary hover:underline flex items-center gap-1 text-sm">
            View All <i className="fas fa-chevron-right text-xs"></i>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {popularGames.map((game) => (
            <GameCard 
              key={game.id} 
              game={game} 
              badge={gameBadges[game.id] || null}
            />
          ))}
        </div>
      </section>
      
      {/* Live Winners */}
      <LiveWinners />
      
      {/* Crypto Deposit */}
      <section className="px-4 md:px-8 py-10 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Quick & Secure Crypto Transactions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Deposit and withdraw instantly using USDT with the lowest fees in the industry</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-full bg-primary bg-opacity-20 flex items-center justify-center mb-4">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Instant Deposits</h3>
                <p className="text-muted-foreground text-sm">Funds appear in your account immediately after one blockchain confirmation.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-full bg-secondary bg-opacity-20 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">100% Secure</h3>
                <p className="text-muted-foreground text-sm">Industry-leading security measures to keep your funds and personal data safe.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-full bg-accent bg-opacity-20 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Fast Withdrawals</h3>
                <p className="text-muted-foreground text-sm">Process withdrawal requests within minutes, not days like traditional casinos.</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8 text-center">
            <Button asChild size="lg" className="gap-2">
              <Link href="/wallet">
                <img
                  src="https://cryptologos.cc/logos/tether-usdt-logo.png"
                  alt="USDT Logo"
                  className="h-4 w-4"
                /> Deposit Now
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
