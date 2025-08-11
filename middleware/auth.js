/**
 * Authentication middleware to ensure user is authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next function
 */
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // For API requests, return JSON error
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ 
      error: 'Authentication required',
      authRequired: true 
    });
  }
  
  // For regular requests, redirect to login
  res.redirect('/?auth=required');
}

/**
 * Optional authentication middleware - continues regardless of auth status
 * Adds user information to request if authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next function
 */
function optionalAuthentication(req, res, next) {
  // Always continue, user info will be available in req.user if authenticated
  next();
}

/**
 * Middleware to add user context to all requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next function
 */
function addUserContext(req, res, next) {
  res.locals.user = req.user || null;
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
}

/**
 * Development middleware - bypasses authentication in development mode
 * Only use this for testing purposes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next function
 */
function bypassAuthInDev(req, res, next) {
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    // Create a mock user for development
    req.user = {
      id: 'dev-user',
      username: 'developer',
      displayName: 'Development User',
      email: 'dev@localhost',
      avatar: null,
      provider: 'mock',
      isAuthenticated: true
    };
    
    console.log('Development mode: Authentication bypassed');
    return next();
  }
  
  return ensureAuthenticated(req, res, next);
}

module.exports = {
  ensureAuthenticated,
  optionalAuthentication,
  addUserContext,
  bypassAuthInDev
};