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
  
  app.get("/api/admin/transactions", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    const allTransactions = Array.from(
      (await Promise.all(
        Array.from(await storage.getGames()).map(game => 
          storage.getUserTransactions(game.id)
        )
      )).flat()
    );
    
    res.json(allTransactions);
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
  
  app.post("/api/admin/games/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
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

  const httpServer = createServer(app);
  return httpServer;
}
