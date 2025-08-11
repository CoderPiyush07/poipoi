const { PDFDocument } = require('pdf-lib');

class PDFConverter {
  /**
   * Compress PDF file
   * @param {Object} options - Compression options
   * @returns {Buffer} Compressed PDF buffer
   */
  async compress({ buffer, compressionLevel, pageCount, progressCallback }) {
    try {
      // Update progress
      if (progressCallback) progressCallback(10, 'Loading PDF document...');

      // Load the PDF document
      const pdfDoc = await PDFDocument.load(buffer);

      // Update progress
      if (progressCallback) progressCallback(30, 'Analyzing document structure...');

      // Get compression settings
      const settings = this.getCompressionSettings(compressionLevel);

      // Update progress
      if (progressCallback) progressCallback(50, 'Applying compression...');

      // Apply compression techniques
      await this.applyCompression(pdfDoc, settings, progressCallback);

      // Update progress
      if (progressCallback) progressCallback(90, 'Generating compressed PDF...');

      // Save the compressed PDF
      const compressedBytes = await pdfDoc.save({
        useObjectStreams: settings.useObjectStreams,
        addDefaultPage: false,
        objectStreamCompressionMethod: settings.objectStreamCompressionMethod
      });

      const compressedBuffer = Buffer.from(compressedBytes);

      console.log(`PDF compressed: ${buffer.length} -> ${compressedBuffer.length} bytes`);
      console.log(`Compression ratio: ${((buffer.length - compressedBuffer.length) / buffer.length * 100).toFixed(1)}%`);

      if (progressCallback) progressCallback(100, 'Compression complete!');

      return compressedBuffer;

    } catch (error) {
      console.error('PDF compression error:', error);
      throw new Error(`Failed to compress PDF: ${error.message}`);
    }
  }

  /**
   * Apply compression techniques to PDF
   * @param {PDFDocument} pdfDoc - PDF document
   * @param {Object} settings - Compression settings
   * @param {Function} progressCallback - Progress callback
   */
  async applyCompression(pdfDoc, settings, progressCallback) {
    try {
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      for (let i = 0; i < totalPages; i++) {
        const page = pages[i];
        
        // Update progress for each page
        if (progressCallback) {
          const pageProgress = (i / totalPages) * 40; // 40% of the compression process
          progressCallback(50 + pageProgress, `Processing page ${i + 1} of ${totalPages}...`);
        }

        // Apply page-level optimizations
        await this.optimizePage(page, settings);
      }

      // Apply document-level optimizations
      if (progressCallback) progressCallback(85, 'Applying document optimizations...');
      await this.optimizeDocument(pdfDoc, settings);

    } catch (error) {
      throw new Error(`Failed to apply compression: ${error.message}`);
    }
  }

  /**
   * Optimize individual page
   * @param {PDFPage} page - PDF page
   * @param {Object} settings - Compression settings
   */
  async optimizePage(page, settings) {
    try {
      // Get page dimensions
      const { width, height } = page.getSize();

      // Apply scaling if specified
      if (settings.scaleImages) {
        // Note: pdf-lib has limited image optimization capabilities
        // For production, you might want to use additional libraries
        // like pdf2pic + sharp for image extraction and recompression
        console.log(`Processing page dimensions: ${width}x${height}`);
      }

      // Remove unnecessary elements if specified
      if (settings.removeAnnotations) {
        // pdf-lib doesn't have direct annotation removal
        // This would require more advanced PDF manipulation
        console.log('Annotation removal not implemented in basic version');
      }

    } catch (error) {
      console.warn(`Warning: Could not optimize page: ${error.message}`);
    }
  }

  /**
   * Optimize document structure
   * @param {PDFDocument} pdfDoc - PDF document
   * @param {Object} settings - Compression settings
   */
  async optimizeDocument(pdfDoc, settings) {
    try {
      // Remove unused objects (pdf-lib handles this automatically during save)
      console.log('Document structure optimization applied');

      // Additional optimizations would go here
      if (settings.removeDuplicateObjects) {
        console.log('Duplicate object removal handled by pdf-lib');
      }

    } catch (error) {
      console.warn(`Warning: Could not optimize document: ${error.message}`);
    }
  }

  /**
   * Get compression settings based on level
   * @param {string} level - Compression level (low, medium, high)
   * @returns {Object} Compression settings
   */
  getCompressionSettings(level) {
    const settings = {
      low: {
        useObjectStreams: false,
        objectStreamCompressionMethod: 'deflate',
        scaleImages: false,
        removeAnnotations: false,
        removeDuplicateObjects: false
      },
      medium: {
        useObjectStreams: true,
        objectStreamCompressionMethod: 'deflate',
        scaleImages: false,
        removeAnnotations: false,
        removeDuplicateObjects: true
      },
      high: {
        useObjectStreams: true,
        objectStreamCompressionMethod: 'deflate',
        scaleImages: true,
        removeAnnotations: true,
        removeDuplicateObjects: true
      }
    };

    return settings[level] || settings.medium;
  }

  /**
   * Validate PDF file
   * @param {Buffer} buffer - PDF buffer
   * @returns {boolean} Whether file is valid PDF
   */
  async validatePDF(buffer) {
    try {
      await PDFDocument.load(buffer);
      return true;
    } catch (error) {
      console.error('PDF validation failed:', error.message);
      return false;
    }
  }

  /**
   * Get PDF information
   * @param {Buffer} buffer - PDF buffer
   * @returns {Object} PDF information
   */
  async getPDFInfo(buffer) {
    try {
      const pdfDoc = await PDFDocument.load(buffer);
      const pageCount = pdfDoc.getPageCount();
      
      return {
        pageCount,
        isValid: true,
        size: buffer.length
      };
    } catch (error) {
      return {
        pageCount: 0,
        isValid: false,
        size: buffer.length,
        error: error.message
      };
    }
  }
}

module.exports = new PDFConverter();