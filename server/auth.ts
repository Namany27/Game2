import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { UserModel } from "./mongodb-models";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "crypto-casino-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      secure: process.env.NODE_ENV === "production",
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password'
    }, async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Extend the schema with validation for matching passwords
      const registerSchema = insertUserSchema.extend({
        confirmPassword: z.string(),
        email: z.string().email("Invalid email address")
      }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
      });
      
      const validatedData = registerSchema.parse(req.body);
      
      // Check if username exists
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email exists
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser({
        username: validatedData.username,
        email: validatedData.email,
        password: await hashPassword(validatedData.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({
          id: user.id,
          username: user.username,
          email: user.email,
          balance: user.balance,
          isAdmin: user.isAdmin
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info.message || "Invalid credentials" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        return res.status(200).json({
          id: user.id,
          username: user.username,
          email: user.email,
          balance: user.balance,
          isAdmin: user.isAdmin
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json({
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      balance: req.user.balance,
      isAdmin: req.user.isAdmin
    });
  });
  
  // Create admin users if they don't exist
  (async () => {
    try {
      // Regular admin user
      const adminUsername = "admin";
      const admin = await storage.getUserByUsername(adminUsername);
      
      if (!admin) {
        const adminUser = await storage.createUser({
          username: adminUsername,
          email: "admin@cryptocasino.com",
          password: await hashPassword("admin123"),
        });
        
        // For MongoDB, we need to update the user differently
        await UserModel.findByIdAndUpdate(adminUser.id, { isAdmin: true });
        console.log("Admin user created");
      }
      
      // Special owner admin user with specific credentials
      const ownerUsername = "Owner";
      const owner = await storage.getUserByUsername(ownerUsername);
      
      if (!owner) {
        const ownerUser = await storage.createUser({
          username: ownerUsername,
          email: "owner@cryptocasino.com",
          password: await hashPassword("₹INMTWIMT$"),
        });
        
        // Set as admin user with special privileges
        await UserModel.findByIdAndUpdate(ownerUser.id, { 
          isAdmin: true,
          balance: "1000000.00" // Give the owner a large balance for testing
        });
        console.log("Owner admin user created");
      }
    } catch (error) {
      console.error("Error creating admin users:", error);
    }
  })();
}
