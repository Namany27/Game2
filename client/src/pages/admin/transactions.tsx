import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Copy,
  Check
} from "lucide-react";
import type { Transaction } from "@shared/schema";

export default function AdminTransactions() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Fetch transactions
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Approve transaction mutation
  const approveMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      return apiRequest("POST", `/api/admin/transactions/${transactionId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      setConfirmDialogOpen(false);
      
      toast({
        title: "Transaction approved",
        description: "The transaction has been successfully approved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to approve transaction",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject transaction mutation
  const rejectMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      return apiRequest("POST", `/api/admin/transactions/${transactionId}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      setRejectDialogOpen(false);
      
      toast({
        title: "Transaction rejected",
        description: "The transaction has been rejected and funds returned if applicable.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to reject transaction",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter transactions based on type and search query
  const filteredTransactions = transactions.filter(tx => {
    const matchesFilter = filter === "all" || tx.type === filter;
    const matchesSearch = 
      searchQuery === "" || 
      tx.id.toString().includes(searchQuery) || 
      (tx.txHash && tx.txHash.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  // Handle transaction approval
  const handleApproveTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setConfirmDialogOpen(true);
  };

  // Handle transaction rejection
  const handleRejectTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setRejectDialogOpen(true);
  };

  // Copy transaction hash to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  // Get status badge for transaction
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/50">Completed</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">Pending</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/20 text-red-500 border-red-500/50">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get transaction icon based on type
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownToLine className="h-4 w-4 text-green-500" />;
      case "withdrawal":
        return <ArrowUpFromLine className="h-4 w-4 text-accent" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Transaction Management</h1>
              <p className="text-muted-foreground">Approve or reject pending transactions</p>
            </div>
            
            <div className="mt-4 md:mt-0 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID or hash..."
                className="pl-10 w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>View and manage all cryptocurrency transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" onValueChange={setFilter}>
                <TabsList className="mb-6">
                  <TabsTrigger value="all">All Transactions</TabsTrigger>
                  <TabsTrigger value="deposit">Deposits</TabsTrigger>
                  <TabsTrigger value="withdrawal">Withdrawals</TabsTrigger>
                </TabsList>
                
                <div className="rounded-md border">
                  <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead>
                        <tr className="border-b transition-colors hover:bg-muted/50">
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">ID</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">User ID</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                          <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          Array.from({ length: 5 }).map((_, index) => (
                            <tr key={index} className="border-b transition-colors hover:bg-muted/50">
                              <td colSpan={7} className="p-4">
                                <div className="h-6 bg-muted animate-pulse rounded"></div>
                              </td>
                            </tr>
                          ))
                        ) : filteredTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-muted-foreground">
                              No transactions found
                            </td>
                          </tr>
                        ) : (
                          filteredTransactions.map((transaction) => (
                            <tr key={transaction.id} className="border-b transition-colors hover:bg-muted/50">
                              <td className="p-4 align-middle">{transaction.id}</td>
                              <td className="p-4 align-middle">{transaction.userId}</td>
                              <td className="p-4 align-middle">
                                <div className="flex items-center gap-2">
                                  {getTransactionIcon(transaction.type)}
                                  <span className="capitalize">{transaction.type}</span>
                                </div>
                              </td>
                              <td className="p-4 align-middle font-medium">
                                <span className={
                                  transaction.type === 'deposit' ? 'text-green-500' : 
                                  transaction.type === 'withdrawal' ? 'text-red-500' : ''
                                }>
                                  {transaction.type === 'deposit' ? '+' : transaction.type === 'withdrawal' ? '-' : ''}
                                  {formatCurrency(Math.abs(parseFloat(transaction.amount.toString())))}
                                </span>
                              </td>
                              <td className="p-4 align-middle">
                                {getStatusBadge(transaction.status)}
                              </td>
                              <td className="p-4 align-middle text-muted-foreground">
                                {new Date(transaction.createdAt).toLocaleString()}
                              </td>
                              <td className="p-4 align-middle text-right">
                                <div className="flex justify-end gap-2">
                                  {transaction.status === "pending" && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-green-500 hover:text-green-600 hover:bg-green-100"
                                        onClick={() => handleApproveTransaction(transaction)}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-red-500 hover:text-red-600 hover:bg-red-100" 
                                        onClick={() => handleRejectTransaction(transaction)}
                                      >
                                        <XCircle className="h-4 w-4 mr-1" /> Reject
                                      </Button>
                                    </>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8"
                                    onClick={() => setSelectedTransaction(transaction)}
                                  >
                                    Details
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Transaction details dialog */}
          {selectedTransaction && (
            <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Transaction Details</DialogTitle>
                  <DialogDescription>Details of transaction #{selectedTransaction.id}</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 rounded-md bg-muted">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <div className="flex items-center mt-1">
                        {selectedTransaction.status === "completed" ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        ) : selectedTransaction.status === "pending" ? (
                          <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                        )}
                        <span className="font-medium capitalize">{selectedTransaction.status}</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="text-lg font-bold">
                        {formatCurrency(Math.abs(parseFloat(selectedTransaction.amount.toString())))}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Transaction ID</p>
                      <p className="font-medium">{selectedTransaction.id}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">User ID</p>
                      <p className="font-medium">{selectedTransaction.userId}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium capitalize">{selectedTransaction.type}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">
                        {new Date(selectedTransaction.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {selectedTransaction.txHash && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Transaction Hash</p>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted p-2 rounded text-xs flex-1 overflow-x-auto">
                          {selectedTransaction.txHash}
                        </code>
                        <Button 
                          size="icon" 
                          variant="outline"
                          onClick={() => copyToClipboard(selectedTransaction.txHash || "")}
                        >
                          {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {selectedTransaction.status === "pending" && (
                    <div className="flex justify-end gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        className="text-red-500" 
                        onClick={() => {
                          setRejectDialogOpen(true);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" /> Reject
                      </Button>
                      <Button 
                        variant="default"
                        onClick={() => {
                          setConfirmDialogOpen(true);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" /> Approve
                      </Button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          {/* Confirm approval dialog */}
          <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Confirm Transaction Approval</DialogTitle>
                <DialogDescription>
                  Are you sure you want to approve this transaction? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              
              {selectedTransaction && (
                <div className="space-y-4">
                  <div className="p-4 rounded-md bg-muted">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Transaction ID</p>
                        <p className="font-medium">{selectedTransaction.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Amount</p>
                        <p className="font-bold">
                          {formatCurrency(Math.abs(parseFloat(selectedTransaction.amount.toString())))}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setConfirmDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="default"
                      onClick={() => approveMutation.mutate(selectedTransaction.id)}
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending ? "Approving..." : "Confirm Approval"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          {/* Confirm rejection dialog */}
          <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Confirm Transaction Rejection</DialogTitle>
                <DialogDescription>
                  Are you sure you want to reject this transaction? If this is a withdrawal, funds will be returned to the user's account.
                </DialogDescription>
              </DialogHeader>
              
              {selectedTransaction && (
                <div className="space-y-4">
                  <div className="p-4 rounded-md bg-muted">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Transaction ID</p>
                        <p className="font-medium">{selectedTransaction.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Amount</p>
                        <p className="font-bold">
                          {formatCurrency(Math.abs(parseFloat(selectedTransaction.amount.toString())))}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setRejectDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => rejectMutation.mutate(selectedTransaction.id)}
                      disabled={rejectMutation.isPending}
                    >
                      {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Layout>
  );
}
