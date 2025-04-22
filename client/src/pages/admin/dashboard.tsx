import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  BarChart4,
  PieChart,
  Activity
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  houseProfit: number;
}

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState("all");
  
  // Fetch admin stats
  const { data: stats = { totalUsers: 0, totalDeposits: 0, totalWithdrawals: 0, houseProfit: 0 }, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  // Calculate metrics
  const metrics = {
    userCount: stats.totalUsers,
    totalDeposits: stats.totalDeposits,
    totalWithdrawals: stats.totalWithdrawals,
    houseProfit: stats.houseProfit,
    avgDepositPerUser: stats.totalUsers ? stats.totalDeposits / stats.totalUsers : 0,
    profitMargin: stats.totalDeposits ? (stats.houseProfit / stats.totalDeposits) * 100 : 0
  };

  // Simulate metric animations
  const [displayedMetrics, setDisplayedMetrics] = useState({
    userCount: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    houseProfit: 0
  });

  useEffect(() => {
    if (!isLoading) {
      // Animate metrics
      const interval = setInterval(() => {
        setDisplayedMetrics(prev => ({
          userCount: Math.min(prev.userCount + Math.ceil(metrics.userCount / 20), metrics.userCount),
          totalDeposits: Math.min(prev.totalDeposits + Math.ceil(metrics.totalDeposits / 20), metrics.totalDeposits),
          totalWithdrawals: Math.min(prev.totalWithdrawals + Math.ceil(metrics.totalWithdrawals / 20), metrics.totalWithdrawals),
          houseProfit: Math.min(prev.houseProfit + Math.ceil(metrics.houseProfit / 20), metrics.houseProfit)
        }));
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isLoading, metrics]);

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Monitor your casino's performance and manage settings</p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <Tabs value={timeRange} onValueChange={setTimeRange}>
                <TabsList>
                  <TabsTrigger value="today">Today</TabsTrigger>
                  <TabsTrigger value="week">This Week</TabsTrigger>
                  <TabsTrigger value="month">This Month</TabsTrigger>
                  <TabsTrigger value="all">All Time</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <h3 className="text-3xl font-bold">{displayedMetrics.userCount}</h3>
                    <p className="flex items-center text-xs text-secondary mt-1">
                      <ArrowUpRight className="h-3 w-3 mr-1" /> +12.5% growth
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Deposits</p>
                    <h3 className="text-3xl font-bold">{formatCurrency(displayedMetrics.totalDeposits)}</h3>
                    <p className="flex items-center text-xs text-secondary mt-1">
                      <ArrowUpRight className="h-3 w-3 mr-1" /> +8.2% growth
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Withdrawals</p>
                    <h3 className="text-3xl font-bold">{formatCurrency(displayedMetrics.totalWithdrawals)}</h3>
                    <p className="flex items-center text-xs text-destructive mt-1">
                      <ArrowDownRight className="h-3 w-3 mr-1" /> -3.1% decrease
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">House Profit</p>
                    <h3 className="text-3xl font-bold">{formatCurrency(displayedMetrics.houseProfit)}</h3>
                    <p className="flex items-center text-xs text-secondary mt-1">
                      <ArrowUpRight className="h-3 w-3 mr-1" /> +15.3% growth
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>
                  Total deposits vs withdrawals over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                {/* In a real app, we would use a chart library like Recharts */}
                <div className="w-full h-full flex items-center justify-center">
                  <BarChart4 className="h-32 w-32 text-muted-foreground" />
                  <p className="text-muted-foreground">Revenue chart would be displayed here</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Game Popularity</CardTitle>
                <CardDescription>
                  Distribution of games played by users
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                {/* In a real app, we would use a chart library like Recharts */}
                <div className="w-full h-full flex items-center justify-center">
                  <PieChart className="h-32 w-32 text-muted-foreground" />
                  <p className="text-muted-foreground">Game distribution chart would be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Key Performance Indicators */}
          <Card>
            <CardHeader>
              <CardTitle>Key Performance Indicators</CardTitle>
              <CardDescription>
                Important metrics for your casino business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Average Deposit per User</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <span className="text-2xl font-bold">{formatCurrency(metrics.avgDepositPerUser)}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Profit Margin</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    <span className="text-2xl font-bold">{metrics.profitMargin.toFixed(1)}%</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">User Activity</p>
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-muted-foreground" />
                    <span className="text-2xl font-bold">High</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
