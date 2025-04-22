import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout, MainHeader } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CryptoInput } from "@/components/ui/crypto-input";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Copy,
  CheckCircle,
  ClipboardList,
  Clock,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import type { Transaction } from "@shared/schema";

export default function WalletPage() {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Get transactions
  const { data: transactions = [], isLoading: isLoadingTx } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Deposit mutation
  const depositMutation = useMutation({
    mutationFn: async (data: { amount: string; txHash: string }) => {
      return apiRequest("POST", "/api/transactions/deposit", data);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      toast({
        title: "Deposit successful",
        description: `${depositAmount} USDT has been added to your account.`,
      });
      
      setDepositAmount("");
    },
    onError: (error) => {
      toast({
        title: "Deposit failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: string; address: string }) => {
      return apiRequest("POST", "/api/transactions/withdraw", data);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      toast({
        title: "Withdrawal request submitted",
        description: "Your withdrawal request is being processed.",
      });
      
      setWithdrawAmount("");
      setWithdrawAddress("");
    },
    onError: (error) => {
      toast({
        title: "Withdrawal failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle deposit
  const handleDeposit = () => {
    if (!depositAmount || isNaN(parseFloat(depositAmount)) || parseFloat(depositAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to deposit.",
        variant: "destructive",
      });
      return;
    }
    
    // Generate a fake transaction hash for demo purposes
    const txHash = `0x${Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)).join('')}`;
    
    depositMutation.mutate({ 
      amount: depositAmount, 
      txHash 
    });
  };

  // Handle withdraw
  const handleWithdraw = () => {
    if (!withdrawAmount || isNaN(parseFloat(withdrawAmount)) || parseFloat(withdrawAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to withdraw.",
        variant: "destructive",
      });
      return;
    }

    if (!withdrawAddress || withdrawAddress.length < 5) {
      toast({
        title: "Invalid address",
        description: "Please enter a valid USDT address.",
        variant: "destructive",
      });
      return;
    }

    withdrawMutation.mutate({ 
      amount: withdrawAmount, 
      address: withdrawAddress 
    });
  };

  // Copy address to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="text-xs bg-secondary/20 text-secondary py-1 px-2 rounded-full">Completed</span>;
      case "pending":
        return <span className="text-xs bg-yellow-500/20 text-yellow-500 py-1 px-2 rounded-full">Pending</span>;
      case "rejected":
        return <span className="text-xs bg-destructive/20 text-destructive py-1 px-2 rounded-full">Rejected</span>;
      default:
        return <span className="text-xs bg-muted text-muted-foreground py-1 px-2 rounded-full">{status}</span>;
    }
  };

  // Function to get transaction icon
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownToLine className="h-4 w-4 text-secondary" />;
      case "withdrawal":
        return <ArrowUpFromLine className="h-4 w-4 text-accent" />;
      case "win":
        return <CheckCircle2 className="h-4 w-4 text-secondary" />;
      case "loss":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Layout>
      <MainHeader title="Wallet" />
      
      <div className="p-4 md:p-8">
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <h2 className="text-3xl font-bold">{formatCurrency(user?.balance || 0)}</h2>
                </div>
              </div>
              
              <div className="flex gap-2 md:self-end">
                <Button variant="default">Deposit</Button>
                <Button variant="outline">Withdraw</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="deposit">
          <TabsList className="mb-6">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            <TabsTrigger value="history">Transaction History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="deposit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Deposit USDT</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>1. Enter Amount</Label>
                  <CryptoInput
                    value={depositAmount}
                    onChange={setDepositAmount}
                    minValue={10}
                    presetAmounts={[10, 50, 100, 500, 1000]}
                  />
                </div>
                
                <div className="space-y-3">
                  <Label>2. Send USDT to this address (TRC20)</Label>
                  <div className="flex">
                    <div className="bg-muted p-3 rounded-l-md border border-border border-r-0 flex-1 font-mono text-sm overflow-auto">
                      TTAGHnoLCFzLSmW18H7CU45nzjpcyPr9oN
                    </div>
                    <Button 
                      variant="secondary" 
                      className="rounded-l-none"
                      onClick={() => copyToClipboard("TTAGHnoLCFzLSmW18H7CU45nzjpcyPr9oN")}
                    >
                      {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Please only send USDT on the Tron (TRC20) network to this address.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Label>3. Complete Deposit</Label>
                  <Button 
                    className="w-full"
                    onClick={handleDeposit}
                    disabled={!depositAmount || depositMutation.isPending}
                  >
                    {depositMutation.isPending ? "Processing..." : "Complete Deposit"}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    For demo purposes, clicking "Complete Deposit" will simulate a successful deposit.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="withdraw" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Withdraw USDT</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>1. Enter Amount</Label>
                  <CryptoInput
                    value={withdrawAmount}
                    onChange={setWithdrawAmount}
                    minValue={20}
                    maxValue={parseFloat(user?.balance?.toString() || "0")}
                    presetAmounts={[20, 50, 100, 500]}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Minimum withdrawal: 20 USDT. Fee: 1 USDT
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Label>2. Enter your USDT address (TRC20)</Label>
                  <Input
                    placeholder="Enter your USDT (TRC20) address"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Make sure you enter a valid USDT address on the Tron (TRC20) network.
                  </p>
                </div>
                
                <Button
                  className="w-full"
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || !withdrawAddress || withdrawMutation.isPending}
                >
                  {withdrawMutation.isPending ? "Processing..." : "Request Withdrawal"}
                </Button>
                
                <div className="bg-muted p-4 rounded-md border border-border">
                  <h4 className="font-medium mb-2 flex items-center">
                    <ClipboardList className="h-4 w-4 mr-2" /> Withdrawal Process
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>1. Withdrawals are processed manually by our team.</li>
                    <li>2. Processing time: usually within 24 hours.</li>
                    <li>3. You will be notified once your withdrawal is processed.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingTx ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-16 bg-muted/50 rounded-md animate-pulse"></div>
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No transactions yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((tx) => (
                      <div 
                        key={tx.id} 
                        className="flex items-center justify-between p-3 border-b border-border last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            {getTransactionIcon(tx.type)}
                          </div>
                          <div>
                            <div className="font-medium capitalize">{tx.type}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(tx.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${parseFloat(tx.amount.toString()) >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                            {parseFloat(tx.amount.toString()) >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                          </div>
                          <div>{getStatusBadge(tx.status)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
