const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Supported file types
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 
  'image/bmp', 'image/gif', 'image/tiff', 'image/heic'
];
const SUPPORTED_PDF_TYPES = ['application/pdf'];
const ALL_SUPPORTED_TYPES = [...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_PDF_TYPES];

// Multer configuration for in-memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1 // Only one file at a time for now
  },
  fileFilter: (req, file, cb) => {
    console.log('File MIME type:', file.mimetype);
    
    if (ALL_SUPPORTED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Supported types: Images (jpg, jpeg, png, webp, bmp, gif, tiff, heic) and PDF files.`), false);
    }
  }
});

// File upload endpoint
router.post('/file', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded' 
      });
    }

    const fileInfo = {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer,
      isImage: SUPPORTED_IMAGE_TYPES.includes(req.file.mimetype),
      isPDF: SUPPORTED_PDF_TYPES.includes(req.file.mimetype)
    };

    // For this demo, we'll pass the file info directly in the response
    // In production, you might want to use Redis or database for session management

    console.log(`File uploaded: ${fileInfo.originalName} (${fileInfo.size} bytes)`);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      fileInfo: {
        originalName: fileInfo.originalName,
        mimeType: fileInfo.mimeType,
        size: fileInfo.size,
        isImage: fileInfo.isImage,
        isPDF: fileInfo.isPDF
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to process uploaded file' 
    });
  }
});

// Get supported formats
router.get('/formats', (req, res) => {
  res.json({
    supportedFormats: {
      images: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'tiff', 'heic'],
      pdf: ['pdf']
    },
    outputFormats: {
      images: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'tiff'],
      pdf: ['pdf'] // Only compression, no format change
    },
    maxFileSize: '50MB'
  });
});

module.exports = router;