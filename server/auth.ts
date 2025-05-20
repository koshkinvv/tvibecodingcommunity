import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { githubUserSchema } from '@shared/schema';
import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';

// Setup GitHub OAuth strategy
export function setupAuth(app: express.Express) {
  const MemoryStoreSession = MemoryStore(session);
  
  // Configure passport with GitHub strategy
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'mock_client_id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'mock_client_secret',
    callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',
    scope: ['user:email', 'read:user', 'repo']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Parse and validate GitHub user data
      const githubData = {
        login: profile.username || '',
        id: parseInt(profile.id || '0'),
        node_id: profile.nodeId || '',
        avatar_url: profile.photos?.[0]?.value || '',
        name: profile.displayName || undefined,
        email: profile.emails?.[0]?.value || undefined
      };
      
      // Validate against our schema
      const validationResult = githubUserSchema.safeParse(githubData);
      if (!validationResult.success) {
        return done(new Error('Invalid GitHub profile data'));
      }
      
      // Check if user already exists
      let user = await storage.getUserByGithubId(profile.id);
      
      if (user) {
        // Update existing user
        user = await storage.updateUser(user.id, {
          username: profile.username || user.username,
          name: profile.displayName || user.name,
          email: profile.emails?.[0]?.value || user.email,
          avatarUrl: profile.photos?.[0]?.value || user.avatarUrl,
          githubToken: accessToken
        });
      } else {
        // Create new user
        user = await storage.createUser({
          githubId: profile.id,
          username: profile.username || '',
          name: profile.displayName || null,
          email: profile.emails?.[0]?.value || null,
          avatarUrl: profile.photos?.[0]?.value || null,
          githubToken: accessToken,
          telegramId: null,
          notificationPreference: 'email',
          onVacation: false,
          vacationUntil: null,
          isAdmin: false
        });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));
  
  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  
  // Set up session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'vibecoding-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
    },
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  }));
  
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Set up auth routes
  app.get('/api/auth/github', passport.authenticate('github'));
  
  app.get('/api/auth/github/callback', 
    passport.authenticate('github', { 
      failureRedirect: '/login',
      successRedirect: '/'
    })
  );
  
  app.get('/api/auth/logout', (req, res) => {
    req.logout(function(err) {
      if (err) { 
        console.error('Error logging out:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.redirect('/');
    });
  });
  
  app.get('/api/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
      // Return user without sensitive data
      const user = req.user as any;
      
      // Don't send token to the client
      const { githubToken, ...safeUser } = user;
      
      res.json(safeUser);
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });
  
  // Middleware to check if user is authenticated
  return {
    isAuthenticated: (req: Request, res: Response, next: NextFunction) => {
      if (req.isAuthenticated()) {
        return next();
      }
      res.status(401).json({ error: 'Authentication required' });
    },
    
    isAdmin: (req: Request, res: Response, next: NextFunction) => {
      if (req.isAuthenticated() && (req.user as any).isAdmin) {
        return next();
      }
      res.status(403).json({ error: 'Admin access required' });
    }
  };
}
