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
  // Match the URL configured in GitHub OAuth settings as seen in the screenshot
  const callbackURL = 'https://vibe-code-tracker.replit.app/api/auth/github/callback';
  
  console.log('Using callback URL:', callbackURL);
  
  console.log('GitHub OAuth Configuration:');
  console.log('Client ID:', process.env.GITHUB_CLIENT_ID ? 'Set' : 'Not set');
  console.log('Client Secret:', process.env.GITHUB_CLIENT_SECRET ? 'Set' : 'Not set');
  console.log('Callback URL:', callbackURL);
  
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'mock_client_id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'mock_client_secret',
    callbackURL: callbackURL,
    scope: ['user:email', 'read:user', 'repo']
  }, async (accessToken, refreshToken, profile, done) => {
    console.log('GitHub OAuth callback received');
    console.log('Profile:', profile.username);
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
        // Check if this is the first user (make them admin)
        const existingUsers = await storage.getUsers();
        const isFirstUser = existingUsers.length === 0;
        
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
          isAdmin: isFirstUser // First user becomes admin automatically
        });
        
        if (isFirstUser) {
          console.log(`First user ${user.username} has been granted admin privileges`);
        }
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
      console.log('Deserializing user with ID:', id);
      const user = await storage.getUser(id);
      if (user) {
        console.log('User found:', user.username);
        done(null, user);
      } else {
        console.log('User not found for ID:', id);
        done(null, false);
      }
    } catch (error) {
      console.error('Error deserializing user:', error);
      done(error);
    }
  });
  
  // Set up session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'vibecoding-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // Temporarily disable for debugging
      httpOnly: true,
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
      failureRedirect: '/login'
    }),
    (req, res) => {
      console.log('GitHub callback successful, user:', req.user);
      res.redirect('/');
    }
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
