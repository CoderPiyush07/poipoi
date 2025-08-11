class FileConverter {
  constructor() {
    this.uploadedFile = null;
    this.ws = null;
    this.user = null;
    this.init();
  }

  /**
   * Initialize the application
   */
  init() {
    this.setupEventListeners();
    this.setupWebSocket();
    this.setupTheme();
    this.checkAuthStatus();
    this.handleAuthCallback();
    console.log('File Converter initialized');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // File upload events
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
    uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
    uploadArea.addEventListener('drop', this.handleDrop.bind(this));
    fileInput.addEventListener('change', this.handleFileSelect.bind(this));

    // Conversion button
    document.getElementById('convertBtn').addEventListener('click', this.startConversion.bind(this));

    // Download and retry buttons
    document.getElementById('downloadBtn').addEventListener('click', this.downloadFile.bind(this));
    document.getElementById('newConversionBtn').addEventListener('click', this.resetApp.bind(this));
    document.getElementById('retryBtn').addEventListener('click', this.resetApp.bind(this));

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', this.toggleTheme.bind(this));

    // Authentication events
    document.getElementById('logoutBtn').addEventListener('click', this.logout.bind(this));
    
    // Word Counter button
    document.getElementById('wordCounterButton').addEventListener('click', this.openWordCounter.bind(this));
  }

  /**
   * Setup WebSocket connection for progress updates
   */
  setupWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'progress') {
            this.updateProgress(data.data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Try to reconnect after 3 seconds
        setTimeout(() => this.setupWebSocket(), 3000);
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to setup WebSocket:', error);
    }
  }

  /**
   * Setup theme functionality
   */
  setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeToggle(savedTheme);
  }

  /**
   * Toggle theme between light and dark
   */
  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    this.updateThemeToggle(newTheme);
  }

  /**
   * Update theme toggle button
   */
  updateThemeToggle(theme) {
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  /**
   * Handle drag over event
   */
  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('uploadArea').classList.add('dragover');
  }

  /**
   * Handle drag leave event
   */
  handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('uploadArea').classList.remove('dragover');
  }

  /**
   * Handle file drop
   */
  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('uploadArea').classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.processFile(files[0]);
    }
  }

  /**
   * Handle file selection
   */
  handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      this.processFile(files[0]);
    }
  }

  /**
   * Process uploaded file
   */
  async processFile(file) {
    try {
      // Validate file size
      if (file.size > 50 * 1024 * 1024) {
        this.showError('File size exceeds 50MB limit');
        return;
      }

      this.showLoading(true);

      // Upload file
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/file', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      this.uploadedFile = {
        ...result.fileInfo,
        buffer: file
      };

      this.showFileInfo(result.fileInfo);
      this.showConversionOptions(result.fileInfo);

    } catch (error) {
      console.error('Upload error:', error);
      this.showError(error.message);
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Show file information
   */
  showFileInfo(fileInfo) {
    document.getElementById('fileName').textContent = fileInfo.originalName;
    document.getElementById('fileType').textContent = fileInfo.mimeType;
    document.getElementById('fileSize').textContent = this.formatFileSize(fileInfo.size);
    
    this.showSection('fileInfoSection');
  }

  /**
   * Show conversion options
   */
  showConversionOptions(fileInfo) {
    const formatGroup = document.getElementById('formatGroup');
    
    if (fileInfo.isImage) {
      formatGroup.style.display = 'block';
      // Set default output format based on input
      const outputFormat = document.getElementById('outputFormat');
      if (fileInfo.mimeType.includes('png')) {
        outputFormat.value = 'png';
      } else if (fileInfo.mimeType.includes('webp')) {
        outputFormat.value = 'webp';
      } else {
        outputFormat.value = 'jpg';
      }
    } else {
      formatGroup.style.display = 'none';
    }
    
    this.showSection('conversionSection');
  }

  /**
   * Start conversion process
   */
  async startConversion() {
    if (!this.uploadedFile) {
      this.showError('No file uploaded');
      return;
    }

    try {
      const convertBtn = document.getElementById('convertBtn');
      convertBtn.disabled = true;
      convertBtn.querySelector('.btn-text').style.display = 'none';
      convertBtn.querySelector('.btn-loader').style.display = 'inline';

      this.showSection('progressSection');

      // Convert file to base64 for transmission
      const fileBase64 = await this.fileToBase64(this.uploadedFile.buffer);

      let endpoint, payload;

      if (this.uploadedFile.isImage) {
        endpoint = '/api/convert/image';
        payload = {
          fileData: fileBase64,
          outputFormat: document.getElementById('outputFormat').value,
          compressionLevel: document.getElementById('compressionLevel').value
        };
      } else if (this.uploadedFile.isPDF) {
        endpoint = '/api/convert/pdf';
        payload = {
          fileData: fileBase64,
          compressionLevel: document.getElementById('compressionLevel').value
        };
      } else {
        throw new Error('Unsupported file type');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Conversion failed');
      }

      this.showResults(result);

    } catch (error) {
      console.error('Conversion error:', error);
      this.showError(error.message);
    } finally {
      const convertBtn = document.getElementById('convertBtn');
      convertBtn.disabled = false;
      convertBtn.querySelector('.btn-text').style.display = 'inline';
      convertBtn.querySelector('.btn-loader').style.display = 'none';
    }
  }

  /**
   * Convert file to base64
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Update progress bar
   */
  updateProgress(data) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const progressPercentage = document.getElementById('progressPercentage');

    progressFill.style.width = `${data.progress}%`;
    progressText.textContent = data.message;
    progressPercentage.textContent = `${Math.round(data.progress)}%`;

    if (data.error) {
      this.showError(data.error);
    }
  }

  /**
   * Show conversion results
   */
  showResults(result) {
    document.getElementById('originalSize').textContent = this.formatFileSize(result.originalSize);
    document.getElementById('newSize').textContent = this.formatFileSize(result.convertedSize || result.compressedSize);
    document.getElementById('compressionRatio').textContent = result.compressionRatio;

    // Store download URL for later use
    this.downloadUrl = result.downloadUrl;

    this.hideSection('progressSection');
    this.showSection('resultsSection');
  }

  /**
   * Download converted file
   */
  downloadFile() {
    if (this.downloadUrl) {
      const link = document.createElement('a');
      link.href = this.downloadUrl;
      link.download = '';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Reset application to initial state
   */
  resetApp() {
    this.uploadedFile = null;
    this.downloadUrl = null;
    
    // Reset file input
    document.getElementById('fileInput').value = '';
    
    // Hide all sections except upload
    this.hideSection('fileInfoSection');
    this.hideSection('conversionSection');
    this.hideSection('progressSection');
    this.hideSection('resultsSection');
    this.hideSection('errorSection');
    
    // Show upload section
    this.showSection('uploadSection');
  }

  /**
   * Show error message
   */
  showError(message) {
    document.getElementById('errorMessage').textContent = message;
    this.hideSection('progressSection');
    this.hideSection('resultsSection');
    this.showSection('errorSection');
  }

  /**
   * Show loading overlay
   */
  showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = show ? 'flex' : 'none';
  }

  /**
   * Show section
   */
  showSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.style.display = 'block';
      section.classList.add('fade-in');
    }
  }

  /**
   * Hide section
   */
  hideSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.style.display = 'none';
      section.classList.remove('fade-in');
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Check authentication status and update UI
   */
  async checkAuthStatus() {
    try {
      const response = await fetch('/auth/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        
        if (userData.isAuthenticated) {
          this.user = userData;
          this.updateAuthUI(true);
        } else {
          this.user = null;
          this.updateAuthUI(false);
        }
      } else {
        this.user = null;
        this.updateAuthUI(false);
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      this.user = null;
      this.updateAuthUI(false);
    }
  }

  /**
   * Update authentication UI based on login status
   * @param {boolean} isAuthenticated - Whether user is authenticated
   */
  updateAuthUI(isAuthenticated) {
    const authLogin = document.getElementById('authLogin');
    const authProfile = document.getElementById('authProfile');

    if (isAuthenticated && this.user) {
      // Show user profile
      authLogin.style.display = 'none';
      authProfile.style.display = 'flex';

      // Update user information
      const userAvatar = document.getElementById('userAvatar');
      const userName = document.getElementById('userName');
      const userUsername = document.getElementById('userUsername');

      if (this.user.avatar) {
        userAvatar.src = this.user.avatar;
        userAvatar.style.display = 'block';
      } else {
        userAvatar.style.display = 'none';
      }

      userName.textContent = this.user.displayName || this.user.username;
      userUsername.textContent = `@${this.user.username}`;

      console.log('User authenticated:', this.user.username);
    } else {
      // Show login button
      authLogin.style.display = 'block';
      authProfile.style.display = 'none';
      console.log('User not authenticated');
    }
  }

  /**
   * Hide authentication UI completely
   */
  hideAuthUI() {
    const authLogin = document.getElementById('authLogin');
    const authProfile = document.getElementById('authProfile');
    
    authLogin.style.display = 'none';
    authProfile.style.display = 'none';
  }

  /**
   * Handle authentication callback from OAuth
   */
  handleAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    const error = urlParams.get('error');

    if (authStatus === 'success') {
      console.log('Authentication successful');
      // Remove URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh auth status
      this.checkAuthStatus();
      // Show success message
      this.showAuthMessage('Successfully signed in with GitHub!', 'success');
    } else if (error) {
      console.error('Authentication error:', error);
      let errorMessage = 'Authentication failed. Please try again.';
      
      switch (error) {
        case 'auth_failed':
          errorMessage = 'GitHub authentication failed. Please try again.';
          break;
        case 'auth_callback_failed':
          errorMessage = 'Authentication callback failed. Please try again.';
          break;
        case 'auth_required':
          errorMessage = 'Please sign in to continue.';
          break;
        case 'oauth_not_configured':
          errorMessage = 'GitHub OAuth is not configured. Please check the server configuration.';
          this.hideAuthUI();
          break;
      }
      
      this.showAuthMessage(errorMessage, 'error');
      // Remove URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  /**
   * Show authentication message
   * @param {string} message - Message to show
   * @param {string} type - Message type (success, error)
   */
  showAuthMessage(message, type) {
    // Create temporary message element
    const messageEl = document.createElement('div');
    messageEl.className = `auth-message auth-message-${type}`;
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? 'var(--success)' : 'var(--error)'};
      color: white;
      padding: 1rem 2rem;
      border-radius: var(--border-radius-sm);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1001;
      font-weight: 500;
    `;

    document.body.appendChild(messageEl);

    // Remove message after 5 seconds
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, 5000);
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      const response = await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        this.user = null;
        this.updateAuthUI(false);
        this.showAuthMessage('Successfully signed out', 'success');
        console.log('User logged out successfully');
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      this.showAuthMessage('Failed to sign out. Please try again.', 'error');
    }
  }

  /**
   * Open Word Counter app in new tab
   */
  openWordCounter() {
  // Placeholder URL - replace with actual Word Counter GitHub Pages URL when available
  const wordCounterUrl = 'https://word-counter.kroxx.dev/'; // Replace with actual URL
  window.open(wordCounterUrl, '_blank');
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new FileConverter();
});