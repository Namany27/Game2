import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CryptoInput } from "@/components/ui/crypto-input";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  DollarSign,
  RefreshCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { Game } from "@shared/schema";

interface SlotsResult {
  reels: string[];
  bet: number;
  win: number;
  multiplier: number;
  balance: string;
}

export default function SlotsPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [bet, setBet] = useState("1");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<SlotsResult | null>(null);
  const [reelElements, setReelElements] = useState<string[][]>([['🎰', '🎰', '🎰'], ['🎰', '🎰', '🎰'], ['🎰', '🎰', '🎰']]);
  const [showResult, setShowResult] = useState(false);

  // Get game details
  const { data: game, isLoading } = useQuery<Game>({
    queryKey: [`/api/games/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/games`);
      const allGames = await res.json();
      return allGames.find((g: Game) => g.id === parseInt(id as string));
    },
  });

  // Play slots mutation
  const playMutation = useMutation({
    mutationFn: async (data: { gameId: number; bet: number }) => {
      const res = await apiRequest("POST", "/api/games/slots/play", data);
      return res.json();
    },
    onSuccess: (data: SlotsResult) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Simulate spinning animation
      setTimeout(() => {
        setResult(data);
        setReelElements([
          [data.reels[0], data.reels[0], data.reels[0]],
          [data.reels[1], data.reels[1], data.reels[1]],
          [data.reels[2], data.reels[2], data.reels[2]],
        ]);
        setIsSpinning(false);
        setShowResult(true);
        
        // Play win/lose sound
        if (soundEnabled) {
          const audio = new Audio(data.win > 0 
            ? 'https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3'
            : 'https://assets.mixkit.co/sfx/preview/mixkit-losing-bleeps-2026.mp3');
          audio.play();
        }
        
        // Show toast for wins
        if (data.win > 0) {
          toast({
            title: "You won!",
            description: `You've won ${formatCurrency(data.win)}!`,
            variant: "default",
          });
        }
      }, 2000);
    },
    onError: (error) => {
      setIsSpinning(false);
      toast({
        title: "Error playing slots",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle spin
  const handleSpin = () => {
    if (!game) return;
    
    const betAmount = parseFloat(bet);
    
    if (isNaN(betAmount) || betAmount <= 0) {
      toast({
        title: "Invalid bet",
        description: "Please enter a valid bet amount.",
        variant: "destructive",
      });
      return;
    }
    
    if (betAmount < parseFloat(game.minBet.toString())) {
      toast({
        title: "Bet too small",
        description: `Minimum bet is ${formatCurrency(game.minBet)}`,
        variant: "destructive",
      });
      return;
    }
    
    if (betAmount > parseFloat(game.maxBet.toString())) {
      toast({
        title: "Bet too large",
        description: `Maximum bet is ${formatCurrency(game.maxBet)}`,
        variant: "destructive",
      });
      return;
    }
    
    if (user && user.balance && betAmount > parseFloat(user.balance.toString())) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough funds to place this bet.",
        variant: "destructive",
      });
      return;
    }
    
    // Play spin sound
    if (soundEnabled) {
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-slot-machine-spin-1097.mp3');
      audio.play();
    }
    
    setIsSpinning(true);
    setShowResult(false);
    
    // Animate reels spinning
    const symbols = ["🍒", "🍊", "🍋", "🍇", "🍉", "7️⃣", "💰", "⭐"];
    const interval = setInterval(() => {
      setReelElements(reels => 
        reels.map(reel => 
          reel.map(() => symbols[Math.floor(Math.random() * symbols.length)])
        )
      );
    }, 100);
    
    // Stop animation after play mutation completes
    setTimeout(() => {
      clearInterval(interval);
    }, 2000);
    
    playMutation.mutate({
      gameId: game.id,
      bet: betAmount,
    });
  };

  // If the game doesn't exist or is not a slots game, redirect
  useEffect(() => {
    if (!isLoading && (!game || game.type !== "slots")) {
      toast({
        title: "Game not found",
        description: "This slots game doesn't exist.",
        variant: "destructive",
      });
      navigate("/games");
    }
  }, [game, isLoading, navigate, toast]);

  if (isLoading || !game) {
    return (
      <Layout>
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideNav>
      <div className="bg-background min-h-screen">
        {/* Game header */}
        <div className="bg-muted p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/games")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <h1 className="font-bold text-lg">{game.name}</h1>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? (
                <Volume2 className="h-5 w-5" />
              ) : (
                <VolumeX className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
        
        <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
          {/* Game balance info */}
          <Card>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Your Balance</p>
                <p className="text-xl font-semibold">{formatCurrency(user?.balance || 0)}</p>
              </div>
              {result && showResult && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Last Win</p>
                  <p className={`text-xl font-semibold ${result.win > 0 ? 'text-secondary' : 'text-muted-foreground'}`}>
                    {result.win > 0 ? `+${formatCurrency(result.win)}` : formatCurrency(0)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Slots machine */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-muted-foreground/10 p-6">
                <div className={`slots-machine bg-black rounded-lg p-6 ${isSpinning ? 'animate-pulse' : ''}`}>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {reelElements.map((reel, i) => (
                      <div key={i} className="flex flex-col items-center bg-muted rounded-lg p-2 h-36 overflow-hidden">
                        {reel.map((symbol, j) => (
                          <div 
                            key={j} 
                            className={`text-4xl mb-2 ${j === 1 ? 'text-5xl font-bold' : ''}`}
                          >
                            {symbol}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  
                  {showResult && result && (
                    <div className="text-center mt-4 p-2 rounded-md bg-muted/30">
                      {result.win > 0 ? (
                        <p className="text-secondary font-bold">
                          You won {formatCurrency(result.win)}! (x{result.multiplier})
                        </p>
                      ) : (
                        <p className="text-muted-foreground">
                          No win this time. Try again!
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Bet controls */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Your Bet</p>
                <CryptoInput
                  value={bet}
                  onChange={setBet}
                  minValue={parseFloat(game.minBet.toString())}
                  maxValue={parseFloat(game.maxBet.toString())}
                  presetAmounts={[1, 5, 10, 25, 50]}
                />
              </div>
              
              <Button 
                className="w-full h-14 text-lg font-bold"
                onClick={handleSpin}
                disabled={isSpinning || playMutation.isPending}
              >
                {isSpinning ? (
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <DollarSign className="h-5 w-5 mr-2" />
                )}
                {isSpinning ? "Spinning..." : "Spin"}
              </Button>
            </CardContent>
          </Card>
          
          {/* Game info */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Winning Combinations</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Three 7️⃣ symbols</span>
                  <span className="font-bold">100x</span>
                </div>
                <div className="flex justify-between">
                  <span>Three 💰 symbols</span>
                  <span className="font-bold">50x</span>
                </div>
                <div className="flex justify-between">
                  <span>Three ⭐ symbols</span>
                  <span className="font-bold">25x</span>
                </div>
                <div className="flex justify-between">
                  <span>Three of any other symbols</span>
                  <span className="font-bold">10x</span>
                </div>
                <div className="flex justify-between">
                  <span>Two matching symbols</span>
                  <span className="font-bold">2x</span>
                </div>
              </div>
              
              <div className="mt-4 text-xs text-muted-foreground">
                <p>Bet range: {formatCurrency(game.minBet)} - {formatCurrency(game.maxBet)}</p>
                <p>House edge: {game.houseEdge}%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
