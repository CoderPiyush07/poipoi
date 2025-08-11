const sharp = require('sharp');

class ImageConverter {
  /**
   * Convert image to specified format with compression
   * @param {Object} options - Conversion options
   * @returns {Buffer} Converted image buffer
   */
  async convert({ buffer, outputFormat, compressionLevel, metadata, progressCallback }) {
    try {
      // Initialize Sharp instance
      let sharpInstance = sharp(buffer);

      // Update progress
      if (progressCallback) progressCallback(10, 'Initializing conversion...');

      // Get compression settings based on level
      const compressionSettings = this.getCompressionSettings(outputFormat, compressionLevel);

      // Update progress
      if (progressCallback) progressCallback(30, 'Applying compression settings...');

      // Apply format-specific processing
      switch (outputFormat.toLowerCase()) {
        case 'jpg':
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg(compressionSettings);
          break;
        case 'png':
          sharpInstance = sharpInstance.png(compressionSettings);
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp(compressionSettings);
          break;
        case 'bmp':
          sharpInstance = sharpInstance.bmp();
          break;
        case 'gif':
          sharpInstance = sharpInstance.gif();
          break;
        case 'tiff':
          sharpInstance = sharpInstance.tiff(compressionSettings);
          break;
        default:
          throw new Error(`Unsupported output format: ${outputFormat}`);
      }

      // Update progress
      if (progressCallback) progressCallback(60, 'Converting image...');

      // Perform the conversion
      const convertedBuffer = await sharpInstance.toBuffer();

      // Update progress
      if (progressCallback) progressCallback(90, 'Finalizing conversion...');

      console.log(`Image converted from ${metadata.format} to ${outputFormat}`);
      console.log(`Size: ${buffer.length} -> ${convertedBuffer.length} bytes`);

      if (progressCallback) progressCallback(100, 'Conversion complete!');

      return convertedBuffer;

    } catch (error) {
      console.error('Image conversion error:', error);
      throw new Error(`Failed to convert image: ${error.message}`);
    }
  }

  /**
   * Get compression settings based on format and level
   * @param {string} format - Output format
   * @param {string} level - Compression level (low, medium, high)
   * @returns {Object} Compression settings
   */
  getCompressionSettings(format, level) {
    const settings = {
      jpg: {
        low: { quality: 90, progressive: true },
        medium: { quality: 75, progressive: true },
        high: { quality: 60, progressive: true, mozjpeg: true }
      },
      jpeg: {
        low: { quality: 90, progressive: true },
        medium: { quality: 75, progressive: true },
        high: { quality: 60, progressive: true, mozjpeg: true }
      },
      png: {
        low: { compressionLevel: 3, adaptiveFiltering: false },
        medium: { compressionLevel: 6, adaptiveFiltering: true },
        high: { compressionLevel: 9, adaptiveFiltering: true, palette: true }
      },
      webp: {
        low: { quality: 90, effort: 2 },
        medium: { quality: 75, effort: 4 },
        high: { quality: 60, effort: 6, lossless: false }
      },
      tiff: {
        low: { compression: 'lzw' },
        medium: { compression: 'deflate' },
        high: { compression: 'jpeg', quality: 75 }
      }
    };

    return settings[format.toLowerCase()]?.[level] || settings[format.toLowerCase()]?.medium || {};
  }

  /**
   * Get supported input formats
   * @returns {Array} Supported formats
   */
  getSupportedInputFormats() {
    return ['jpeg', 'jpg', 'png', 'webp', 'bmp', 'gif', 'tiff', 'heic'];
  }

  /**
   * Get supported output formats
   * @returns {Array} Supported formats
   */
  getSupportedOutputFormats() {
    return ['jpeg', 'jpg', 'png', 'webp', 'bmp', 'gif', 'tiff'];
  }

  /**
   * Validate if conversion is possible
   * @param {string} inputFormat - Input format
   * @param {string} outputFormat - Output format
   * @returns {boolean} Whether conversion is possible
   */
  canConvert(inputFormat, outputFormat) {
    const supportedInput = this.getSupportedInputFormats();
    const supportedOutput = this.getSupportedOutputFormats();
    
    return supportedInput.includes(inputFormat.toLowerCase()) && 
           supportedOutput.includes(outputFormat.toLowerCase());
  }
}

module.exports = new ImageConverter();