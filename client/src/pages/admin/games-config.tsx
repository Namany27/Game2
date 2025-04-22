import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Settings,
  Gamepad2,
  BarChart,
  Save,
  Plus,
  Edit,
  Trash
} from "lucide-react";
import type { Game } from "@shared/schema";

export default function AdminGamesConfig() {
  const { toast } = useToast();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [houseEdge, setHouseEdge] = useState<number>(50);
  
  // Fetch games
  const { data: games = [] } = useQuery<Game[]>({
    queryKey: ["/api/games"],
    queryFn: async () => {
      const res = await fetch("/api/games");
      const allGames = await res.json();
      return allGames;
    },
  });
  
  // Update house edge mutation
  const updateHouseEdgeMutation = useMutation({
    mutationFn: async ({ gameId, houseEdge }: { gameId: number; houseEdge: number }) => {
      return apiRequest("POST", `/api/admin/games/${gameId}/edge`, { houseEdge });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      
      toast({
        title: "House edge updated",
        description: `House edge for ${selectedGame?.name} updated successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update house edge",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update game status mutation
  const updateGameStatusMutation = useMutation({
    mutationFn: async ({ gameId, isActive }: { gameId: number; isActive: boolean }) => {
      return apiRequest("POST", `/api/admin/games/${gameId}/status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      
      toast({
        title: "Game status updated",
        description: `Status for ${selectedGame?.name} updated successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update game status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle game selection
  const handleSelectGame = (game: Game) => {
    setSelectedGame(game);
    setHouseEdge(parseFloat(game.houseEdge.toString()));
  };
  
  // Handle house edge save
  const handleSaveHouseEdge = () => {
    if (!selectedGame) return;
    
    updateHouseEdgeMutation.mutate({
      gameId: selectedGame.id,
      houseEdge
    });
  };
  
  // Handle game status toggle
  const handleToggleGameStatus = (game: Game) => {
    updateGameStatusMutation.mutate({
      gameId: game.id,
      isActive: !game.isActive
    });
  };

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Games Configuration</h1>
              <p className="text-muted-foreground">Manage game settings and house edge</p>
            </div>
            
            <Button className="mt-4 md:mt-0">
              <Plus className="h-4 w-4 mr-2" /> Add New Game
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Games List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Games</CardTitle>
                <CardDescription>Select a game to edit its settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {games.map((game) => (
                    <div 
                      key={game.id} 
                      className={`p-3 rounded-md border cursor-pointer transition-colors
                        ${selectedGame?.id === game.id ? 'bg-muted border-primary' : 'border-border hover:bg-muted/50'}`}
                      onClick={() => handleSelectGame(game)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-md bg-muted flex items-center justify-center
                            ${!game.isActive && 'opacity-50'}`}>
                            <Gamepad2 className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className={`font-medium ${!game.isActive && 'text-muted-foreground'}`}>{game.name}</h3>
                            <p className="text-xs text-muted-foreground capitalize">{game.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={game.isActive}
                            onCheckedChange={() => handleToggleGameStatus(game)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Game Settings */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Game Settings</CardTitle>
                <CardDescription>Configure house edge and game parameters</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedGame ? (
                  <Tabs defaultValue="general">
                    <TabsList className="mb-6">
                      <TabsTrigger value="general">General</TabsTrigger>
                      <TabsTrigger value="house-edge">House Edge</TabsTrigger>
                      <TabsTrigger value="statistics">Statistics</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="general" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="game-name">Game Name</Label>
                          <Input id="game-name" value={selectedGame.name} readOnly />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="game-type">Game Type</Label>
                          <Input id="game-type" value={selectedGame.type} readOnly />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="min-bet">Minimum Bet</Label>
                          <Input id="min-bet" value={selectedGame.minBet.toString()} readOnly />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="max-bet">Maximum Bet</Label>
                          <Input id="max-bet" value={selectedGame.maxBet.toString()} readOnly />
                        </div>
                        
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="description">Description</Label>
                          <Input id="description" value={selectedGame.description} readOnly />
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline">
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </Button>
                        <Button variant="destructive">
                          <Trash className="h-4 w-4 mr-2" /> Delete
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="house-edge" className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <Label>House Edge (%)</Label>
                            <span className="text-sm font-medium">{houseEdge}%</span>
                          </div>
                          <Slider
                            min={0}
                            max={100}
                            step={1}
                            value={[houseEdge]}
                            onValueChange={(value) => setHouseEdge(value[0])}
                          />
                          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                            <span>0% (Player Advantage)</span>
                            <span>50% (Balanced)</span>
                            <span>100% (House Advantage)</span>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-muted rounded-md">
                          <h3 className="text-sm font-medium mb-2 flex items-center">
                            <Settings className="h-4 w-4 mr-1" /> House Edge Explained
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            House edge represents the casino's advantage in each game. A 50% house edge means the casino has a 50% profit margin on bets over time.
                          </p>
                        </div>
                        
                        <Button 
                          onClick={handleSaveHouseEdge}
                          disabled={updateHouseEdgeMutation.isPending}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {updateHouseEdgeMutation.isPending ? "Saving..." : "Save House Edge"}
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="statistics" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <BarChart className="h-8 w-8 mx-auto mb-2 text-primary" />
                              <h3 className="text-2xl font-bold">15,234</h3>
                              <p className="text-sm text-muted-foreground">Total Plays</p>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <Settings className="h-8 w-8 mx-auto mb-2 text-secondary" />
                              <h3 className="text-2xl font-bold">{formatCurrency(2534.50)}</h3>
                              <p className="text-sm text-muted-foreground">Total Wagered</p>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <Gamepad2 className="h-8 w-8 mx-auto mb-2 text-accent" />
                              <h3 className="text-2xl font-bold">{formatCurrency(1267.25)}</h3>
                              <p className="text-sm text-muted-foreground">House Profit</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="h-60 w-full bg-muted rounded-md flex items-center justify-center">
                        <BarChart className="h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground ml-2">Game performance chart would be displayed here</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="h-64 flex items-center justify-center flex-col">
                    <Gamepad2 className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Select a game to view and edit its settings</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
