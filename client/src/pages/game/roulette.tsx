import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CryptoInput } from "@/components/ui/crypto-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  RefreshCw,
} from "lucide-react";
import type { Game } from "@shared/schema";

type BetType = "red" | "black" | "even" | "odd" | "high" | "low" | "number";

interface RouletteResult {
  result: number;
  isRed: boolean;
  bet: number;
  betType: BetType;
  betNumber?: number;
  win: number;
  multiplier: number;
  balance: string;
}

export default function RoulettePage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [bet, setBet] = useState("1");
  const [betType, setBetType] = useState<BetType>("red");
  const [betNumber, setBetNumber] = useState<number | undefined>(undefined);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<RouletteResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [wheelPosition, setWheelPosition] = useState(0);

  // Get game details
  const { data: game, isLoading } = useQuery<Game>({
    queryKey: [`/api/games/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/games`);
      const allGames = await res.json();
      return allGames.find((g: Game) => g.id === parseInt(id as string));
    },
  });

  // Play roulette mutation
  const playMutation = useMutation({
    mutationFn: async (data: { gameId: number; bet: number; betType: BetType; betNumber?: number }) => {
      const res = await apiRequest("POST", "/api/games/roulette/play", data);
      return res.json();
    },
    onSuccess: (data: RouletteResult) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Simulate wheel spinning animation
      setTimeout(() => {
        setResult(data);
        setIsSpinning(false);
        setShowResult(true);
        
        // Calculate wheel position based on result
        const resultPosition = (data.result * 9.73) + 720; // Multi-spin + position
        setWheelPosition(resultPosition);
        
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
      }, 3000);
    },
    onError: (error) => {
      setIsSpinning(false);
      toast({
        title: "Error playing roulette",
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
    
    if (betType === "number" && (betNumber === undefined || betNumber < 0 || betNumber > 36)) {
      toast({
        title: "Invalid number",
        description: "Please select a valid number between 0 and 36.",
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
    setWheelPosition(0); // Reset wheel position
    
    playMutation.mutate({
      gameId: game.id,
      bet: betAmount,
      betType,
      betNumber,
    });
  };

  // Generate roulette wheel layout
  const getRouletteNumbers = () => {
    // Standard American roulette wheel order
    return [
      0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1,
      "00", 27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2
    ];
  };

  // Check if a number is red
  const isRedNumber = (num: number | string) => {
    // Only numeric values can be red (0 and "00" are green)
    if (typeof num === "string" || num === 0) return false;
    
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(num);
  };

  // If the game doesn't exist or is not a roulette game, redirect
  useEffect(() => {
    if (!isLoading && (!game || game.type !== "roulette")) {
      toast({
        title: "Game not found",
        description: "This roulette game doesn't exist.",
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
          
          {/* Roulette wheel */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-muted-foreground/10 p-6">
                <div className="roulette-wheel relative bg-black rounded-full aspect-square max-w-[300px] mx-auto overflow-hidden border-8 border-muted">
                  {/* Wheel markers */}
                  <div className="absolute top-0 left-1/2 w-4 h-4 bg-white transform -translate-x-1/2 -translate-y-1/2 z-10 rounded-full"></div>
                  
                  {/* Spinning wheel inner content */}
                  <div 
                    className="wheel-content absolute inset-0 transition-transform duration-3000 ease-out"
                    style={{
                      transform: `rotate(${wheelPosition}deg)`,
                      transitionDuration: isSpinning ? '3s' : '0s'
                    }}
                  >
                    {getRouletteNumbers().map((num, i) => (
                      <div 
                        key={i} 
                        className="absolute w-full h-full flex items-center justify-center"
                        style={{
                          transform: `rotate(${i * (360 / 38)}deg)`,
                        }}
                      >
                        <div 
                          className={`absolute top-1 h-[48%] w-8 flex items-center justify-center text-xs font-bold
                            ${num === 0 || num === '00' ? 'bg-green-600' : (typeof num === 'number' && isRedNumber(num)) ? 'bg-red-600' : 'bg-black'}`}
                        >
                          {num}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Result display */}
                {showResult && result && (
                  <div className="text-center mt-6 p-2 rounded-md bg-muted/30">
                    <p className="text-lg font-bold">
                      Result: <span className={result.isRed ? 'text-red-500' : result.result === 0 ? 'text-green-500' : 'text-white'}>
                        {result.result}
                      </span>
                    </p>
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
            </CardContent>
          </Card>
          
          {/* Bet controls */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <Tabs defaultValue="color" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="color">Color</TabsTrigger>
                  <TabsTrigger value="even-odd">Even/Odd</TabsTrigger>
                  <TabsTrigger value="range">Range</TabsTrigger>
                  <TabsTrigger value="number">Number</TabsTrigger>
                </TabsList>
                
                <TabsContent value="color" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      className={`h-16 bg-red-600 hover:bg-red-700 text-white ${betType === 'red' ? 'ring-2 ring-white' : ''}`}
                      onClick={() => setBetType('red')}
                    >
                      Red
                    </Button>
                    <Button 
                      className={`h-16 bg-black hover:bg-black/90 text-white ${betType === 'black' ? 'ring-2 ring-white' : ''}`}
                      onClick={() => setBetType('black')}
                    >
                      Black
                    </Button>
                  </div>
                  <p className="text-sm text-center text-muted-foreground">Pays 2:1</p>
                </TabsContent>
                
                <TabsContent value="even-odd" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      className={`h-16 ${betType === 'even' ? 'ring-2 ring-white' : ''}`}
                      onClick={() => setBetType('even')}
                    >
                      Even
                    </Button>
                    <Button 
                      className={`h-16 ${betType === 'odd' ? 'ring-2 ring-white' : ''}`}
                      onClick={() => setBetType('odd')}
                    >
                      Odd
                    </Button>
                  </div>
                  <p className="text-sm text-center text-muted-foreground">Pays 2:1</p>
                </TabsContent>
                
                <TabsContent value="range" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      className={`h-16 ${betType === 'low' ? 'ring-2 ring-white' : ''}`}
                      onClick={() => setBetType('low')}
                    >
                      1-18
                    </Button>
                    <Button 
                      className={`h-16 ${betType === 'high' ? 'ring-2 ring-white' : ''}`}
                      onClick={() => setBetType('high')}
                    >
                      19-36
                    </Button>
                  </div>
                  <p className="text-sm text-center text-muted-foreground">Pays 2:1</p>
                </TabsContent>
                
                <TabsContent value="number" className="space-y-4 pt-4">
                  <div className="grid grid-cols-6 gap-2">
                    {[0, ...Array.from({ length: 36 }, (_, i) => i + 1)].map((num) => (
                      <Button 
                        key={num}
                        variant="outline"
                        className={`h-10 p-0 ${betNumber === num ? 'ring-2 ring-primary' : ''} ${
                          num === 0 ? 'bg-green-600 text-white hover:bg-green-700' :
                          (typeof num === 'number' && isRedNumber(num)) ? 'bg-red-600 text-white hover:bg-red-700' : 
                          'bg-black text-white hover:bg-black/90'
                        }`}
                        onClick={() => {
                          setBetType('number');
                          setBetNumber(num);
                        }}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                  <p className="text-sm text-center text-muted-foreground">Pays 36:1</p>
                </TabsContent>
              </Tabs>
              
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
                  <span className="mr-2">🎲</span>
                )}
                {isSpinning ? "Spinning..." : "Spin"}
              </Button>
            </CardContent>
          </Card>
          
          {/* Game info */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Game Rules</h3>
              <div className="space-y-2 text-sm">
                <p>• Red/Black: Bet on all red or black numbers. Pays 2:1.</p>
                <p>• Even/Odd: Bet on all even or odd numbers. Pays 2:1.</p>
                <p>• 1-18/19-36: Bet on numbers in the range. Pays 2:1.</p>
                <p>• Straight up: Bet on a specific number. Pays 36:1.</p>
                <p>• Zero counts as neither red/black, even/odd, or in any range.</p>
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
