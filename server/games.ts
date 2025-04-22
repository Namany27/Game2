import { Express } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { insertGameSessionSchema } from "@shared/schema";

export function setupGameRoutes(app: Express) {
  // Play slots
  app.post("/api/games/slots/play", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const playSchema = z.object({
      gameId: z.number(),
      bet: z.number().positive()
    });
    
    try {
      const { gameId, bet } = playSchema.parse(req.body);
      
      // Check if game exists and is active
      const game = await storage.getGame(gameId);
      if (!game || !game.isActive) {
        return res.status(404).json({ message: "Game not found or inactive" });
      }
      
      // Check if game is slots
      if (game.type !== "slots") {
        return res.status(400).json({ message: "This endpoint is for slots only" });
      }
      
      // Check if bet is within limits
      if (bet < parseFloat(game.minBet.toString()) || bet > parseFloat(game.maxBet.toString())) {
        return res.status(400).json({ 
          message: `Bet must be between ${game.minBet} and ${game.maxBet}` 
        });
      }
      
      // Check if user has enough balance
      if (parseFloat(req.user.balance.toString()) < bet) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Generate random result (3 reels)
      const symbols = ["🍒", "🍊", "🍋", "🍇", "🍉", "7️⃣", "💰", "⭐"];
      const reels = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ];
      
      // Determine win
      let multiplier = 0;
      if (reels[0] === reels[1] && reels[1] === reels[2]) {
        // Three of a kind
        if (reels[0] === "7️⃣") multiplier = 100; // Jackpot
        else if (reels[0] === "💰") multiplier = 50;
        else if (reels[0] === "⭐") multiplier = 25;
        else multiplier = 10;
      } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
        // Two of a kind
        multiplier = 2;
      }
      
      // Apply house edge
      const houseEdgeMultiplier = (100 - parseFloat(game.houseEdge.toString())) / 100;
      multiplier = multiplier * houseEdgeMultiplier;
      
      const winAmount = bet * multiplier;
      const netWin = winAmount - bet; // Can be negative if player lost
      
      // Record game session
      const gameSession = await storage.createGameSession({
        userId: req.user.id,
        gameId,
        bet: bet.toFixed(2),
        result: { reels },
        win: netWin.toFixed(2)
      });
      
      // Return result
      res.json({
        reels,
        bet,
        win: netWin,
        multiplier,
        balance: (await storage.getUser(req.user.id))?.balance
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to play slots" });
    }
  });
  
  // Play roulette
  app.post("/api/games/roulette/play", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const playSchema = z.object({
      gameId: z.number(),
      bet: z.number().positive(),
      betType: z.enum(["red", "black", "even", "odd", "high", "low", "number"]),
      betNumber: z.number().min(0).max(36).optional()
    });
    
    try {
      const { gameId, bet, betType, betNumber } = playSchema.parse(req.body);
      
      // Check if game exists and is active
      const game = await storage.getGame(gameId);
      if (!game || !game.isActive) {
        return res.status(404).json({ message: "Game not found or inactive" });
      }
      
      // Check if game is roulette
      if (game.type !== "roulette") {
        return res.status(400).json({ message: "This endpoint is for roulette only" });
      }
      
      // Check if bet is within limits
      if (bet < parseFloat(game.minBet.toString()) || bet > parseFloat(game.maxBet.toString())) {
        return res.status(400).json({ 
          message: `Bet must be between ${game.minBet} and ${game.maxBet}` 
        });
      }
      
      // Check if user has enough balance
      if (parseFloat(req.user.balance.toString()) < bet) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // If betting on a number, ensure betNumber is provided
      if (betType === "number" && betNumber === undefined) {
        return res.status(400).json({ message: "Number bet requires betNumber" });
      }
      
      // Generate random result (0-36)
      const result = Math.floor(Math.random() * 37);
      
      // Determine win
      let win = false;
      let multiplier = 0;
      
      const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      
      if (betType === "red" && redNumbers.includes(result)) {
        win = true;
        multiplier = 2;
      } else if (betType === "black" && !redNumbers.includes(result) && result !== 0) {
        win = true;
        multiplier = 2;
      } else if (betType === "even" && result % 2 === 0 && result !== 0) {
        win = true;
        multiplier = 2;
      } else if (betType === "odd" && result % 2 === 1) {
        win = true;
        multiplier = 2;
      } else if (betType === "high" && result >= 19 && result <= 36) {
        win = true;
        multiplier = 2;
      } else if (betType === "low" && result >= 1 && result <= 18) {
        win = true;
        multiplier = 2;
      } else if (betType === "number" && result === betNumber) {
        win = true;
        multiplier = 36;
      }
      
      // Apply house edge
      const houseEdgeMultiplier = (100 - parseFloat(game.houseEdge.toString())) / 100;
      multiplier = multiplier * houseEdgeMultiplier;
      
      const winAmount = win ? bet * multiplier : 0;
      const netWin = winAmount - bet; // Negative if player lost
      
      // Record game session
      const gameSession = await storage.createGameSession({
        userId: req.user.id,
        gameId,
        bet: bet.toFixed(2),
        result: { number: result, betType, betNumber },
        win: netWin.toFixed(2)
      });
      
      // Return result
      res.json({
        result,
        isRed: redNumbers.includes(result),
        bet,
        betType,
        betNumber,
        win: netWin,
        multiplier: win ? multiplier : 0,
        balance: (await storage.getUser(req.user.id))?.balance
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to play roulette" });
    }
  });
  
  // Play blackjack
  app.post("/api/games/blackjack/deal", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const playSchema = z.object({
      gameId: z.number(),
      bet: z.number().positive()
    });
    
    try {
      const { gameId, bet } = playSchema.parse(req.body);
      
      // Check if game exists and is active
      const game = await storage.getGame(gameId);
      if (!game || !game.isActive) {
        return res.status(404).json({ message: "Game not found or inactive" });
      }
      
      // Check if game is blackjack
      if (game.type !== "blackjack") {
        return res.status(400).json({ message: "This endpoint is for blackjack only" });
      }
      
      // Check if bet is within limits
      if (bet < parseFloat(game.minBet.toString()) || bet > parseFloat(game.maxBet.toString())) {
        return res.status(400).json({ 
          message: `Bet must be between ${game.minBet} and ${game.maxBet}` 
        });
      }
      
      // Check if user has enough balance
      if (parseFloat(req.user.balance.toString()) < bet) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Create a deck of cards
      const suits = ["♠", "♥", "♦", "♣"];
      const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
      let deck = [];
      
      for (const suit of suits) {
        for (const value of values) {
          deck.push({ suit, value });
        }
      }
      
      // Shuffle deck
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      
      // Deal initial cards
      const playerHand = [deck.pop(), deck.pop()];
      const dealerHand = [deck.pop(), deck.pop()];
      
      // Calculate scores
      const calculateHandValue = (hand) => {
        let value = 0;
        let aces = 0;
        
        for (const card of hand) {
          if (card.value === "A") {
            aces++;
            value += 11;
          } else if (["J", "Q", "K"].includes(card.value)) {
            value += 10;
          } else {
            value += parseInt(card.value);
          }
        }
        
        // Adjust for aces
        while (value > 21 && aces > 0) {
          value -= 10;
          aces--;
        }
        
        return value;
      };
      
      const playerValue = calculateHandValue(playerHand);
      const dealerValue = calculateHandValue(dealerHand);
      
      // Check for natural blackjack
      const playerHasBlackjack = playerValue === 21 && playerHand.length === 2;
      const dealerHasBlackjack = dealerValue === 21 && dealerHand.length === 2;
      
      let gameStatus = "in_progress";
      let netWin = 0;
      
      if (playerHasBlackjack || dealerHasBlackjack) {
        if (playerHasBlackjack && dealerHasBlackjack) {
          // Push - player gets bet back
          gameStatus = "push";
        } else if (playerHasBlackjack) {
          // Player wins 3:2
          gameStatus = "player_blackjack";
          netWin = bet * 1.5;
        } else {
          // Dealer wins
          gameStatus = "dealer_blackjack";
          netWin = -bet;
        }
        
        // Record game session for completed game
        await storage.createGameSession({
          userId: req.user.id,
          gameId,
          bet: bet.toFixed(2),
          result: { 
            playerHand, 
            dealerHand, 
            playerValue, 
            dealerValue, 
            status: gameStatus 
          },
          win: netWin.toFixed(2)
        });
      }
      
      // Return initial deal result
      res.json({
        gameId,
        playerHand,
        dealerHand: [dealerHand[0], { suit: "?", value: "?" }], // Hide dealer's hole card
        playerValue,
        dealerValue: calculateHandValue([dealerHand[0]]), // Only count visible card
        bet,
        status: gameStatus,
        canHit: gameStatus === "in_progress",
        canStand: gameStatus === "in_progress",
        canDouble: gameStatus === "in_progress" && playerHand.length === 2,
        deck: deck.map(() => ({ suit: "?", value: "?" })), // Hide remaining deck
        balance: (await storage.getUser(req.user.id))?.balance
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to deal blackjack hand" });
    }
  });
  
  // Blackjack actions (hit, stand, double)
  app.post("/api/games/blackjack/action", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const actionSchema = z.object({
      gameId: z.number(),
      action: z.enum(["hit", "stand", "double"]),
      gameState: z.object({
        playerHand: z.array(z.object({ suit: z.string(), value: z.string() })),
        dealerHand: z.array(z.object({ suit: z.string(), value: z.string() })),
        deck: z.array(z.object({ suit: z.string(), value: z.string() })),
        bet: z.number()
      })
    });
    
    try {
      const { gameId, action, gameState } = actionSchema.parse(req.body);
      
      // Restore the full deck from the hidden deck
      const suits = ["♠", "♥", "♦", "♣"];
      const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
      let fullDeck = [];
      
      // Recreate a shuffled deck matching the size of the provided deck
      for (const suit of suits) {
        for (const value of values) {
          fullDeck.push({ suit, value });
        }
      }
      
      // Shuffle fullDeck
      for (let i = fullDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
      }
      
      // Slice to match the provided deck size
      const deck = fullDeck.slice(0, gameState.deck.length);
      
      // Restore dealer's hidden card
      const dealerHand = [
        gameState.dealerHand[0],
        { suit: deck.pop().suit, value: deck.pop().value }
      ];
      
      let playerHand = [...gameState.playerHand];
      let bet = gameState.bet;
      
      // Calculate score function
      const calculateHandValue = (hand) => {
        let value = 0;
        let aces = 0;
        
        for (const card of hand) {
          if (card.value === "A") {
            aces++;
            value += 11;
          } else if (["J", "Q", "K"].includes(card.value)) {
            value += 10;
          } else {
            value += parseInt(card.value);
          }
        }
        
        // Adjust for aces
        while (value > 21 && aces > 0) {
          value -= 10;
          aces--;
        }
        
        return value;
      };
      
      // Process action
      let gameStatus = "in_progress";
      let netWin = 0;
      
      // Handle actions
      if (action === "hit") {
        playerHand.push(deck.pop());
        const playerValue = calculateHandValue(playerHand);
        
        if (playerValue > 21) {
          gameStatus = "player_bust";
          netWin = -bet;
        }
      } else if (action === "double") {
        // Check if player has enough balance
        if (parseFloat(req.user.balance.toString()) < bet) {
          return res.status(400).json({ message: "Insufficient balance to double" });
        }
        
        // Double the bet and take exactly one card
        bet *= 2;
        playerHand.push(deck.pop());
        const playerValue = calculateHandValue(playerHand);
        
        if (playerValue > 21) {
          gameStatus = "player_bust";
          netWin = -bet;
        } else {
          gameStatus = "dealer_turn";
        }
      } else if (action === "stand") {
        gameStatus = "dealer_turn";
      }
      
      // If it's dealer's turn, play out dealer hand
      if (gameStatus === "dealer_turn") {
        let dealerValue = calculateHandValue(dealerHand);
        
        // Dealer hits on 16 or less, stands on 17 or more
        while (dealerValue < 17) {
          dealerHand.push(deck.pop());
          dealerValue = calculateHandValue(dealerHand);
        }
        
        const playerValue = calculateHandValue(playerHand);
        
        if (dealerValue > 21) {
          gameStatus = "dealer_bust";
          netWin = bet;
        } else if (dealerValue > playerValue) {
          gameStatus = "dealer_wins";
          netWin = -bet;
        } else if (dealerValue < playerValue) {
          gameStatus = "player_wins";
          netWin = bet;
        } else {
          gameStatus = "push";
          netWin = 0;
        }
      }
      
      // If game is over, record it
      if (gameStatus !== "in_progress") {
        const game = await storage.getGame(gameId);
        
        // Apply house edge for player wins
        if (netWin > 0 && game) {
          const houseEdgeMultiplier = (100 - parseFloat(game.houseEdge.toString())) / 100;
          netWin = netWin * houseEdgeMultiplier;
        }
        
        await storage.createGameSession({
          userId: req.user.id,
          gameId,
          bet: bet.toFixed(2),
          result: {
            playerHand,
            dealerHand,
            playerValue: calculateHandValue(playerHand),
            dealerValue: calculateHandValue(dealerHand),
            status: gameStatus
          },
          win: netWin.toFixed(2)
        });
      }
      
      // Return result
      res.json({
        gameId,
        playerHand,
        dealerHand: gameStatus !== "in_progress" ? dealerHand : [dealerHand[0], { suit: "?", value: "?" }],
        playerValue: calculateHandValue(playerHand),
        dealerValue: gameStatus !== "in_progress" ? 
          calculateHandValue(dealerHand) : 
          calculateHandValue([dealerHand[0]]),
        bet,
        status: gameStatus,
        canHit: gameStatus === "in_progress",
        canStand: gameStatus === "in_progress",
        canDouble: gameStatus === "in_progress" && playerHand.length === 2,
        deck: deck.map(() => ({ suit: "?", value: "?" })), // Hide remaining deck
        balance: (await storage.getUser(req.user.id))?.balance
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to process blackjack action" });
    }
  });
}
