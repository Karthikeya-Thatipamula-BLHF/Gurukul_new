/**
 * Safe Audio Player
 * =================
 * 
 * A wrapper around the HTML Audio API that safely handles blob URLs
 * and prevents ERR_FILE_NOT_FOUND errors.
 */

import blobUrlManager from './blobUrlManager';

class SafeAudioPlayer {
  constructor() {
    this.activeAudios = new Map(); // Map of audio element -> metadata
    this.audioQueue = [];
    this.isPlaying = false;
    this.currentAudio = null;
  }

  /**
   * Create a safe audio element with blob URL protection
   * @param {string} audioUrl - The audio URL (blob or regular)
   * @param {Object} options - Audio options
   * @returns {Promise<HTMLAudioElement>} Audio element
   */
  async createSafeAudio(audioUrl, options = {}) {
    try {
      if (!audioUrl) {
        throw new Error('Audio URL is required');
      }

      // Mark blob URL as accessed if it's a blob URL
      if (audioUrl.startsWith('blob:')) {
        blobUrlManager.markUrlAccessed(audioUrl);
        
        // Verify the blob URL is still active
        if (!blobUrlManager.isUrlActive(audioUrl)) {
          throw new Error('Blob URL is no longer active');
        }
      }

      const audio = new Audio();
      
      // Set up audio properties
      audio.preload = options.preload || 'auto';
      audio.volume = options.volume || 0.8;
      audio.crossOrigin = 'anonymous';
      
      // Track this audio element
      const audioMetadata = {
        url: audioUrl,
        createdAt: Date.now(),
        options,
        isBlob: audioUrl.startsWith('blob:'),
        element: audio
      };
      
      this.activeAudios.set(audio, audioMetadata);

      // Set up error handling
      audio.addEventListener('error', (event) => {
        console.error('🚫 SafeAudioPlayer: Audio error:', {
          error: event.error,
          url: audioUrl.substring(0, 50) + '...',
          code: audio.error?.code,
          message: audio.error?.message
        });
        
        // Clean up on error
        this.cleanupAudio(audio);
        
        if (options.onError) {
          options.onError(event);
        }
      });

      // Set up load events
      audio.addEventListener('loadstart', () => {
        console.log('🔊 SafeAudioPlayer: Audio load started');
      });

      audio.addEventListener('canplay', () => {
        console.log('🔊 SafeAudioPlayer: Audio can play');
      });

      audio.addEventListener('ended', () => {
        console.log('🔊 SafeAudioPlayer: Audio playback ended');
        this.cleanupAudio(audio);
        
        if (options.onEnded) {
          options.onEnded();
        }
      });

      // Set the source with error protection
      await this.setSafeAudioSource(audio, audioUrl);

      return audio;
    } catch (error) {
      console.error('🚫 SafeAudioPlayer: Error creating safe audio:', error);
      throw error;
    }
  }

  /**
   * Safely set audio source with minimal validation
   * @param {HTMLAudioElement} audio - Audio element
   * @param {string} audioUrl - Audio URL
   */
  async setSafeAudioSource(audio, audioUrl) {
    return new Promise((resolve, reject) => {
      // For blob URLs, just check if it's tracked by our manager
      if (audioUrl.startsWith('blob:')) {
        // Mark as accessed if it's a managed blob URL
        if (blobUrlManager.isUrlActive(audioUrl)) {
          blobUrlManager.markUrlAccessed(audioUrl);
        }
      }

      // Set up error handling before setting source
      const handleLoadError = (event) => {
        console.error('🚫 SafeAudioPlayer: Audio load error:', event);
        audio.removeEventListener('error', handleLoadError);
        reject(new Error('Audio failed to load'));
      };

      const handleCanPlay = () => {
        console.log('🔊 SafeAudioPlayer: Audio can play');
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('error', handleLoadError);
        resolve();
      };

      // Add temporary event listeners
      audio.addEventListener('error', handleLoadError);
      audio.addEventListener('canplay', handleCanPlay);

      // Set the source
      audio.src = audioUrl;

      // Set a timeout for loading
      setTimeout(() => {
        audio.removeEventListener('error', handleLoadError);
        audio.removeEventListener('canplay', handleCanPlay);
        reject(new Error('Audio loading timeout'));
      }, 10000); // 10 second timeout
    });
  }

  /**
   * Play audio safely with blob URL protection
   * @param {string} audioUrl - Audio URL to play
   * @param {Object} options - Playback options
   * @returns {Promise<void>}
   */
  async playSafe(audioUrl, options = {}) {
    try {
      // Stop current audio if playing
      if (this.currentAudio) {
        this.stopCurrent();
      }

      console.log('🔊 SafeAudioPlayer: Starting safe playback:', {
        url: audioUrl.substring(0, 50) + '...',
        isBlob: audioUrl.startsWith('blob:')
      });

      // Create safe audio element
      const audio = await this.createSafeAudio(audioUrl, {
        ...options,
        onEnded: () => {
          this.isPlaying = false;
          this.currentAudio = null;
          if (options.onEnded) {
            options.onEnded();
          }
        },
        onError: (error) => {
          this.isPlaying = false;
          this.currentAudio = null;
          if (options.onError) {
            options.onError(error);
          }
        }
      });

      // Set as current audio
      this.currentAudio = audio;
      this.isPlaying = true;

      // Start playback
      await audio.play();
      
      console.log('🔊 SafeAudioPlayer: Playback started successfully');

      if (options.onPlayStart) {
        options.onPlayStart();
      }

    } catch (error) {
      console.error('🚫 SafeAudioPlayer: Safe playback failed:', error);
      this.isPlaying = false;
      this.currentAudio = null;
      
      if (options.onError) {
        options.onError(error);
      }
      
      throw error;
    }
  }

  /**
   * Stop current audio playback
   */
  stopCurrent() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.cleanupAudio(this.currentAudio);
      } catch (error) {
        console.warn('🚫 SafeAudioPlayer: Error stopping current audio:', error);
      }
      
      this.currentAudio = null;
      this.isPlaying = false;
    }
  }

  /**
   * Clean up an audio element
   * @param {HTMLAudioElement} audio - Audio element to clean up
   */
  cleanupAudio(audio) {
    if (!audio) return;

    try {
      const metadata = this.activeAudios.get(audio);
      
      // Remove event listeners
      audio.removeEventListener('error', () => {});
      audio.removeEventListener('ended', () => {});
      audio.removeEventListener('loadstart', () => {});
      audio.removeEventListener('canplay', () => {});
      
      // Clear source
      audio.src = '';
      audio.load(); // Reset the audio element
      
      // Remove from tracking
      this.activeAudios.delete(audio);
      
      console.log('🧹 SafeAudioPlayer: Audio element cleaned up:', {
        wasBlob: metadata?.isBlob || false,
        url: metadata?.url?.substring(0, 50) + '...' || 'unknown'
      });
      
    } catch (error) {
      console.warn('🚫 SafeAudioPlayer: Error during audio cleanup:', error);
    }
  }

  /**
   * Clean up all active audio elements
   */
  cleanupAll() {
    console.log('🧹 SafeAudioPlayer: Cleaning up all audio elements');
    
    for (const audio of this.activeAudios.keys()) {
      this.cleanupAudio(audio);
    }
    
    this.currentAudio = null;
    this.isPlaying = false;
    this.audioQueue = [];
  }

  /**
   * Get current playback status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isPlaying: this.isPlaying,
      currentAudio: this.currentAudio ? 'active' : null,
      activeAudios: this.activeAudios.size,
      queueLength: this.audioQueue.length
    };
  }
}

// Create singleton instance
const safeAudioPlayer = new SafeAudioPlayer();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    safeAudioPlayer.cleanupAll();
  });
}

export default safeAudioPlayer;
