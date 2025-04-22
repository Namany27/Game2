import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout, MainHeader } from "@/components/layout";
import { GameCard } from "@/components/ui/game-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Game } from "@shared/schema";
import { Search } from "lucide-react";

export default function GamesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: games = [], isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });
  
  // Filter games by type and search query
  const filterGames = (type: string) => {
    return games.filter(game => 
      (type === "all" || game.type === type) && 
      game.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  const allGames = filterGames("all");
  const slotsGames = filterGames("slots");
  const rouletteGames = filterGames("roulette");
  const blackjackGames = filterGames("blackjack");
  
  // Add badges to some games for visual appeal
  const gameBadges: Record<number, "popular" | "new" | "hot"> = {
    1: "popular", // First game is popular
    2: "new",     // Second game is new
    3: "hot"      // Third game is hot
  };

  return (
    <Layout>
      <MainHeader title="Games" />
      
      <div className="p-4 md:p-8">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search games..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Games</TabsTrigger>
            <TabsTrigger value="slots">Slots</TabsTrigger>
            <TabsTrigger value="roulette">Roulette</TabsTrigger>
            <TabsTrigger value="blackjack">Blackjack</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-[260px] bg-muted/50 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : allGames.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No games found. Try a different search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {allGames.map((game) => (
                  <GameCard 
                    key={game.id} 
                    game={game} 
                    badge={gameBadges[game.id] || null}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="slots" className="mt-0">
            {slotsGames.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No slots games found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {slotsGames.map((game) => (
                  <GameCard 
                    key={game.id} 
                    game={game} 
                    badge={gameBadges[game.id] || null}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="roulette" className="mt-0">
            {rouletteGames.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No roulette games found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {rouletteGames.map((game) => (
                  <GameCard 
                    key={game.id} 
                    game={game} 
                    badge={gameBadges[game.id] || null}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="blackjack" className="mt-0">
            {blackjackGames.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No blackjack games found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {blackjackGames.map((game) => (
                  <GameCard 
                    key={game.id} 
                    game={game} 
                    badge={gameBadges[game.id] || null}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
