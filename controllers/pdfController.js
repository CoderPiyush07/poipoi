const { PDFDocument } = require('pdf-lib');
const pdfConverter = require('../utils/pdfConverter');

class PDFController {
  /**
   * Compress PDF file
   * @param {Object} options - Compression options
   * @param {Buffer} options.buffer - PDF buffer
   * @param {string} options.compressionLevel - Compression level
   * @param {WebSocket.Server} options.wss - WebSocket server for progress updates
   * @returns {Object} Compression result
   */
  async compressPDF({ buffer, compressionLevel, wss }) {
    try {
      // Broadcast progress update
      this.broadcastProgress(wss, { progress: 10, message: 'Analyzing PDF...' });

      const originalSize = buffer.length;
      console.log(`Compressing PDF: ${originalSize} bytes, level: ${compressionLevel}`);

      // Load PDF document
      const pdfDoc = await PDFDocument.load(buffer);
      const pageCount = pdfDoc.getPageCount();

      this.broadcastProgress(wss, { 
        progress: 20, 
        message: `Processing PDF with ${pageCount} pages...` 
      });

      // Perform compression
      const compressedBuffer = await pdfConverter.compress({
        buffer,
        compressionLevel,
        pageCount,
        progressCallback: (progress, message) => {
          this.broadcastProgress(wss, { progress: 20 + (progress * 0.7), message });
        }
      });

      this.broadcastProgress(wss, { progress: 90, message: 'Preparing download...' });

      // Store compressed file for download
      const downloadUrl = this.storeForDownload(compressedBuffer);

      const compressedSize = compressedBuffer.length;
      const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

      this.broadcastProgress(wss, { progress: 100, message: 'Compression completed!' });

      return {
        downloadUrl,
        originalSize,
        compressedSize,
        compressionRatio: compressionRatio + '%'
      };

    } catch (error) {
      this.broadcastProgress(wss, { progress: 0, message: 'Compression failed', error: error.message });
      throw new Error(`PDF compression failed: ${error.message}`);
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
   * Store compressed file for download
   * @param {Buffer} buffer - File buffer
   * @returns {string} Download URL
   */
  storeForDownload(buffer) {
    // Initialize global temp storage if not exists
    if (!global.tempFiles) {
      global.tempFiles = {};
    }

    const filename = `compressed_${Date.now()}.pdf`;

    global.tempFiles[filename] = {
      buffer,
      mimeType: 'application/pdf',
      originalName: 'compressed_document.pdf',
      timestamp: Date.now()
    };

    // Clean up old files (older than 10 minutes)
    this.cleanupOldFiles();

    return `/api/convert/download/${filename}`;
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

module.exports = new PDFController();