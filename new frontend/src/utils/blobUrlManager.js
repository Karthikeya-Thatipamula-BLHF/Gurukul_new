/**
 * Blob URL Manager
 * ================
 * 
 * Centralized management of blob URLs to prevent ERR_FILE_NOT_FOUND errors.
 * Handles creation, tracking, and cleanup of blob URLs with proper lifecycle management.
 */

class BlobUrlManager {
  constructor() {
    this.activeUrls = new Map(); // Map of URL -> metadata
    this.urlsByComponent = new Map(); // Map of component ID -> Set of URLs
    this.cleanupCallbacks = new Map(); // Map of URL -> cleanup callback
    
    // Bind methods to preserve context
    this.createBlobUrl = this.createBlobUrl.bind(this);
    this.revokeBlobUrl = this.revokeBlobUrl.bind(this);
    this.revokeComponentUrls = this.revokeComponentUrls.bind(this);
    this.cleanup = this.cleanup.bind(this);
    
    // Auto-cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.cleanup);
    }
  }

  /**
   * Create a blob URL with tracking and enhanced stability
   * @param {Blob|File} blob - The blob or file object
   * @param {string} componentId - Unique identifier for the component using this URL
   * @param {Object} metadata - Optional metadata for debugging
   * @returns {string} The blob URL
   */
  createBlobUrl(blob, componentId = 'unknown', metadata = {}) {
    try {
      if (!blob || typeof blob.size === 'undefined') {
        console.error('🚫 BlobUrlManager: Invalid blob provided', blob);
        return null;
      }

      // Ensure blob is valid and has data
      if (blob.size === 0) {
        console.warn('🚫 BlobUrlManager: Empty blob provided', { componentId, metadata });
        return null;
      }

      const url = URL.createObjectURL(blob);

      // Create a strong reference to the blob to prevent garbage collection
      const blobRef = new Blob([blob], { type: blob.type });

      // Track the URL with enhanced metadata
      this.activeUrls.set(url, {
        blob: blobRef, // Store the blob reference to prevent GC
        originalBlob: blob, // Keep original reference
        componentId,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 0,
        size: blob.size,
        type: blob.type,
        isActive: true,
        ...metadata
      });

      // Track by component
      if (!this.urlsByComponent.has(componentId)) {
        this.urlsByComponent.set(componentId, new Set());
      }
      this.urlsByComponent.get(componentId).add(url);

      console.log(`🔗 BlobUrlManager: Created URL for ${componentId}:`, {
        url: url.substring(0, 50) + '...',
        size: blob.size,
        type: blob.type,
        totalActive: this.activeUrls.size
      });

      // Set up a delayed validation to ensure the URL is accessible
      setTimeout(() => {
        this.validateBlobUrl(url);
      }, 100);

      return url;
    } catch (error) {
      console.error('🚫 BlobUrlManager: Error creating blob URL:', error);
      return null;
    }
  }

  /**
   * Validate that a blob URL is accessible (simplified)
   * @param {string} url - The blob URL to validate
   */
  validateBlobUrl(url) {
    if (!this.activeUrls.has(url)) {
      return false;
    }

    // Just log that we're tracking this URL - don't do complex validation
    console.log(`✅ BlobUrlManager: URL is being tracked: ${url.substring(0, 50)}...`);
    return true;
  }

  /**
   * Mark a blob URL as accessed (for tracking usage)
   * @param {string} url - The blob URL that was accessed
   */
  markUrlAccessed(url) {
    const metadata = this.activeUrls.get(url);
    if (metadata) {
      metadata.lastAccessed = Date.now();
      metadata.accessCount++;
    }
  }

  /**
   * Revoke a specific blob URL with enhanced safety
   * @param {string} url - The blob URL to revoke
   */
  revokeBlobUrl(url) {
    if (!url || !url.startsWith('blob:')) {
      return;
    }

    try {
      const metadata = this.activeUrls.get(url);

      if (!metadata) {
        console.warn(`🚫 BlobUrlManager: Attempted to revoke unknown URL: ${url.substring(0, 50)}...`);
        return;
      }

      // Mark as inactive before revoking
      metadata.isActive = false;

      // Execute cleanup callback if exists
      const cleanupCallback = this.cleanupCallbacks.get(url);
      if (cleanupCallback) {
        try {
          cleanupCallback();
        } catch (error) {
          console.warn('🚫 BlobUrlManager: Error in cleanup callback:', error);
        }
        this.cleanupCallbacks.delete(url);
      }

      // Small delay to ensure any pending operations complete
      setTimeout(() => {
        try {
          // Revoke the URL
          URL.revokeObjectURL(url);

          // Remove from tracking
          this.activeUrls.delete(url);

          // Remove from component tracking
          if (metadata) {
            const componentUrls = this.urlsByComponent.get(metadata.componentId);
            if (componentUrls) {
              componentUrls.delete(url);
              if (componentUrls.size === 0) {
                this.urlsByComponent.delete(metadata.componentId);
              }
            }
          }

          console.log(`🗑️ BlobUrlManager: Revoked URL for ${metadata?.componentId || 'unknown'}:`, {
            url: url.substring(0, 50) + '...',
            accessCount: metadata?.accessCount || 0,
            totalActive: this.activeUrls.size
          });
        } catch (revokeError) {
          console.error('🚫 BlobUrlManager: Error during delayed revoke:', revokeError);
        }
      }, 50); // Small delay to prevent race conditions

    } catch (error) {
      console.error('🚫 BlobUrlManager: Error revoking blob URL:', error);
    }
  }

  /**
   * Revoke all blob URLs for a specific component
   * @param {string} componentId - The component identifier
   */
  revokeComponentUrls(componentId) {
    const componentUrls = this.urlsByComponent.get(componentId);
    if (!componentUrls) {
      return;
    }

    const urlsToRevoke = Array.from(componentUrls);
    urlsToRevoke.forEach(url => this.revokeBlobUrl(url));

    console.log(`🧹 BlobUrlManager: Cleaned up ${urlsToRevoke.length} URLs for component: ${componentId}`);
  }

  /**
   * Register a cleanup callback for a URL
   * @param {string} url - The blob URL
   * @param {Function} callback - Cleanup function to call when URL is revoked
   */
  registerCleanupCallback(url, callback) {
    if (typeof callback === 'function') {
      this.cleanupCallbacks.set(url, callback);
    }
  }

  /**
   * Check if a blob URL is still active
   * @param {string} url - The blob URL to check
   * @returns {boolean} True if the URL is active
   */
  isUrlActive(url) {
    return this.activeUrls.has(url);
  }

  /**
   * Get metadata for a blob URL
   * @param {string} url - The blob URL
   * @returns {Object|null} Metadata object or null if not found
   */
  getUrlMetadata(url) {
    return this.activeUrls.get(url) || null;
  }

  /**
   * Get all active URLs for a component
   * @param {string} componentId - The component identifier
   * @returns {Array} Array of active URLs
   */
  getComponentUrls(componentId) {
    const componentUrls = this.urlsByComponent.get(componentId);
    return componentUrls ? Array.from(componentUrls) : [];
  }

  /**
   * Get statistics about active blob URLs
   * @returns {Object} Statistics object
   */
  getStats() {
    const stats = {
      totalUrls: this.activeUrls.size,
      totalComponents: this.urlsByComponent.size,
      totalSize: 0,
      byComponent: {},
      byType: {}
    };

    for (const [url, metadata] of this.activeUrls) {
      stats.totalSize += metadata.size || 0;
      
      // By component
      if (!stats.byComponent[metadata.componentId]) {
        stats.byComponent[metadata.componentId] = { count: 0, size: 0 };
      }
      stats.byComponent[metadata.componentId].count++;
      stats.byComponent[metadata.componentId].size += metadata.size || 0;
      
      // By type
      const type = metadata.type || 'unknown';
      if (!stats.byType[type]) {
        stats.byType[type] = { count: 0, size: 0 };
      }
      stats.byType[type].count++;
      stats.byType[type].size += metadata.size || 0;
    }

    return stats;
  }

  /**
   * Clean up old URLs (older than specified age)
   * @param {number} maxAge - Maximum age in milliseconds (default: 1 hour)
   */
  cleanupOldUrls(maxAge = 60 * 60 * 1000) {
    const now = Date.now();
    const urlsToRevoke = [];

    for (const [url, metadata] of this.activeUrls) {
      if (now - metadata.createdAt > maxAge) {
        urlsToRevoke.push(url);
      }
    }

    urlsToRevoke.forEach(url => this.revokeBlobUrl(url));

    if (urlsToRevoke.length > 0) {
      console.log(`🧹 BlobUrlManager: Cleaned up ${urlsToRevoke.length} old URLs`);
    }
  }

  /**
   * Clean up all blob URLs
   */
  cleanup() {
    const totalUrls = this.activeUrls.size;
    
    // Revoke all URLs
    for (const url of this.activeUrls.keys()) {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.warn('🚫 BlobUrlManager: Error during cleanup:', error);
      }
    }

    // Clear all tracking
    this.activeUrls.clear();
    this.urlsByComponent.clear();
    this.cleanupCallbacks.clear();

    if (totalUrls > 0) {
      console.log(`🧹 BlobUrlManager: Cleaned up ${totalUrls} URLs on shutdown`);
    }
  }

  /**
   * Debug method to log current state
   */
  debug() {
    console.log('🔍 BlobUrlManager Debug:', {
      stats: this.getStats(),
      activeUrls: Array.from(this.activeUrls.keys()).map(url => ({
        url: url.substring(0, 50) + '...',
        metadata: this.activeUrls.get(url)
      }))
    });
  }
}

// Create singleton instance
const blobUrlManager = new BlobUrlManager();

// Auto-cleanup every 30 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    blobUrlManager.cleanupOldUrls();
  }, 30 * 60 * 1000);
}

export default blobUrlManager;
