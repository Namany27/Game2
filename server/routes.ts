import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupGameRoutes } from "./games";
import { z } from "zod";
import { insertTransactionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Setup game routes
  setupGameRoutes(app);

  // Transaction routes
  app.post("/api/transactions/deposit", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const depositSchema = insertTransactionSchema.pick({
      amount: true,
      txHash: true,
    });
    
    try {
      const validatedData = depositSchema.parse(req.body);
      
      const transaction = await storage.createTransaction({
        userId: req.user.id,
        amount: validatedData.amount,
        type: "deposit",
        status: "completed", // In a real app, this would be pending until confirmed
        txHash: validatedData.txHash,
      });
      
      // Update user balance
      const user = await storage.updateUserBalance(
        req.user.id,
        parseFloat(validatedData.amount.toString())
      );
      
      res.status(201).json({ transaction, balance: user.balance });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to process deposit" });
    }
  });
  
  app.post("/api/transactions/withdraw", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const withdrawSchema = insertTransactionSchema.pick({
      amount: true,
    }).extend({
      address: z.string().min(1)
    });
    
    try {
      const validatedData = withdrawSchema.parse(req.body);
      const amount = parseFloat(validatedData.amount.toString());
      
      // Check if user has enough balance
      if (parseFloat(req.user.balance.toString()) < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      const transaction = await storage.createTransaction({
        userId: req.user.id,
        amount: (-amount).toString(), // Negative amount for withdrawal
        type: "withdrawal",
        status: "pending", // Admin needs to approve
      });
      
      // Update user balance
      const user = await storage.updateUserBalance(req.user.id, -amount);
      
      res.status(201).json({ transaction, balance: user.balance });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to process withdrawal" });
    }
  });
  
  app.get("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const transactions = await storage.getUserTransactions(req.user.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
  
  // Game routes
  app.get("/api/games", async (_, res) => {
    try {
      const games = await storage.getGames();
      const activeGames = games.filter(game => game.isActive);
      res.json(activeGames);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });
  
  // Recent wins
  app.get("/api/recent-wins", async (_, res) => {
    try {
      const recentWins = await storage.getRecentWins(10);
      // Join with user and game data
      const formattedWins = await Promise.all(
        recentWins.map(async (win) => {
          const user = await storage.getUser(win.userId);
          const game = await storage.getGame(win.gameId);
          
          return {
            id: win.id,
            username: user ? user.username : "Unknown",
            gameName: game ? game.name : "Unknown",
            amount: win.win,
            createdAt: win.createdAt
          };
        })
      );
      
      res.json(formattedWins);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent wins" });
    }
  });
  
  // Admin routes
  // Check if user is Owner admin (special admin)
  const isOwnerAdmin = (req) => {
    return req.isAuthenticated() && req.user.isAdmin && req.user.username === "Owner";
  };

  // Admin stats - available to all admins
  app.get("/api/admin/stats", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });
  
  // Extended admin stats - only for Owner admin
  app.get("/api/owner/extended-stats", async (req, res) => {
    if (!isOwnerAdmin(req)) {
      return res.status(403).json({ message: "Not authorized - Owner access only" });
    }
    
    try {
      // Get basic stats first
      const basicStats = await storage.getAdminStats();
      
      // Get all users count
      const users = await storage.getAllUsers();
      
      // Get all game sessions
      const sessions = await storage.getAllGameSessions();
      
      // Calculate additional metrics
      const winRatio = sessions.length > 0 
        ? sessions.filter(s => parseFloat(s.win) > 0).length / sessions.length
        : 0;
      
      const totalWagered = sessions.reduce((sum, session) => 
        sum + parseFloat(session.bet), 0);
        
      const totalWon = sessions.reduce((sum, session) => {
        const winAmount = parseFloat(session.win);
        return sum + (winAmount > 0 ? winAmount : 0);
      }, 0);
      
      const gameStats = await Promise.all((await storage.getGames()).map(async (game) => {
        const gameSessions = sessions.filter(s => s.gameId === game.id);
        const gameWagered = gameSessions.reduce((sum, s) => sum + parseFloat(s.bet), 0);
        const gameWon = gameSessions.reduce((sum, s) => {
          const winAmount = parseFloat(s.win);
          return sum + (winAmount > 0 ? winAmount : 0);
        }, 0);
        const gameProfit = gameWagered - gameWon;
        
        return {
          id: game.id,
          name: game.name,
          type: game.type,
          playCount: gameSessions.length,
          totalWagered: gameWagered.toFixed(2),
          totalWon: gameWon.toFixed(2),
          profit: gameProfit.toFixed(2),
          profitMargin: gameWagered > 0 ? (gameProfit / gameWagered * 100).toFixed(2) : "0.00",
          houseEdge: game.houseEdge
        };
      }));
      
      res.json({
        ...basicStats,
        totalUsers: users.length,
        activeUsersLast30Days: 0, // Placeholder - would need date filtering
        totalGamesPlayed: sessions.length,
        winRatio: (winRatio * 100).toFixed(2) + "%",
        totalWagered: totalWagered.toFixed(2),
        totalWon: totalWon.toFixed(2),
        houseProfit: (totalWagered - totalWon).toFixed(2),
        profitMargin: totalWagered > 0 ? ((totalWagered - totalWon) / totalWagered * 100).toFixed(2) + "%" : "0.00%",
        gameStats
      });
    } catch (error) {
      console.error("Extended stats error:", error);
      res.status(500).json({ message: "Failed to fetch extended admin stats" });
    }
  });
  
  // Get all transactions - available to all admins
  app.get("/api/admin/transactions", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    try {
      // Get all users
      const users = await storage.getAllUsers();
      
      // Get transactions for all users
      const transactions = await Promise.all(
        users.map(user => storage.getUserTransactions(user.id))
      );
      
      // Flatten and format with usernames
      const formattedTransactions = (await Promise.all(
        transactions.flat().map(async (transaction) => {
          const user = await storage.getUser(transaction.userId);
          return {
            ...transaction,
            username: user ? user.username : "Unknown"
          };
        })
      )).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(formattedTransactions);
    } catch (error) {
      console.error("Admin transactions error:", error);
      res.status(500).json({ message: "Failed to fetch admin transactions" });
    }
  });
  
  app.post("/api/admin/transactions/:id/approve", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    const transactionId = parseInt(req.params.id);
    
    try {
      const transaction = await storage.updateTransactionStatus(transactionId, "completed");
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve transaction" });
    }
  });
  
  app.post("/api/admin/transactions/:id/reject", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    const transactionId = parseInt(req.params.id);
    
    try {
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // If it's a withdrawal, return the funds to user
      if (transaction.type === "withdrawal" && transaction.status === "pending") {
        const amount = Math.abs(parseFloat(transaction.amount.toString()));
        await storage.updateUserBalance(transaction.userId, amount);
      }
      
      const updatedTransaction = await storage.updateTransactionStatus(transactionId, "rejected");
      res.json(updatedTransaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to reject transaction" });
    }
  });
  
  // Owner-only routes for managing games and settings
  app.get("/api/owner/all-users", async (req, res) => {
    if (!isOwnerAdmin(req)) {
      return res.status(403).json({ message: "Not authorized - Owner access only" });
    }
    
    try {
      const users = await storage.getAllUsers();
      const formattedUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
      }));
      
      res.json(formattedUsers);
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({ message: "Failed to fetch all users" });
    }
  });
  
  // Route for Owner to manage global settings
  app.post("/api/owner/set-global-house-edge", async (req, res) => {
    if (!isOwnerAdmin(req)) {
      return res.status(403).json({ message: "Not authorized - Owner access only" });
    }
    
    const globalEdgeSchema = z.object({
      houseEdge: z.number().min(0).max(100)
    });
    
    try {
      const { houseEdge } = globalEdgeSchema.parse(req.body);
      
      // Update house edge for all games
      const games = await storage.getGames();
      const updatedGames = await Promise.all(
        games.map(game => storage.updateGameHouseEdge(game.id, houseEdge))
      );
      
      res.json({ success: true, message: "Global house edge updated", games: updatedGames });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Set global house edge error:", error);
      res.status(500).json({ message: "Failed to update global house edge" });
    }
  });
  
  // Game-specific house edge update - now requires Owner privileges
  app.post("/api/admin/games/:id/edge", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    const gameId = parseInt(req.params.id);
    const houseEdgeSchema = z.object({
      houseEdge: z.number().min(0).max(100)
    });
    
    try {
      const { houseEdge } = houseEdgeSchema.parse(req.body);
      const game = await storage.updateGameHouseEdge(gameId, houseEdge);
      res.json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update house edge" });
    }
  });
  
  // Game status update - now requires Owner privileges
  app.post("/api/admin/games/:id/status", async (req, res) => {
    if (!isOwnerAdmin(req)) {
      return res.status(403).json({ message: "Not authorized - Owner access only" });
    }
    
    const gameId = parseInt(req.params.id);
    const statusSchema = z.object({
      isActive: z.boolean()
    });
    
    try {
      const { isActive } = statusSchema.parse(req.body);
      const game = await storage.updateGameStatus(gameId, isActive);
      res.json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update game status" });
    }
  });
  
  // Route for Owner to set winning targets
  app.post("/api/owner/set-profit-target", async (req, res) => {
    if (!isOwnerAdmin(req)) {
      return res.status(403).json({ message: "Not authorized - Owner access only" });
    }
    
    const targetSchema = z.object({
      targetProfitPercent: z.number().min(0).max(100),
      applyToAllGames: z.boolean()
    });
    
    try {
      const { targetProfitPercent, applyToAllGames } = targetSchema.parse(req.body);
      
      // Convert profit target to house edge
      // For example, if you want 50% profit, you need a house edge of 33.33%
      // (because 1 - 1/(1+0.5) ≈ 0.33)
      const calculatedHouseEdge = (1 - (1 / (1 + (targetProfitPercent / 100)))) * 100;
      const houseEdge = Math.min(Math.max(calculatedHouseEdge, 0), 90); // Cap between 0-90%
      
      if (applyToAllGames) {
        // Update all games
        const games = await storage.getGames();
        await Promise.all(
          games.map(game => storage.updateGameHouseEdge(game.id, houseEdge))
        );
        
        res.json({ 
          success: true, 
          message: `Profit target set to ${targetProfitPercent}% for all games`, 
          appliedHouseEdge: houseEdge.toFixed(2) + "%"
        });
      } else {
        res.json({ 
          success: true, 
          message: "Calculated house edge", 
          calculatedHouseEdge: houseEdge.toFixed(2) + "%",
          targetProfitPercent: targetProfitPercent + "%"
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Set profit target error:", error);
      res.status(500).json({ message: "Failed to set profit target" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
