const express = require('express');
const passport = require('passport');
const router = express.Router();

/**
 * GitHub OAuth login route
 * Redirects user to GitHub for authentication
 */
router.get('/github', (req, res, next) => {
  // Check if GitHub OAuth is configured
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.redirect('/?error=oauth_not_configured');
  }
  
  passport.authenticate('github', {
    scope: ['user:email']
  })(req, res, next);
});

/**
 * GitHub OAuth callback route
 * Handles the callback from GitHub after authentication
 */
router.get('/github/callback', (req, res, next) => {
  // Check if GitHub OAuth is configured
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.redirect('/?error=oauth_not_configured');
  }
  
  passport.authenticate('github', { 
    failureRedirect: '/?error=auth_failed' 
  })(req, res, next);
}, (req, res) => {
  try {
    // Authentication successful
    console.log('User authenticated successfully:', req.user.username);
    
    // Redirect back to the main application
    res.redirect('/?auth=success');
  } catch (error) {
    console.error('Authentication callback error:', error);
    res.redirect('/?error=auth_callback_failed');
  }
});

/**
 * Logout route
 * Logs out the user and destroys session
 */
router.post('/logout', (req, res) => {
  try {
    const username = req.user ? req.user.username : 'unknown';
    
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }
      
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
          return res.status(500).json({ error: 'Failed to destroy session' });
        }
        
        console.log('User logged out successfully:', username);
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Logged out successfully' });
      });
    });
  } catch (error) {
    console.error('Logout route error:', error);
    res.status(500).json({ error: 'Internal server error during logout' });
  }
});

/**
 * Get current user route
 * Returns current authenticated user information
 */
router.get('/user', (req, res) => {
  try {
    if (req.isAuthenticated() && req.user) {
      // Return user information (excluding sensitive data)
      const userInfo = {
        id: req.user.id,
        username: req.user.username,
        displayName: req.user.displayName,
        email: req.user.email,
        avatar: req.user.avatar,
        profileUrl: req.user.profileUrl,
        provider: req.user.provider,
        isAuthenticated: true
      };
      
      res.json(userInfo);
    } else {
      res.json({ isAuthenticated: false });
    }
  } catch (error) {
    console.error('Get user route error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

/**
 * Check authentication status
 * Simple endpoint to check if user is authenticated
 */
router.get('/status', (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated(),
    user: req.isAuthenticated() ? {
      username: req.user.username,
      displayName: req.user.displayName,
      avatar: req.user.avatar
    } : null
  });
});

module.exports = router;