import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Redirect } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Loader2 as LoaderIcon, RefreshCw as ReloadIcon, DollarSign, Users, TrendingUp, Activity, Percent } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface ExtendedStats {
  totalUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  houseProfit: number;
  totalGamesPlayed: number;
  winRatio: string;
  totalWagered: string;
  totalWon: string;
  profitMargin: string;
  gameStats: GameStat[];
}

interface GameStat {
  id: number;
  name: string;
  type: string;
  playCount: number;
  totalWagered: string;
  totalWon: string;
  profit: string;
  profitMargin: string;
  houseEdge: string;
}

interface Transaction {
  id: number;
  userId: number;
  username: string;
  type: string;
  amount: string;
  status: string;
  createdAt: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  balance: string;
  isAdmin: boolean;
  createdAt: string;
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [profitTarget, setProfitTarget] = useState<number>(50);
  const [applyToAllGames, setApplyToAllGames] = useState<boolean>(true);
  const [globalHouseEdge, setGlobalHouseEdge] = useState<number>(50);

  // Check if user is Owner
  const isOwner = user?.isAdmin && user?.username === "Owner";
  
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  if (!isOwner) {
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-red-500">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center mb-4">This area is restricted to the Owner account only.</p>
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Fetch extended stats
  const { 
    data: stats, 
    isLoading: statsLoading,
    refetch: refetchStats
  } = useQuery<ExtendedStats>({
    queryKey: ["/api/owner/extended-stats"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Fetch all transactions
  const { 
    data: transactions, 
    isLoading: transactionsLoading,
    refetch: refetchTransactions
  } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Fetch all users
  const {
    data: users,
    isLoading: usersLoading,
    refetch: refetchUsers
  } = useQuery<User[]>({
    queryKey: ["/api/owner/all-users"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Apply profit target to all games
  const handleApplyProfitTarget = async () => {
    try {
      const response = await apiRequest("POST", "/api/owner/set-profit-target", {
        targetProfitPercent: profitTarget,
        applyToAllGames
      });
      
      const data = await response.json();
      toast({
        title: "Profit Target Updated",
        description: data.message,
      });
      
      // Refetch stats to update the UI
      refetchStats();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profit target",
        variant: "destructive",
      });
    }
  };

  // Set global house edge
  const handleSetGlobalHouseEdge = async () => {
    try {
      const response = await apiRequest("POST", "/api/owner/set-global-house-edge", {
        houseEdge: globalHouseEdge
      });
      
      const data = await response.json();
      toast({
        title: "House Edge Updated",
        description: "The house edge has been updated for all games",
      });
      
      // Refetch stats to update the UI
      refetchStats();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update house edge",
        variant: "destructive",
      });
    }
  };

  // Refresh all data
  const refreshAllData = () => {
    refetchStats();
    refetchTransactions();
    refetchUsers();
  };

  // Format data for charts
  const getChartData = () => {
    if (!stats) return [];
    
    return stats.gameStats.map(game => ({
      name: game.name,
      playCount: game.playCount,
      profit: parseFloat(game.profit),
      wagers: parseFloat(game.totalWagered),
      wins: parseFloat(game.totalWon),
      profitMargin: parseFloat(game.profitMargin)
    }));
  };

  const getPieChartData = () => {
    if (!stats) return [];
    
    return [
      { name: 'Deposits', value: stats.totalDeposits },
      { name: 'Withdrawals', value: stats.totalWithdrawals },
      { name: 'House Profit', value: stats.houseProfit }
    ];
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <Layout>
      <div className="container mx-auto py-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Owner Control Panel</h1>
            <Button onClick={refreshAllData} className="flex items-center">
              <ReloadIcon className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "Loading..." : formatCurrency(stats?.totalDeposits || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total deposits from all users
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">House Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "Loading..." : formatCurrency(stats?.houseProfit || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {statsLoading ? "" : `${stats?.profitMargin || "0%"} margin`}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "Loading..." : formatNumber(stats?.totalUsers || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Registered users on the platform
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Win Ratio</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "Loading..." : stats?.winRatio || "0%"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Percentage of winning game sessions
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="profit-control">Profit Control</TabsTrigger>
              <TabsTrigger value="games">Games</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Overview</CardTitle>
                    <CardDescription>
                      Total deposits, withdrawals and profit
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {statsLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <LoaderIcon className="h-8 w-8 animate-spin" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getPieChartData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {getPieChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Game Performance</CardTitle>
                    <CardDescription>
                      Profit margin by game
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {statsLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <LoaderIcon className="h-8 w-8 animate-spin" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getChartData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => `${value}%`} />
                          <Legend />
                          <Bar dataKey="profitMargin" name="Profit Margin %" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Game Profit Analysis</CardTitle>
                  <CardDescription>
                    Comparison of wagers, wins, and profit by game
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {statsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <LoaderIcon className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Bar dataKey="wagers" name="Total Wagered" fill="#8884d8" />
                        <Bar dataKey="wins" name="Total Won" fill="#82ca9d" />
                        <Bar dataKey="profit" name="Profit" fill="#ff8042" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Profit Control Tab */}
            <TabsContent value="profit-control" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Set Profit Target</CardTitle>
                  <CardDescription>
                    Set your desired profit margin for all games
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="profit-target">Target Profit Margin: {profitTarget}%</Label>
                      <span className="text-sm text-muted-foreground">{profitTarget}%</span>
                    </div>
                    <Slider
                      id="profit-target"
                      min={0}
                      max={90}
                      step={5}
                      value={[profitTarget]}
                      onValueChange={(vals) => setProfitTarget(vals[0])}
                    />
                    <p className="text-sm text-muted-foreground">
                      This will calculate and set the appropriate house edge to achieve this profit margin.
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="apply-all"
                      checked={applyToAllGames}
                      onChange={(e) => setApplyToAllGames(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="apply-all">Apply to all games</Label>
                  </div>
                  
                  <Button onClick={handleApplyProfitTarget} className="w-full">
                    <Percent className="mr-2 h-4 w-4" />
                    Apply Profit Target
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Set Global House Edge</CardTitle>
                  <CardDescription>
                    Directly set house edge for all games
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="house-edge">House Edge: {globalHouseEdge}%</Label>
                      <span className="text-sm text-muted-foreground">{globalHouseEdge}%</span>
                    </div>
                    <Slider
                      id="house-edge"
                      min={0}
                      max={90}
                      step={5}
                      value={[globalHouseEdge]}
                      onValueChange={(vals) => setGlobalHouseEdge(vals[0])}
                    />
                    <p className="text-sm text-muted-foreground">
                      Directly controls the advantage the house has in each game.
                    </p>
                  </div>
                  
                  <Button onClick={handleSetGlobalHouseEdge} className="w-full">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Apply Global House Edge
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Games Tab */}
            <TabsContent value="games" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Game Performance Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <LoaderIcon className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Game</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Play Count</TableHead>
                          <TableHead>Total Wagered</TableHead>
                          <TableHead>Total Won</TableHead>
                          <TableHead>Profit</TableHead>
                          <TableHead>Profit Margin</TableHead>
                          <TableHead>House Edge</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats?.gameStats.map((game) => (
                          <TableRow key={game.id}>
                            <TableCell className="font-medium">{game.name}</TableCell>
                            <TableCell>{game.type}</TableCell>
                            <TableCell>{formatNumber(game.playCount)}</TableCell>
                            <TableCell>{formatCurrency(parseFloat(game.totalWagered))}</TableCell>
                            <TableCell>{formatCurrency(parseFloat(game.totalWon))}</TableCell>
                            <TableCell>{formatCurrency(parseFloat(game.profit))}</TableCell>
                            <TableCell>{game.profitMargin}%</TableCell>
                            <TableCell>{game.houseEdge}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Transactions Tab */}
            <TabsContent value="transactions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <LoaderIcon className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <div className="max-h-[550px] overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-white">
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions?.map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell className="font-medium">{tx.id}</TableCell>
                              <TableCell>{tx.username || `User #${tx.userId}`}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  tx.type === 'deposit' ? 'bg-green-100 text-green-800' :
                                  tx.type === 'withdrawal' ? 'bg-red-100 text-red-800' :
                                  tx.type === 'win' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {tx.type}
                                </span>
                              </TableCell>
                              <TableCell className={
                                parseFloat(tx.amount) >= 0 ? 'text-green-600' : 'text-red-600'
                              }>
                                {formatCurrency(parseFloat(tx.amount))}
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {tx.status}
                                </span>
                              </TableCell>
                              <TableCell>{new Date(tx.createdAt).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Users</CardTitle>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <LoaderIcon className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <div className="max-h-[550px] overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-white">
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Balance</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users?.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.id}</TableCell>
                              <TableCell>{user.username}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{formatCurrency(parseFloat(user.balance))}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  user.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {user.isAdmin ? 'Admin' : 'User'}
                                </span>
                              </TableCell>
                              <TableCell>{new Date(user.createdAt).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}