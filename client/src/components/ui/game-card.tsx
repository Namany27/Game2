import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Game } from "@shared/schema";

interface GameCardProps {
  game: Game;
  className?: string;
  badge?: "popular" | "new" | "hot" | null;
}

export function GameCard({ game, className, badge = null }: GameCardProps) {
  const getBadgeColor = () => {
    switch (badge) {
      case "popular":
        return "bg-primary";
      case "new":
        return "bg-accent";
      case "hot":
        return "bg-secondary";
      default:
        return "";
    }
  };
  
  const getGameRoute = () => {
    switch (game.type) {
      case "slots":
        return `/game/slots/${game.id}`;
      case "roulette":
        return `/game/roulette/${game.id}`;
      case "blackjack":
        return `/game/blackjack/${game.id}`;
      default:
        return "/games";
    }
  };

  return (
    <div className={cn("game-card bg-muted rounded-xl overflow-hidden border border-border", className)}>
      <div className="relative h-40 overflow-hidden">
        <img
          src={game.imageUrl}
          alt={game.name}
          className="w-full h-full object-cover"
        />
        {badge && (
          <div className={cn("absolute top-2 right-2 text-white text-xs py-1 px-2 rounded-md font-medium", getBadgeColor())}>
            {badge}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-white mb-1">{game.name}</h3>
        <p className="text-muted-foreground text-sm mb-3">{game.description}</p>
        <Button asChild variant="secondary" className="w-full">
          <Link href={getGameRoute()}>Play Now</Link>
        </Button>
      </div>
    </div>
  );
}
