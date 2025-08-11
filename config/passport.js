const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;

/**
 * Configure Passport with GitHub OAuth strategy
 */
function configurePassport() {
  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  // Only configure GitHub strategy if credentials are provided
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    // GitHub OAuth strategy
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract user information from GitHub profile
        const user = {
          id: profile.id,
          username: profile.username,
          displayName: profile.displayName || profile.username,
          email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null,
          avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
          profileUrl: profile.profileUrl,
          provider: 'github',
          accessToken: accessToken,
          createdAt: new Date()
        };

        console.log('GitHub OAuth user authenticated:', {
          id: user.id,
          username: user.username,
          email: user.email
        });

        return done(null, user);
      } catch (error) {
        console.error('GitHub OAuth authentication error:', error);
        return done(error, null);
      }
    }));
    
    console.log('GitHub OAuth strategy configured successfully');
  } else {
    console.log('GitHub OAuth strategy not configured - credentials not provided');
  }
}

module.exports = configurePassport;