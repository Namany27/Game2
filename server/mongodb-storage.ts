import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import createMemoryStore from "memorystore";
import { IStorage } from './storage';
import { 
  User,
  InsertUser,
  Transaction,
  InsertTransaction,
  Game,
  InsertGame,
  GameSession,
  InsertGameSession
} from '@shared/schema';

// Import mongoose models
import {
  UserModel,
  TransactionModel,
  GameModel,
  GameSessionModel,
  getNextSequence
} from './mongodb-models';

// MongoDB implementation of IStorage
export class MongoDBStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    try {
      // Initialize the MongoDB session store
      this.sessionStore = MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions'
      });
      
      // Connect to MongoDB and initialize only if connection successful
      this.connect().then(connected => {
        if (connected) {
          // Initialize the database with default data
          this.initialize();
        }
      }).catch(err => {
        console.error("Failed to initialize MongoDB:", err);
      });
    } catch (error) {
      console.error("Error creating MongoDB store:", error);
      // Create an in-memory store as fallback
      const MemoryStore = createMemoryStore(session);
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000,
      });
    }
  }

  private async connect() {
    try {
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not set');
      }
      
      console.log('Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        family: 4 // Use IPv4, skip trying IPv6
      });
      console.log('Connected to MongoDB successfully');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      console.log('Falling back to in-memory storage');
      // Instead of throwing, we'll let it continue and use in-memory storage
      return false;
    }
    return true;
  }

  private async initialize() {
    try {
      // Check if we have any games already
      const gamesCount = await GameModel.countDocuments();
      
      if (gamesCount === 0) {
        console.log('Initializing default games...');
        // Add default games
        await GameModel.insertMany([
          {
            _id: await getNextSequence('gameId'),
            name: 'Crypto Slots',
            type: 'slots',
            description: 'Classic slot machine with crypto symbols. Match 3 to win!',
            houseEdge: "50.00", // 50% house edge
            minBet: "1.00",
            maxBet: "100.00",
            isActive: true,
            imageUrl: '/assets/games/slots.jpg'
          },
          {
            _id: await getNextSequence('gameId'),
            name: 'Blockchain Roulette',
            type: 'roulette',
            description: 'European roulette with 37 numbers. Place your bets!',
            houseEdge: "50.00",
            minBet: "1.00",
            maxBet: "500.00",
            isActive: true,
            imageUrl: '/assets/games/roulette.jpg'
          },
          {
            _id: await getNextSequence('gameId'),
            name: 'Crypto Blackjack',
            type: 'blackjack',
            description: 'Classic blackjack game. Get as close to 21 as possible without going over!',
            houseEdge: "50.00",
            minBet: "5.00",
            maxBet: "1000.00",
            isActive: true,
            imageUrl: '/assets/games/blackjack.jpg'
          }
        ]);
      }
      
      // Check if we have an admin user
      const adminCount = await UserModel.countDocuments({ isAdmin: true });
      
      if (adminCount === 0) {
        console.log('Creating admin user...');
        // Create admin user
        await UserModel.create({
          _id: await getNextSequence('userId'),
          username: 'admin',
          email: 'admin@example.com',
          password: '$2a$10$XVK4MkKqiXLF5U0ID.LMPOGl0/DyCePvO/6C9REF4RMwSeS9U1O5q', // hashed 'admin123'
          balance: "10000.00",
          isAdmin: true
        });
        console.log('Admin user created');
      }
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const user = await UserModel.findById(id).lean();
    if (!user) return undefined;
    
    return {
      id: user._id,
      username: user.username,
      email: user.email,
      password: user.password,
      balance: user.balance,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ username }).lean();
    if (!user) return undefined;
    
    return {
      id: user._id,
      username: user.username,
      email: user.email,
      password: user.password,
      balance: user.balance,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ email }).lean();
    if (!user) return undefined;
    
    return {
      id: user._id,
      username: user.username,
      email: user.email,
      password: user.password,
      balance: user.balance,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt
    };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = await getNextSequence('userId');
    const now = new Date();
    
    const newUser = await UserModel.create({
      _id: id,
      ...insertUser,
      balance: "0.00",
      isAdmin: false,
      createdAt: now
    });
    
    return {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      password: newUser.password,
      balance: newUser.balance,
      isAdmin: newUser.isAdmin,
      createdAt: newUser.createdAt
    };
  }

  async updateUserBalance(userId: number, amount: number): Promise<User> {
    const user = await UserModel.findById(userId).lean();
    if (!user) throw new Error(`User with ID ${userId} not found`);
    
    const currentBalance = parseFloat(user.balance);
    const newBalance = (currentBalance + amount).toFixed(2);
    
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { balance: newBalance },
      { new: true }
    ).lean();
    
    if (!updatedUser) throw new Error(`User with ID ${userId} not found`);
    
    return {
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      password: updatedUser.password,
      balance: updatedUser.balance,
      isAdmin: updatedUser.isAdmin,
      createdAt: updatedUser.createdAt
    };
  }

  // Transaction methods
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = await getNextSequence('transactionId');
    const now = new Date();
    
    const newTransaction = await TransactionModel.create({
      _id: id,
      ...transaction,
      createdAt: now
    });
    
    return {
      id: newTransaction._id,
      userId: newTransaction.userId,
      type: newTransaction.type,
      amount: newTransaction.amount,
      status: newTransaction.status,
      txHash: newTransaction.txHash,
      gameId: newTransaction.gameId,
      createdAt: newTransaction.createdAt
    };
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const transaction = await TransactionModel.findById(id).lean();
    if (!transaction) return undefined;
    
    return {
      id: transaction._id,
      userId: transaction.userId,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      txHash: transaction.txHash,
      gameId: transaction.gameId,
      createdAt: transaction.createdAt
    };
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    const transactions = await TransactionModel.find({ userId }).sort({ createdAt: -1 }).lean();
    
    return transactions.map(tx => ({
      id: tx._id,
      userId: tx.userId,
      type: tx.type,
      amount: tx.amount,
      status: tx.status,
      txHash: tx.txHash,
      gameId: tx.gameId,
      createdAt: tx.createdAt
    }));
  }

  async updateTransactionStatus(id: number, status: string): Promise<Transaction> {
    const transaction = await TransactionModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean();
    
    if (!transaction) throw new Error(`Transaction with ID ${id} not found`);
    
    return {
      id: transaction._id,
      userId: transaction.userId,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      txHash: transaction.txHash,
      gameId: transaction.gameId,
      createdAt: transaction.createdAt
    };
  }

  // Game methods
  async getGames(): Promise<Game[]> {
    const games = await GameModel.find().lean();
    
    return games.map(game => ({
      id: game._id,
      name: game.name,
      type: game.type,
      description: game.description,
      houseEdge: game.houseEdge,
      minBet: game.minBet,
      maxBet: game.maxBet,
      isActive: game.isActive,
      imageUrl: game.imageUrl
    }));
  }

  async getGame(id: number): Promise<Game | undefined> {
    const game = await GameModel.findById(id).lean();
    if (!game) return undefined;
    
    return {
      id: game._id,
      name: game.name,
      type: game.type,
      description: game.description,
      houseEdge: game.houseEdge,
      minBet: game.minBet,
      maxBet: game.maxBet,
      isActive: game.isActive,
      imageUrl: game.imageUrl
    };
  }

  async createGame(game: InsertGame): Promise<Game> {
    const id = await getNextSequence('gameId');
    
    const newGame = await GameModel.create({
      _id: id,
      ...game
    });
    
    return {
      id: newGame._id,
      name: newGame.name,
      type: newGame.type,
      description: newGame.description,
      houseEdge: newGame.houseEdge,
      minBet: newGame.minBet,
      maxBet: newGame.maxBet,
      isActive: newGame.isActive,
      imageUrl: newGame.imageUrl
    };
  }

  async updateGameHouseEdge(id: number, houseEdge: number): Promise<Game> {
    const game = await GameModel.findByIdAndUpdate(
      id,
      { houseEdge: houseEdge.toFixed(2) },
      { new: true }
    ).lean();
    
    if (!game) throw new Error(`Game with ID ${id} not found`);
    
    return {
      id: game._id,
      name: game.name,
      type: game.type,
      description: game.description,
      houseEdge: game.houseEdge,
      minBet: game.minBet,
      maxBet: game.maxBet,
      isActive: game.isActive,
      imageUrl: game.imageUrl
    };
  }

  async updateGameStatus(id: number, isActive: boolean): Promise<Game> {
    const game = await GameModel.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).lean();
    
    if (!game) throw new Error(`Game with ID ${id} not found`);
    
    return {
      id: game._id,
      name: game.name,
      type: game.type,
      description: game.description,
      houseEdge: game.houseEdge,
      minBet: game.minBet,
      maxBet: game.maxBet,
      isActive: game.isActive,
      imageUrl: game.imageUrl
    };
  }

  // Game session methods
  async createGameSession(session: InsertGameSession): Promise<GameSession> {
    const id = await getNextSequence('gameSessionId');
    const now = new Date();
    
    const newSession = await GameSessionModel.create({
      _id: id,
      ...session,
      createdAt: now
    });
    
    return {
      id: newSession._id,
      userId: newSession.userId,
      gameId: newSession.gameId,
      bet: newSession.bet,
      result: newSession.result,
      win: newSession.win,
      createdAt: newSession.createdAt
    };
  }

  async getUserGameSessions(userId: number): Promise<GameSession[]> {
    const sessions = await GameSessionModel.find({ userId }).sort({ createdAt: -1 }).lean();
    
    return sessions.map(session => ({
      id: session._id,
      userId: session.userId,
      gameId: session.gameId,
      bet: session.bet,
      result: session.result,
      win: session.win,
      createdAt: session.createdAt
    }));
  }

  async getRecentWins(limit: number): Promise<GameSession[]> {
    const sessions = await GameSessionModel.find({ win: { $gt: 0 } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    return sessions.map(session => ({
      id: session._id,
      userId: session.userId,
      gameId: session.gameId,
      bet: session.bet,
      result: session.result,
      win: session.win,
      createdAt: session.createdAt
    }));
  }

  // Admin methods
  async getAdminStats(): Promise<{
    totalUsers: number;
    totalDeposits: number;
    totalWithdrawals: number;
    houseProfit: number;
  }> {
    const totalUsers = await UserModel.countDocuments();
    
    const deposits = await TransactionModel.find({
      type: 'deposit',
      status: 'completed'
    });
    
    const withdrawals = await TransactionModel.find({
      type: 'withdrawal',
      status: 'completed'
    });
    
    const totalDeposits = deposits.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const totalWithdrawals = withdrawals.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    
    // Calculate house profit (from game sessions)
    const gameSessions = await GameSessionModel.find();
    const totalBets = gameSessions.reduce((sum, session) => sum + parseFloat(session.bet), 0);
    const totalWins = gameSessions.reduce((sum, session) => sum + parseFloat(session.win), 0);
    const gameProfit = totalBets - totalWins;
    
    // Total house profit is game profit plus deposit/withdrawal difference
    const houseProfit = gameProfit + (totalDeposits - totalWithdrawals);
    
    return {
      totalUsers,
      totalDeposits,
      totalWithdrawals,
      houseProfit
    };
  }
}