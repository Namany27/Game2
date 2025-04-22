import { users, transactions, games, gameSessions } from "@shared/schema";
import type { User, InsertUser, Transaction, InsertTransaction, Game, InsertGame, GameSession, InsertGameSession } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, amount: number): Promise<User>;
  
  // Transaction methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  updateTransactionStatus(id: number, status: string): Promise<Transaction>;
  
  // Game methods
  getGames(): Promise<Game[]>;
  getGame(id: number): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGameHouseEdge(id: number, houseEdge: number): Promise<Game>;
  updateGameStatus(id: number, isActive: boolean): Promise<Game>;
  
  // Game session methods
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  getUserGameSessions(userId: number): Promise<GameSession[]>;
  getRecentWins(limit: number): Promise<GameSession[]>;
  
  // Admin methods
  getAdminStats(): Promise<{
    totalUsers: number;
    totalDeposits: number;
    totalWithdrawals: number;
    houseProfit: number;
  }>;
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private games: Map<number, Game>;
  private gameSessions: Map<number, GameSession>;
  currentUserId: number;
  currentTransactionId: number;
  currentGameId: number;
  currentGameSessionId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.games = new Map();
    this.gameSessions = new Map();
    this.currentUserId = 1;
    this.currentTransactionId = 1;
    this.currentGameId = 1;
    this.currentGameSessionId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Initialize with some default games
    this.initializeGames();
  }

  private initializeGames() {
    const defaultGames: InsertGame[] = [
      {
        name: "Crypto Slots",
        type: "slots",
        description: "Win up to 100x your bet!",
        imageUrl: "https://images.unsplash.com/photo-1606167668584-78701c57f13d",
        houseEdge: 50.00,
        minBet: 1.00,
        maxBet: 1000.00,
        isActive: true
      },
      {
        name: "Crypto Roulette",
        type: "roulette",
        description: "Classic game with a twist",
        imageUrl: "https://images.unsplash.com/photo-1601370552761-6275ee27c034",
        houseEdge: 50.00,
        minBet: 1.00,
        maxBet: 500.00,
        isActive: true
      },
      {
        name: "Blackjack Pro",
        type: "blackjack",
        description: "Test your skill and luck",
        imageUrl: "https://images.unsplash.com/photo-1511193311914-0346f16efe90",
        houseEdge: 50.00,
        minBet: 5.00,
        maxBet: 1000.00,
        isActive: true
      }
    ];
    
    defaultGames.forEach(game => this.createGame(game));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      balance: "0.00",
      isAdmin: false,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserBalance(userId: number, amount: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const newBalance = parseFloat(user.balance.toString()) + amount;
    const updatedUser = { ...user, balance: newBalance.toFixed(2) };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Transaction methods
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const now = new Date();
    const newTransaction: Transaction = { ...transaction, id, createdAt: now };
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }
  
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }
  
  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async updateTransactionStatus(id: number, status: string): Promise<Transaction> {
    const transaction = await this.getTransaction(id);
    if (!transaction) throw new Error("Transaction not found");
    
    const updatedTransaction = { ...transaction, status };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  // Game methods
  async getGames(): Promise<Game[]> {
    return Array.from(this.games.values());
  }
  
  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }
  
  async createGame(game: InsertGame): Promise<Game> {
    const id = this.currentGameId++;
    const newGame: Game = { ...game, id };
    this.games.set(id, newGame);
    return newGame;
  }
  
  async updateGameHouseEdge(id: number, houseEdge: number): Promise<Game> {
    const game = await this.getGame(id);
    if (!game) throw new Error("Game not found");
    
    const updatedGame = { ...game, houseEdge };
    this.games.set(id, updatedGame);
    return updatedGame;
  }
  
  async updateGameStatus(id: number, isActive: boolean): Promise<Game> {
    const game = await this.getGame(id);
    if (!game) throw new Error("Game not found");
    
    const updatedGame = { ...game, isActive };
    this.games.set(id, updatedGame);
    return updatedGame;
  }

  // Game session methods
  async createGameSession(session: InsertGameSession): Promise<GameSession> {
    const id = this.currentGameSessionId++;
    const now = new Date();
    const newSession: GameSession = { ...session, id, createdAt: now };
    this.gameSessions.set(id, newSession);
    
    // Update user balance
    await this.updateUserBalance(session.userId, parseFloat(session.win.toString()));
    
    // Create transaction for the game result
    const transactionType = parseFloat(session.win.toString()) > 0 ? "win" : "loss";
    await this.createTransaction({
      userId: session.userId,
      amount: session.win.toString(),
      type: transactionType,
      status: "completed",
      gameId: session.gameId
    });
    
    return newSession;
  }
  
  async getUserGameSessions(userId: number): Promise<GameSession[]> {
    return Array.from(this.gameSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getRecentWins(limit: number): Promise<GameSession[]> {
    return Array.from(this.gameSessions.values())
      .filter(session => parseFloat(session.win.toString()) > 0)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // Admin methods
  async getAdminStats(): Promise<{
    totalUsers: number;
    totalDeposits: number;
    totalWithdrawals: number;
    houseProfit: number;
  }> {
    const totalUsers = this.users.size;
    
    const deposits = Array.from(this.transactions.values())
      .filter(tx => tx.type === "deposit" && tx.status === "completed")
      .reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0);
    
    const withdrawals = Array.from(this.transactions.values())
      .filter(tx => tx.type === "withdrawal" && tx.status === "completed")
      .reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0);
    
    const playerWins = Array.from(this.transactions.values())
      .filter(tx => tx.type === "win")
      .reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0);
    
    const playerLosses = Array.from(this.transactions.values())
      .filter(tx => tx.type === "loss")
      .reduce((sum, tx) => sum + Math.abs(parseFloat(tx.amount.toString())), 0);
    
    const houseProfit = playerLosses - playerWins;
    
    return {
      totalUsers,
      totalDeposits: deposits,
      totalWithdrawals: withdrawals,
      houseProfit
    };
  }
}

// Import MongoDB storage implementation
import { MongoDBStorage } from './mongodb-storage';

// Select the storage implementation based on environment
let storageImplementation: IStorage;

// Check if MONGODB_URI is provided, use MongoDB storage
if (process.env.MONGODB_URI) {
  console.log('Using MongoDB storage');
  storageImplementation = new MongoDBStorage();
} else {
  console.log('Using in-memory storage (MONGODB_URI not provided)');
  storageImplementation = new MemStorage();
}

export const storage = storageImplementation;
