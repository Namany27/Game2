import { useState } from "react";
import { Layout, MainHeader } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";
import {
  User,
  CreditCard,
  History,
  Award,
  Shield,
  AlertTriangle
} from "lucide-react";
import { GameSession, Transaction } from "@shared/schema";

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Get transactions
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Get game sessions
  const { data: gameSessions = [] } = useQuery<GameSession[]>({
    queryKey: ["/api/user/game-sessions"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/user/game-sessions");
        if (!res.ok) return [];
        return await res.json();
      } catch (error) {
        console.error("Failed to fetch game sessions:", error);
        return [];
      }
    },
  });

  // Mock game statistics (in a real app, this would come from the API)
  const gameStats = {
    totalGamesPlayed: gameSessions.length,
    totalWagered: transactions
      .filter(tx => tx.type === "win" || tx.type === "loss")
      .reduce((sum, tx) => sum + Math.abs(parseFloat(tx.amount.toString())), 0),
    totalWon: transactions
      .filter(tx => tx.type === "win")
      .reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0),
    winRate: gameSessions.length ? 
      (gameSessions.filter(session => parseFloat(session.win.toString()) > 0).length / gameSessions.length * 100).toFixed(1) : 
      "0.0"
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would call an API to change the password
    alert("Password change functionality would be implemented in a real app");
    
    // Reset form
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // Function to get game name by ID
  const getGameName = (gameId: number | null) => {
    switch(gameId) {
      case 1: return "Crypto Slots";
      case 2: return "Crypto Roulette";
      case 3: return "Blackjack Pro";
      default: return "Unknown Game";
    }
  };

  return (
    <Layout>
      <MainHeader title="Profile" />
      
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* User info card */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <User className="h-10 w-10 text-primary" />
                </div>
                
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{user?.username}</h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1 text-sm bg-muted p-1 px-2 rounded-md">
                      <CreditCard className="h-4 w-4" />
                      <span>{formatCurrency(user?.balance || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm bg-muted p-1 px-2 rounded-md">
                      <History className="h-4 w-4" />
                      <span>Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                    {user?.isAdmin && (
                      <div className="flex items-center gap-1 text-sm bg-primary p-1 px-2 rounded-md text-white">
                        <Shield className="h-4 w-4" />
                        <span>Admin</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  variant="destructive" 
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? "Logging out..." : "Logout"}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="stats">
            <TabsList className="mb-6">
              <TabsTrigger value="stats">Game Statistics</TabsTrigger>
              <TabsTrigger value="history">Game History</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stats" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                        <History className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold">{gameStats.totalGamesPlayed}</h3>
                      <p className="text-sm text-muted-foreground">Games Played</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mb-3">
                        <CreditCard className="h-6 w-6 text-secondary" />
                      </div>
                      <h3 className="text-2xl font-bold">{formatCurrency(gameStats.totalWagered)}</h3>
                      <p className="text-sm text-muted-foreground">Total Wagered</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-3">
                        <Award className="h-6 w-6 text-accent" />
                      </div>
                      <h3 className="text-2xl font-bold">{formatCurrency(gameStats.totalWon)}</h3>
                      <p className="text-sm text-muted-foreground">Total Won</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
                        <Award className="h-6 w-6 text-green-500" />
                      </div>
                      <h3 className="text-2xl font-bold">{gameStats.winRate}%</h3>
                      <p className="text-sm text-muted-foreground">Win Rate</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Game Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {gameSessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No game history available yet. Start playing to see your stats!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* We'd normally use a chart here, but for simplicity let's use text */}
                      <p className="text-muted-foreground">Game performance statistics will be displayed here.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Game History</CardTitle>
                </CardHeader>
                <CardContent>
                  {gameSessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No game history available yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-2 text-muted-foreground text-sm font-medium">Game</th>
                            <th className="text-left p-2 text-muted-foreground text-sm font-medium">Date</th>
                            <th className="text-right p-2 text-muted-foreground text-sm font-medium">Bet</th>
                            <th className="text-right p-2 text-muted-foreground text-sm font-medium">Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gameSessions.slice(0, 10).map((session) => (
                            <tr key={session.id} className="border-b border-border">
                              <td className="p-2">{getGameName(session.gameId)}</td>
                              <td className="p-2">{new Date(session.createdAt).toLocaleString()}</td>
                              <td className="p-2 text-right">{formatCurrency(session.bet)}</td>
                              <td className={`p-2 text-right font-medium ${
                                parseFloat(session.win.toString()) > 0 ? 'text-secondary' : 'text-destructive'
                              }`}>
                                {parseFloat(session.win.toString()) > 0 ? '+' : ''}{formatCurrency(session.win)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="old-password">Current Password</Label>
                      <Input 
                        id="old-password" 
                        type="password" 
                        placeholder="Enter your current password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input 
                        id="new-password" 
                        type="password" 
                        placeholder="Enter your new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input 
                        id="confirm-password" 
                        type="password" 
                        placeholder="Confirm your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    <Button type="submit">Update Password</Button>
                  </form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Account Deletion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button variant="destructive">Delete Account</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
