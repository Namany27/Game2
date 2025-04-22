import { pgTable, text, serial, integer, boolean, timestamp, jsonb, numeric, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  balance: numeric("balance", { precision: 18, scale: 2 }).notNull().default("0"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  type: text("type").notNull(), // 'deposit', 'withdrawal', 'win', 'loss'
  status: text("status").notNull().default("pending"), // 'pending', 'completed', 'failed'
  gameId: integer("game_id").references(() => games.id),
  txHash: text("tx_hash"), // For crypto transactions
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  amount: true,
  type: true,
  status: true,
  gameId: true,
  txHash: true,
});

// Games table
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type").notNull(), // 'slots', 'roulette', 'blackjack'
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  houseEdge: numeric("house_edge", { precision: 5, scale: 2 }).notNull().default("50.00"), // Percentage
  minBet: numeric("min_bet", { precision: 18, scale: 2 }).notNull(),
  maxBet: numeric("max_bet", { precision: 18, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertGameSchema = createInsertSchema(games).pick({
  name: true,
  type: true,
  description: true,
  imageUrl: true,
  houseEdge: true,
  minBet: true,
  maxBet: true,
  isActive: true,
});

// Game Sessions table
export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameId: integer("game_id").notNull().references(() => games.id),
  bet: numeric("bet", { precision: 18, scale: 2 }).notNull(),
  result: jsonb("result").notNull(), // Stores game-specific result data
  win: numeric("win", { precision: 18, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).pick({
  userId: true,
  gameId: true,
  bet: true,
  result: true,
  win: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;

export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
