import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatTimestamp, truncateUsername } from "@/lib/utils";
import { User, Trophy, Coins } from "lucide-react";

interface Winner {
  id: number;
  username: string;
  gameName: string;
  amount: string;
  createdAt: string;
}

export function LiveWinners() {
  const carouselRef = useRef<HTMLDivElement>(null);
  
  const { data: winners = [], isLoading } = useQuery<Winner[]>({
    queryKey: ["/api/recent-wins"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Auto scroll carousel
  useEffect(() => {
    if (!carouselRef.current || winners.length <= 3) return;
    
    const interval = setInterval(() => {
      if (carouselRef.current) {
        const scrollAmount = 280; // Width of one card + gap
        const currentScroll = carouselRef.current.scrollLeft;
        const maxScroll = carouselRef.current.scrollWidth - carouselRef.current.clientWidth;
        
        if (currentScroll >= maxScroll) {
          carouselRef.current.scrollLeft = 0;
        } else {
          carouselRef.current.scrollLeft += scrollAmount;
        }
      }
    }, 4000);
    
    return () => clearInterval(interval);
  }, [winners.length]);

  return (
    <section className="px-4 md:px-8 py-6 bg-muted">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-6">
          <div className="w-3 h-3 bg-secondary rounded-full animate-pulse mr-2"></div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Live Winners</h2>
        </div>
        
        <div className="relative overflow-x-auto">
          {isLoading ? (
            <div className="flex space-x-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="flex-shrink-0 w-64 bg-card/50 animate-pulse">
                  <CardContent className="p-3 h-24"></CardContent>
                </Card>
              ))}
            </div>
          ) : winners.length === 0 ? (
            <Card className="w-full bg-card/50">
              <CardContent className="p-4 text-center">
                <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-muted-foreground">No winners yet. Be the first to win!</p>
              </CardContent>
            </Card>
          ) : (
            <div 
              ref={carouselRef}
              className="carousel flex gap-4 py-2 overflow-x-auto pb-4"
            >
              {winners.map((winner) => (
                <Card key={winner.id} className="flex-shrink-0 w-64">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-primary">
                        <User />
                      </div>
                      <div>
                        <div className="text-foreground font-medium">
                          {truncateUsername(winner.username)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimestamp(winner.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Won on {winner.gameName}
                        </div>
                        <div className="text-secondary font-semibold">
                          +{formatCurrency(winner.amount)}
                        </div>
                      </div>
                      <div className="text-xl text-secondary">
                        <Coins />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
