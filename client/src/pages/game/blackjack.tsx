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
  Volume2,
  VolumeX,
  Hand,
  PlusCircle,
  Ban,
  RotateCcw
} from "lucide-react";
import type { Game } from "@shared/schema";

interface PlayingCard {
  suit: string;
  value: string;
}

interface BlackjackDealResult {
  gameId: number;
  playerHand: PlayingCard[];
  dealerHand: PlayingCard[];
  playerValue: number;
  dealerValue: number;
  bet: number;
  status: string;
  canHit: boolean;
  canStand: boolean;
  canDouble: boolean;
  deck: PlayingCard[];
  balance: string;
}

interface BlackjackActionResult extends BlackjackDealResult {
  win?: number;
}

export default function BlackjackPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [bet, setBet] = useState("5");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gameState, setGameState] = useState<BlackjackDealResult | null>(null);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [isDealing, setIsDealing] = useState(false);

  // Get game details
  const { data: game, isLoading } = useQuery<Game>({
    queryKey: [`/api/games/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/games`);
      const allGames = await res.json();
      return allGames.find((g: Game) => g.id === parseInt(id as string));
    },
  });

  // Deal mutation
  const dealMutation = useMutation({
    mutationFn: async (data: { gameId: number; bet: number }) => {
      const res = await apiRequest("POST", "/api/games/blackjack/deal", data);
      return res.json();
    },
    onSuccess: (data: BlackjackDealResult) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      setGameState(data);
      setIsDealing(false);
      
      // Play deal sound
      if (soundEnabled) {
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-quick-win-video-game-notification-269.mp3');
        audio.play();
      }
      
      // Check for natural blackjack
      if (data.status === "player_blackjack") {
        setGameResult("Blackjack! You win!");
        toast({
          title: "Blackjack!",
          description: "You got a blackjack!",
          variant: "default",
        });
      } else if (data.status === "dealer_blackjack") {
        setGameResult("Dealer has blackjack. You lose.");
      } else if (data.status === "push") {
        setGameResult("Both have blackjack. Push.");
      }
    },
    onError: (error) => {
      setIsDealing(false);
      toast({
        title: "Error dealing cards",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Action mutation
  const actionMutation = useMutation({
    mutationFn: async (data: { gameId: number; action: string; gameState: any }) => {
      const res = await apiRequest("POST", "/api/games/blackjack/action", data);
      return res.json();
    },
    onSuccess: (data: BlackjackActionResult) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setGameState(data);
      
      // Play card sound
      if (soundEnabled) {
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-quick-jump-arcade-game-239.mp3');
        audio.play();
      }
      
      // Check for game end
      if (data.status !== "in_progress") {
        let resultMessage = "";
        
        switch (data.status) {
          case "player_bust":
            resultMessage = "Bust! You lose.";
            break;
          case "dealer_bust":
            resultMessage = "Dealer busts! You win!";
            // Play win sound
            if (soundEnabled) {
              const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3');
              audio.play();
            }
            break;
          case "player_wins":
            resultMessage = "You win!";
            // Play win sound
            if (soundEnabled) {
              const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3');
              audio.play();
            }
            break;
          case "dealer_wins":
            resultMessage = "Dealer wins. You lose.";
            break;
          case "push":
            resultMessage = "Push. Bet returned.";
            break;
          default:
            resultMessage = "Game over.";
        }
        
        setGameResult(resultMessage);
        
        if (data.win && data.win > 0) {
          toast({
            title: "You won!",
            description: `You've won ${formatCurrency(data.win)}!`,
            variant: "default",
          });
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Error processing action",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle deal
  const handleDeal = () => {
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
    
    setGameResult(null);
    setIsDealing(true);
    
    // Play shuffle sound
    if (soundEnabled) {
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-poker-card-shuffling-1080.mp3');
      audio.play();
    }
    
    dealMutation.mutate({
      gameId: game.id,
      bet: betAmount,
    });
  };

  // Handle actions (hit, stand, double)
  const handleAction = (action: string) => {
    if (!gameState) return;
    
    actionMutation.mutate({
      gameId: gameState.gameId,
      action,
      gameState,
    });
  };

  // Get card display
  const getCardDisplay = (card: PlayingCard) => {
    const suitSymbols: Record<string, string> = {
      "♠": "♠️",
      "♥": "♥️",
      "♦": "♦️",
      "♣": "♣️",
      "?": "❓"
    };
    
    const suitColors: Record<string, string> = {
      "♠": "text-white",
      "♥": "text-red-500",
      "♦": "text-red-500",
      "♣": "text-white",
      "?": "text-white"
    };
    
    return (
      <>
        <div className={`text-lg font-bold ${suitColors[card.suit]}`}>{card.value}</div>
        <div className={`text-2xl ${suitColors[card.suit]}`}>{suitSymbols[card.suit]}</div>
      </>
    );
  };

  // If the game doesn't exist or is not a blackjack game, redirect
  useEffect(() => {
    if (!isLoading && (!game || game.type !== "blackjack")) {
      toast({
        title: "Game not found",
        description: "This blackjack game doesn't exist.",
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
              {gameState && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Current Bet</p>
                  <p className="text-xl font-semibold">{formatCurrency(gameState.bet)}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Blackjack table */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-green-800 p-6">
                {!gameState ? (
                  <div className="text-center py-16">
                    <h3 className="text-xl font-semibold mb-2">Blackjack</h3>
                    <p className="text-sm mb-4 text-white/80">Dealer stands on 17. Blackjack pays 3:2.</p>
                    
                    <div className="max-w-xs mx-auto">
                      <CryptoInput
                        value={bet}
                        onChange={setBet}
                        minValue={parseFloat(game.minBet.toString())}
                        maxValue={parseFloat(game.maxBet.toString())}
                        presetAmounts={[5, 10, 25, 50, 100]}
                      />
                      
                      <Button 
                        className="w-full mt-4 bg-white text-green-800 hover:bg-white/90"
                        onClick={handleDeal}
                        disabled={isDealing || dealMutation.isPending}
                      >
                        {isDealing ? "Dealing..." : "Deal Cards"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Dealer's cards */}
                    <div className="space-y-2">
                      <p className="text-white/80 text-sm">Dealer's Hand ({gameState.dealerValue})</p>
                      <div className="flex gap-2 overflow-auto pb-2">
                        {gameState.dealerHand.map((card, i) => (
                          <div 
                            key={i}
                            className="flex-shrink-0 w-16 h-24 bg-white rounded-md flex flex-col items-center justify-center shadow-md"
                          >
                            {getCardDisplay(card)}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Player's cards */}
                    <div className="space-y-2">
                      <p className="text-white/80 text-sm">Your Hand ({gameState.playerValue})</p>
                      <div className="flex gap-2 overflow-auto pb-2">
                        {gameState.playerHand.map((card, i) => (
                          <div 
                            key={i}
                            className="flex-shrink-0 w-16 h-24 bg-white rounded-md flex flex-col items-center justify-center shadow-md"
                          >
                            {getCardDisplay(card)}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    {gameState.status === "in_progress" ? (
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          className="bg-white text-green-800 hover:bg-white/90"
                          onClick={() => handleAction("hit")}
                          disabled={!gameState.canHit || actionMutation.isPending}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" /> Hit
                        </Button>
                        <Button
                          className="bg-white text-green-800 hover:bg-white/90"
                          onClick={() => handleAction("stand")}
                          disabled={!gameState.canStand || actionMutation.isPending}
                        >
                          <Hand className="h-4 w-4 mr-2" /> Stand
                        </Button>
                        <Button
                          className="bg-white text-green-800 hover:bg-white/90"
                          onClick={() => handleAction("double")}
                          disabled={!gameState.canDouble || actionMutation.isPending}
                        >
                          <Ban className="h-4 w-4 mr-2" /> Double
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className={`text-xl font-bold mb-2 ${
                          gameResult?.includes("win") || gameResult?.includes("Blackjack") ? 
                          'text-yellow-300' : gameResult?.includes("Push") ? 
                          'text-white' : 'text-red-300'
                        }`}>
                          {gameResult}
                        </div>
                        <Button
                          className="bg-white text-green-800 hover:bg-white/90"
                          onClick={() => {
                            setGameState(null);
                            setGameResult(null);
                          }}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" /> New Game
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Game info */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Game Rules</h3>
              <div className="space-y-2 text-sm">
                <p>• Dealer stands on all 17s</p>
                <p>• Blackjack pays 3:2</p>
                <p>• Insurance not offered</p>
                <p>• Double down on first two cards</p>
                <p>• No splitting pairs</p>
                <p>• Cards are shuffled after each game</p>
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
