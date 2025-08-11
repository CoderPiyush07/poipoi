const sharp = require('sharp');
const imageConverter = require('../utils/imageConverter');

class ImageController {
  /**
   * Convert image to specified format with compression
   * @param {Object} options - Conversion options
   * @param {Buffer} options.buffer - Image buffer
   * @param {string} options.outputFormat - Target format
   * @param {string} options.compressionLevel - Compression level
   * @param {WebSocket.Server} options.wss - WebSocket server for progress updates
   * @returns {Object} Conversion result
   */
  async convertImage({ buffer, outputFormat, compressionLevel, wss }) {
    try {
      // Broadcast progress update
      this.broadcastProgress(wss, { progress: 10, message: 'Analyzing image...' });

      // Get image metadata
      const metadata = await sharp(buffer).metadata();
      const originalSize = buffer.length;

      console.log(`Converting image: ${metadata.format} -> ${outputFormat}, ${metadata.width}x${metadata.height}`);

      this.broadcastProgress(wss, { progress: 30, message: 'Starting conversion...' });

      // Perform conversion
      const convertedBuffer = await imageConverter.convert({
        buffer,
        outputFormat,
        compressionLevel,
        metadata,
        progressCallback: (progress, message) => {
          this.broadcastProgress(wss, { progress: 30 + (progress * 0.6), message });
        }
      });

      this.broadcastProgress(wss, { progress: 90, message: 'Preparing download...' });

      // Store converted file for download
      const downloadUrl = this.storeForDownload(convertedBuffer, outputFormat, metadata);

      const convertedSize = convertedBuffer.length;
      const compressionRatio = ((originalSize - convertedSize) / originalSize * 100).toFixed(1);

      this.broadcastProgress(wss, { progress: 100, message: 'Conversion completed!' });

      return {
        downloadUrl,
        outputFormat,
        originalSize,
        convertedSize,
        compressionRatio: compressionRatio + '%'
      };

    } catch (error) {
      this.broadcastProgress(wss, { progress: 0, message: 'Conversion failed', error: error.message });
      throw new Error(`Image conversion failed: ${error.message}`);
    }
  }

  /**
   * Broadcast progress update to all connected clients
   * @param {WebSocket.Server} wss - WebSocket server
   * @param {Object} data - Progress data
   */
  broadcastProgress(wss, data) {
    if (wss && wss.clients) {
      const message = JSON.stringify({
        type: 'progress',
        data
      });

      wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(message);
        }
      });
    }
  }

  /**
   * Store converted file for download
   * @param {Buffer} buffer - File buffer
   * @param {string} format - File format
   * @param {Object} metadata - Original metadata
   * @returns {string} Download URL
   */
  storeForDownload(buffer, format, metadata) {
    // Initialize global temp storage if not exists
    if (!global.tempFiles) {
      global.tempFiles = {};
    }

    const filename = `converted_${Date.now()}.${format}`;
    const mimeType = this.getMimeType(format);

    global.tempFiles[filename] = {
      buffer,
      mimeType,
      originalName: `converted_image.${format}`,
      timestamp: Date.now()
    };

    // Clean up old files (older than 10 minutes)
    this.cleanupOldFiles();

    return `/api/convert/download/${filename}`;
  }

  /**
   * Get MIME type for format
   * @param {string} format - File format
   * @returns {string} MIME type
   */
  getMimeType(format) {
    const mimeTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      bmp: 'image/bmp',
      gif: 'image/gif',
      tiff: 'image/tiff'
    };
    return mimeTypes[format.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Clean up old temporary files
   */
  cleanupOldFiles() {
    if (!global.tempFiles) return;

    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    Object.keys(global.tempFiles).forEach(filename => {
      if (now - global.tempFiles[filename].timestamp > maxAge) {
        delete global.tempFiles[filename];
      }
    });
  }
}

module.exports = new ImageController();