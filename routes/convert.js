const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const pdfController = require('../controllers/pdfController');

// Image conversion endpoint
router.post('/image', async (req, res) => {
  try {
    const { outputFormat, compressionLevel, fileData } = req.body;
    
    if (!fileData || !outputFormat) {
      return res.status(400).json({ 
        error: 'Missing required parameters: fileData and outputFormat' 
      });
    }

    // Get WebSocket server for progress updates
    const wss = req.app.get('wss');
    
    // Convert file data from base64 back to buffer
    const buffer = Buffer.from(fileData, 'base64');
    
    const result = await imageController.convertImage({
      buffer,
      outputFormat,
      compressionLevel: compressionLevel || 'medium',
      wss
    });

    res.json({
      success: true,
      message: 'Image converted successfully',
      downloadUrl: result.downloadUrl,
      outputFormat: result.outputFormat,
      originalSize: result.originalSize,
      convertedSize: result.convertedSize,
      compressionRatio: result.compressionRatio
    });

  } catch (error) {
    console.error('Image conversion error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to convert image' 
    });
  }
});

// PDF compression endpoint
router.post('/pdf', async (req, res) => {
  try {
    const { compressionLevel, fileData } = req.body;
    
    if (!fileData) {
      return res.status(400).json({ 
        error: 'Missing required parameter: fileData' 
      });
    }

    // Get WebSocket server for progress updates
    const wss = req.app.get('wss');
    
    // Convert file data from base64 back to buffer
    const buffer = Buffer.from(fileData, 'base64');
    
    const result = await pdfController.compressPDF({
      buffer,
      compressionLevel: compressionLevel || 'medium',
      wss
    });

    res.json({
      success: true,
      message: 'PDF compressed successfully',
      downloadUrl: result.downloadUrl,
      originalSize: result.originalSize,
      compressedSize: result.compressedSize,
      compressionRatio: result.compressionRatio
    });

  } catch (error) {
    console.error('PDF compression error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to compress PDF' 
    });
  }
});

// Download endpoint
router.get('/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Get file from temporary storage (in production, use proper storage)
    // For demo purposes, we'll implement a simple in-memory storage
    const fileData = global.tempFiles && global.tempFiles[filename];
    
    if (!fileData) {
      return res.status(404).json({ 
        error: 'File not found or expired' 
      });
    }

    res.set({
      'Content-Type': fileData.mimeType,
      'Content-Disposition': `attachment; filename="${fileData.originalName}"`,
      'Content-Length': fileData.buffer.length
    });

    res.send(fileData.buffer);

    // Clean up file after download
    setTimeout(() => {
      if (global.tempFiles && global.tempFiles[filename]) {
        delete global.tempFiles[filename];
      }
    }, 60000); // Delete after 1 minute

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ 
      error: 'Failed to download file' 
    });
  }
});

module.exports = router;