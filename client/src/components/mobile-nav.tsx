import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { Home, Gamepad2, Wallet, User, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CryptoInput } from "@/components/ui/crypto-input";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [open, setOpen] = useState(false);
  
  const depositMutation = useMutation({
    mutationFn: async (data: { amount: string, txHash: string }) => {
      return apiRequest("POST", "/api/transactions/deposit", data);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Deposit successful",
        description: `${amount} USDT has been added to your account.`,
      });
      setAmount("");
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Deposit failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleDeposit = () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
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
      amount, 
      txHash
    });
  };

  const navItems = [
    { path: "/", label: "Home", icon: <Home className="text-lg" /> },
    { path: "/games", label: "Games", icon: <Gamepad2 className="text-lg" /> },
    { path: "/profile", label: "Profile", icon: <User className="text-lg" /> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-muted border-t border-border py-2 px-4 z-20">
      <div className="flex justify-between items-center">
        {navItems.map((item, index) => (
          <Link 
            key={index} 
            href={item.path}
            className={cn(
              "flex flex-col items-center",
              location === item.path ? "text-primary" : "text-muted-foreground"
            )}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <div className="flex flex-col items-center">
              <button className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white -mt-5 shadow-md">
                <Plus className="text-lg" />
              </button>
              <span className="text-xs mt-1 text-muted-foreground">Deposit</span>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Deposit USDT</h3>
              
              <div className="space-y-4">
                <CryptoInput
                  value={amount}
                  onChange={setAmount}
                  minValue={10}
                  maxValue={10000}
                />
                
                <div className="py-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Send USDT to the following address:
                  </p>
                  <div className="bg-background p-3 rounded border border-border text-sm font-mono break-all">
                    TRC20: TTAGHnoLCFzLSmW18H7CU45nzjpcyPr9oN
                  </div>
                </div>
                
                <Button
                  className="w-full"
                  onClick={handleDeposit}
                  disabled={depositMutation.isPending}
                >
                  {depositMutation.isPending ? "Processing..." : "Complete Deposit"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        <Link 
          href="/wallet"
          className={cn(
            "flex flex-col items-center",
            location === "/wallet" ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Wallet className="text-lg" />
          <span className="text-xs mt-1">Wallet</span>
        </Link>
      </div>
    </div>
  );
}
