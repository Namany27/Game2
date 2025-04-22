import mongoose from 'mongoose';

// Define Mongoose schemas
const userSchema = new mongoose.Schema({
  _id: Number,
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: String, default: "0.00" },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const transactionSchema = new mongoose.Schema({
  _id: Number,
  userId: { type: Number, required: true },
  type: { type: String, required: true },
  amount: { type: String, required: true },
  status: { type: String, default: 'pending' },
  txHash: { type: String, default: null },
  gameId: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now }
});

const gameSchema = new mongoose.Schema({
  _id: Number,
  name: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String, required: true },
  houseEdge: { type: String, required: true },
  minBet: { type: String, required: true },
  maxBet: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  imageUrl: { type: String, required: true }
});

const gameSessionSchema = new mongoose.Schema({
  _id: Number,
  userId: { type: Number, required: true },
  gameId: { type: Number, required: true },
  bet: { type: String, required: true },
  result: { type: mongoose.Schema.Types.Mixed, required: true },
  win: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Counter collection for auto-incrementing IDs
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

// Create Mongoose models
export const UserModel = mongoose.model('User', userSchema);
export const TransactionModel = mongoose.model('Transaction', transactionSchema);
export const GameModel = mongoose.model('Game', gameSchema);
export const GameSessionModel = mongoose.model('GameSession', gameSessionSchema);
export const CounterModel = mongoose.model('Counter', counterSchema);

// Function to get the next sequence value for auto-incrementing IDs
export async function getNextSequence(name: string): Promise<number> {
  const counter = await CounterModel.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}