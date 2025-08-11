# UWAUWI - Image & PDF Converter with GitHub Authentication

A modern, responsive web application for converting and compressing image and PDF files with real-time progress tracking and integrated GitHub OAuth authentication.

## Features

### 🔐 Authentication
- **GitHub OAuth Integration**: Secure sign-in with GitHub accounts
- **Session Management**: Persistent authentication across browser sessions
- **User Profile Display**: Shows user avatar, name, and username
- **Optional Authentication**: File conversion works with or without authentication

### 🖼️ Image Conversion
- **Supported Input Formats**: JPG, JPEG, PNG, WebP, BMP, GIF, TIFF, HEIC
- **Supported Output Formats**: JPG, JPEG, PNG, WebP, BMP, GIF, TIFF
- **Compression Levels**: Low (Best Quality), Medium (Balanced), High (Smallest Size)
- **Fast Processing**: Uses Sharp library for efficient image processing

### 📄 PDF Compression
- **Supported Format**: PDF files
- **Compression Levels**: Low, Medium, High
- **Smart Optimization**: Uses pdf-lib for efficient compression
- **Structure Optimization**: Removes redundant objects and optimizes file structure

### 🚀 Core Features
- **Drag & Drop Upload**: Intuitive file upload interface
- **Real-time Progress**: Live progress bar with WebSocket updates
- **Dark Mode**: Toggle between light and dark themes
- **Mobile Responsive**: Works perfectly on all device sizes
- **In-Memory Processing**: Fast processing without disk I/O
- **Security**: 50MB file size limit, input validation, rate limiting
- **Download Management**: Automatic cleanup of temporary files

## Technology Stack

### Backend
- **Node.js** + **Express**: Web server framework
- **Passport.js**: Authentication middleware with GitHub OAuth2 strategy
- **Express Session**: Session management
- **Sharp**: High-performance image processing
- **pdf-lib**: PDF manipulation and compression
- **Multer**: File upload handling
- **WebSocket**: Real-time progress updates
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing

### Frontend
- **Vanilla JavaScript**: No framework dependencies
- **CSS Grid/Flexbox**: Modern responsive layout
- **CSS Variables**: Dynamic theming support
- **Progressive Enhancement**: Works without JavaScript for basic functionality

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/CoderPiyush07/UWAUWI.git
   cd UWAUWI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up GitHub OAuth Application**
   
   a. Go to [GitHub Developer Settings](https://github.com/settings/developers)
   
   b. Click "New OAuth App"
   
   c. Fill in the application details:
      - **Application name**: UWAUWI File Converter
      - **Homepage URL**: `http://localhost:3000` (for development)
      - **Authorization callback URL**: `http://localhost:3000/auth/github/callback`
   
   d. Click "Register application"
   
   e. Copy the **Client ID** and **Client Secret**

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file and add your GitHub OAuth credentials:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # GitHub OAuth Configuration
   GITHUB_CLIENT_ID=your_github_client_id_here
   GITHUB_CLIENT_SECRET=your_github_client_secret_here
   GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

   # Session Configuration
   SESSION_SECRET=your_super_secret_session_key_here

   # Application URLs
   APP_URL=http://localhost:3000
   ```

5. **Start the server**
   ```bash
   npm start
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

## Development

### Project Structure
```
UWAUWI/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── config/
│   └── passport.js        # Passport OAuth configuration
├── middleware/
│   └── auth.js           # Authentication middleware
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── upload.js         # File upload routes
│   └── convert.js        # Conversion routes
├── controllers/
│   ├── imageController.js # Image processing logic
│   └── pdfController.js  # PDF processing logic
├── utils/
│   ├── imageConverter.js # Image conversion utilities
│   └── pdfConverter.js   # PDF conversion utilities
└── public/
    ├── index.html        # Main HTML file
    ├── css/
    │   └── style.css     # Styles with theme support
    └── js/
        └── app.js        # Frontend JavaScript
```

### Available Scripts
- `npm start`: Start the production server
- `npm run dev`: Start development server with nodemon (requires nodemon)

### Environment Variables

#### Required for GitHub OAuth
- `GITHUB_CLIENT_ID`: Your GitHub OAuth app client ID
- `GITHUB_CLIENT_SECRET`: Your GitHub OAuth app client secret
- `GITHUB_CALLBACK_URL`: OAuth callback URL (must match GitHub app settings)
- `SESSION_SECRET`: Secret key for session encryption

#### Optional
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)
- `APP_URL`: Application URL for production CORS settings

## Authentication Flow

1. **User clicks "Sign in with GitHub"** → Redirects to GitHub OAuth
2. **User authorizes the application** → GitHub redirects back to callback URL
3. **Server processes the callback** → Creates user session
4. **User is redirected back to app** → Shows authenticated UI
5. **User can convert files** → All functionality available
6. **User can sign out** → Destroys session and returns to login state

### Authentication Features

- **Optional Authentication**: Users can convert files without signing in
- **Session Persistence**: Login state maintained across browser sessions
- **Secure Logout**: Properly destroys sessions and clears cookies
- **Error Handling**: User-friendly error messages for auth failures
- **Mobile Responsive**: Authentication UI works on all devices

## API Endpoints

### Authentication
- `GET /auth/github`: Initiate GitHub OAuth flow
- `GET /auth/github/callback`: Handle GitHub OAuth callback
- `POST /auth/logout`: Logout user and destroy session
- `GET /auth/user`: Get current user information
- `GET /auth/status`: Check authentication status

### Upload
- `POST /api/upload/file`: Upload a file for conversion
- `GET /api/upload/formats`: Get supported formats information

### Conversion
- `POST /api/convert/image`: Convert image files
- `POST /api/convert/pdf`: Compress PDF files
- `GET /api/convert/download/:filename`: Download converted files

## Security Features

- **OAuth 2.0 Authentication**: Secure GitHub-based authentication
- **Session Security**: HTTP-only cookies, secure in production
- **CORS Protection**: Configured for development and production
- **Rate Limiting**: Prevents abuse with request limits
- **File Size Limits**: 50MB maximum upload size
- **MIME Type Validation**: Only allowed file types accepted
- **Helmet Security**: Security headers for protection
- **Input Sanitization**: Validates all user inputs
- **Temporary File Cleanup**: Automatic cleanup after 10 minutes

## Production Deployment

### Environment Configuration
```env
NODE_ENV=production
PORT=443
APP_URL=https://yourdomain.com
GITHUB_CALLBACK_URL=https://yourdomain.com/auth/github/callback
SESSION_SECRET=your_production_session_secret
```

### GitHub OAuth App Settings (Production)
- **Homepage URL**: `https://yourdomain.com`
- **Authorization callback URL**: `https://yourdomain.com/auth/github/callback`

### Additional Security Considerations
- Use HTTPS in production (required for secure cookies)
- Set strong session secrets
- Configure proper CORS origins
- Use environment-specific GitHub OAuth apps
- Enable secure cookie settings
- Consider using Redis for session storage at scale

## Browser Support

- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Mobile Support**: iOS Safari 12+, Chrome Mobile 60+
- **Progressive Enhancement**: Basic functionality works without JavaScript

## Performance

- **In-Memory Processing**: No disk I/O for faster processing
- **Efficient Libraries**: Sharp and pdf-lib for optimal performance
- **WebSocket Updates**: Real-time progress without polling
- **Responsive Images**: Optimized for all screen sizes
- **Minimal Dependencies**: Lightweight and fast
- **Session Optimization**: Efficient session management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Acknowledgments

- **Sharp**: Fast image processing library
- **pdf-lib**: PDF manipulation library
- **Express**: Web application framework
- **Passport.js**: Authentication middleware
- **GitHub**: OAuth provider for secure authentication