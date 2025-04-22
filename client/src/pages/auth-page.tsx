import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dice5, 
  DollarSign, 
  Trophy, 
  Lock, 
  Zap, 
  Coins, 
  Clock, 
  Shield,
  Gift,
  CreditCard
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Game } from "@shared/schema";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");
  
  // Fetch games for displaying previews
  const { data: games = [] } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });
  
  // If user is already logged in, redirect to home
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  function onLoginSubmit(values: LoginValues) {
    loginMutation.mutate(values);
  }

  function onRegisterSubmit(values: RegisterValues) {
    registerMutation.mutate(values);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-gray-900 via-background to-gray-900 pt-12 pb-24 md:pt-24 md:pb-48">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]"></div>
          
          {/* Logo and brand */}
          <div className="container mx-auto px-4">
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <Dice5 className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold">CryptoCasino</h1>
              </div>
            </div>
            
            <div className="text-center max-w-4xl mx-auto mb-12">
              <h1 className="text-4xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-primary animate-gradient mb-6">
                The Future of Crypto Gambling
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Experience provably fair games, instant deposits and withdrawals, 
                and the highest win rates in the industry.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>Provably Fair</span>
                </div>
                <div className="flex items-center gap-2 bg-secondary/10 px-4 py-2 rounded-full">
                  <Zap className="h-5 w-5 text-secondary" />
                  <span>Instant Withdrawals</span>
                </div>
                <div className="flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-full">
                  <Gift className="h-5 w-5 text-accent" />
                  <span>Daily Bonuses</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Curve separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="fill-background">
            <path d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,218.7C672,203,768,149,864,128C960,107,1056,117,1152,138.7C1248,160,1344,192,1392,208L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-grow">
        <div className="container mx-auto px-4 -mt-20 md:-mt-32 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Auth Form */}
            <div className="lg:order-2">
              <div className="bg-card shadow-xl rounded-xl border border-border p-6 max-w-md mx-auto">
                <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold mb-1">Welcome Back</h2>
                      <p className="text-muted-foreground">
                        Enter your credentials to access your account
                      </p>
                    </div>
                    
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Enter your password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full" 
                          size="lg"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? "Logging in..." : "Login"}
                        </Button>
                      </form>
                    </Form>
                    
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                      Don't have an account?{" "}
                      <button 
                        onClick={() => setActiveTab("register")}
                        className="text-primary hover:underline"
                      >
                        Sign Up
                      </button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="register">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold mb-1">Join CryptoCasino</h2>
                      <p className="text-muted-foreground">
                        Register to start playing and winning with USDT
                      </p>
                    </div>
                    
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Choose a username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="your@email.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Create a password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Confirm your password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full" 
                          size="lg"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? "Creating account..." : "Create Account"}
                        </Button>
                      </form>
                    </Form>
                    
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <button 
                        onClick={() => setActiveTab("login")}
                        className="text-primary hover:underline"
                      >
                        Login
                      </button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            {/* Feature showcase */}
            <div className="lg:order-1">
              <h2 className="text-3xl font-bold mb-8">Why Choose CryptoCasino?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-card/50 backdrop-blur">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                      <Trophy className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Highest Win Rates</h3>
                    <p className="text-muted-foreground">
                      Our games offer the highest RTP in the industry, giving you the best chance to win big.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-card/50 backdrop-blur">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
                      <DollarSign className="h-6 w-6 text-secondary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">USDT Transactions</h3>
                    <p className="text-muted-foreground">
                      Deposit and withdraw using USDT for stable and secure crypto transactions.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-card/50 backdrop-blur">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                      <Lock className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Secure Platform</h3>
                    <p className="text-muted-foreground">
                      Your funds and personal information are protected with industry-leading security.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-card/50 backdrop-blur">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Instant Withdrawals</h3>
                    <p className="text-muted-foreground">
                      Access your winnings instantly with our lightning-fast withdrawal system.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        
        {/* Game showcase */}
        <div className="container mx-auto px-4 py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Games</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Register now to access our collection of exciting crypto games with provably fair gameplay
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {games.slice(0, 3).map((game) => (
              <Card key={game.id} className="overflow-hidden bg-card/50 backdrop-blur">
                <div className="h-40 bg-muted flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80 z-10"></div>
                  
                  {game.type === "slots" && (
                    <div className="flex gap-2">
                      {["🍒", "💎", "7️⃣", "🎰", "💰"].map((symbol, i) => (
                        <div key={i} className="text-4xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>
                          {symbol}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {game.type === "roulette" && (
                    <div className="w-32 h-32 rounded-full border-4 border-secondary flex items-center justify-center relative animate-spin-slow">
                      <div className="absolute w-full h-full rounded-full flex items-center justify-center">
                        {[0, 32, 15, 19, 4, 21, 2, 25].map((num, i) => (
                          <div 
                            key={i} 
                            className="absolute transform -translate-y-1/2" 
                            style={{ 
                              top: "50%", 
                              left: "50%", 
                              transform: `rotate(${i * 45}deg) translateY(-30px)` 
                            }}
                          >
                            <span className={`text-xs ${num % 2 === 0 ? "text-red-500" : "text-gray-200"}`}>
                              {num}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  )}
                  
                  {game.type === "blackjack" && (
                    <div className="flex gap-4">
                      <div className="w-16 h-24 rounded bg-white text-black flex items-center justify-center text-xl font-bold">
                        A♠
                      </div>
                      <div className="w-16 h-24 rounded bg-white text-black flex items-center justify-center text-xl font-bold">
                        10♥
                      </div>
                    </div>
                  )}
                </div>
                
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">{game.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{game.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Min bet:</span>{" "}
                      <span className="font-medium">{game.minBet} USDT</span>
                    </div>
                    <Button variant="outline" disabled>Play Now</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Testimonials & Stats */}
        <div className="bg-gradient-to-b from-background to-muted/20 py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Trusted by Crypto Gamblers Worldwide</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Join thousands of players who trust CryptoCasino for a secure and exciting gaming experience
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              <Card className="text-center p-6">
                <div className="text-3xl font-bold text-primary mb-2">25,000+</div>
                <div className="text-muted-foreground">Active Players</div>
              </Card>
              
              <Card className="text-center p-6">
                <div className="text-3xl font-bold text-secondary mb-2">$4.2M+</div>
                <div className="text-muted-foreground">Paid Out</div>
              </Card>
              
              <Card className="text-center p-6">
                <div className="text-3xl font-bold text-accent mb-2">12</div>
                <div className="text-muted-foreground">Unique Games</div>
              </Card>
              
              <Card className="text-center p-6">
                <div className="text-3xl font-bold text-primary mb-2">100%</div>
                <div className="text-muted-foreground">Secure Payments</div>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-6">
                <div className="flex justify-between mb-4">
                  <div className="flex gap-2">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                      <span className="font-semibold">JD</span>
                    </div>
                    <div>
                      <div className="font-semibold">John D.</div>
                      <div className="text-xs text-muted-foreground">Verified Player</div>
                    </div>
                  </div>
                  <div className="flex text-yellow-500">
                    {"★★★★★".split("").map((star, i) => (
                      <span key={i}>{star}</span>
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground">
                  "I've tried many crypto casinos, but CryptoCasino offers the best experience by far. 
                  Fast withdrawals and great customer service."
                </p>
              </Card>
              
              <Card className="p-6">
                <div className="flex justify-between mb-4">
                  <div className="flex gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="font-semibold">SM</span>
                    </div>
                    <div>
                      <div className="font-semibold">Sarah M.</div>
                      <div className="text-xs text-muted-foreground">Verified Player</div>
                    </div>
                  </div>
                  <div className="flex text-yellow-500">
                    {"★★★★★".split("").map((star, i) => (
                      <span key={i}>{star}</span>
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground">
                  "The slots are awesome and the provably fair system gives me confidence that 
                  everything is legitimate. Love winning big here!"
                </p>
              </Card>
              
              <Card className="p-6">
                <div className="flex justify-between mb-4">
                  <div className="flex gap-2">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="font-semibold">RL</span>
                    </div>
                    <div>
                      <div className="font-semibold">Robert L.</div>
                      <div className="text-xs text-muted-foreground">Verified Player</div>
                    </div>
                  </div>
                  <div className="flex text-yellow-500">
                    {"★★★★★".split("").map((star, i) => (
                      <span key={i}>{star}</span>
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground">
                  "I've won several big jackpots and always received my payouts within minutes. 
                  The games are fun and the platform is very user-friendly."
                </p>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Call to action */}
        <div className="bg-card border-t border-border py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Playing?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Create your account now to access all our exciting games and start winning with USDT
            </p>
            
            <Button size="lg" className="px-8" onClick={() => setActiveTab("register")}>
              Create Your Account
            </Button>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Dice5 className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold">CryptoCasino</h2>
            </div>
            
            <div className="flex gap-6">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Support
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Responsible Gaming
              </a>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>
              CryptoCasino © {new Date().getFullYear()}. All rights reserved. 18+ Gamble responsibly.
            </p>
          </div>
        </div>
      </footer>
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 5s linear infinite;
        }
        
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 4s ease infinite;
        }
      `}</style>
    </div>
  );
}
