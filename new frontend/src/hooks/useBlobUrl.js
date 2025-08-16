/**
 * useBlobUrl Hook
 * ===============
 * 
 * React hook for managing blob URLs with automatic cleanup.
 * Prevents ERR_FILE_NOT_FOUND errors by properly managing blob URL lifecycle.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import blobUrlManager from '../utils/blobUrlManager';

/**
 * Hook for managing a single blob URL
 * @param {Blob|File|null} blob - The blob or file object
 * @param {string} componentId - Unique identifier for the component
 * @param {Object} options - Configuration options
 * @returns {Object} { url, isLoading, error, refresh }
 */
export const useBlobUrl = (blob, componentId, options = {}) => {
  const [url, setUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const currentUrlRef = useRef(null);
  const componentIdRef = useRef(componentId || `component-${Date.now()}`);

  const { 
    autoCleanup = true,
    metadata = {},
    onError = null 
  } = options;

  // Create blob URL
  const createUrl = useCallback(async (blobData) => {
    if (!blobData) {
      setUrl(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Clean up previous URL
      if (currentUrlRef.current) {
        blobUrlManager.revokeBlobUrl(currentUrlRef.current);
        currentUrlRef.current = null;
      }

      // Create new URL
      const newUrl = blobUrlManager.createBlobUrl(
        blobData, 
        componentIdRef.current, 
        metadata
      );

      if (newUrl) {
        currentUrlRef.current = newUrl;
        setUrl(newUrl);
      } else {
        throw new Error('Failed to create blob URL');
      }
    } catch (err) {
      console.error('🚫 useBlobUrl: Error creating blob URL:', err);
      setError(err.message);
      if (onError) {
        onError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [metadata, onError]);

  // Refresh function to recreate the URL
  const refresh = useCallback(() => {
    if (blob) {
      createUrl(blob);
    }
  }, [blob, createUrl]);

  // Create URL when blob changes
  useEffect(() => {
    createUrl(blob);
  }, [blob, createUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoCleanup && currentUrlRef.current) {
        blobUrlManager.revokeBlobUrl(currentUrlRef.current);
      }
    };
  }, [autoCleanup]);

  return {
    url,
    isLoading,
    error,
    refresh,
    isActive: currentUrlRef.current ? blobUrlManager.isUrlActive(currentUrlRef.current) : false
  };
};

/**
 * Hook for managing multiple blob URLs
 * @param {Array} blobs - Array of blob objects with { blob, id, metadata }
 * @param {string} componentId - Unique identifier for the component
 * @param {Object} options - Configuration options
 * @returns {Object} { urls, isLoading, errors, refresh, addBlob, removeBlob }
 */
export const useMultipleBlobUrls = (blobs = [], componentId, options = {}) => {
  const [urls, setUrls] = useState(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState(new Map());
  const componentIdRef = useRef(componentId || `multi-component-${Date.now()}`);
  const urlsRef = useRef(new Map());

  const { 
    autoCleanup = true,
    onError = null 
  } = options;

  // Create URLs for all blobs
  const createUrls = useCallback(async (blobArray) => {
    setIsLoading(true);
    setErrors(new Map());

    const newUrls = new Map();
    const newErrors = new Map();

    // Clean up existing URLs
    for (const url of urlsRef.current.values()) {
      blobUrlManager.revokeBlobUrl(url);
    }
    urlsRef.current.clear();

    // Create new URLs
    for (const blobData of blobArray) {
      if (!blobData || !blobData.blob || !blobData.id) {
        continue;
      }

      try {
        const url = blobUrlManager.createBlobUrl(
          blobData.blob,
          componentIdRef.current,
          { ...blobData.metadata, blobId: blobData.id }
        );

        if (url) {
          newUrls.set(blobData.id, url);
          urlsRef.current.set(blobData.id, url);
        } else {
          throw new Error(`Failed to create blob URL for ${blobData.id}`);
        }
      } catch (err) {
        console.error(`🚫 useMultipleBlobUrls: Error creating URL for ${blobData.id}:`, err);
        newErrors.set(blobData.id, err.message);
        if (onError) {
          onError(err, blobData.id);
        }
      }
    }

    setUrls(newUrls);
    setErrors(newErrors);
    setIsLoading(false);
  }, [onError]);

  // Add a single blob
  const addBlob = useCallback(async (blobData) => {
    if (!blobData || !blobData.blob || !blobData.id) {
      return;
    }

    try {
      const url = blobUrlManager.createBlobUrl(
        blobData.blob,
        componentIdRef.current,
        { ...blobData.metadata, blobId: blobData.id }
      );

      if (url) {
        setUrls(prev => new Map(prev).set(blobData.id, url));
        urlsRef.current.set(blobData.id, url);
        setErrors(prev => {
          const newErrors = new Map(prev);
          newErrors.delete(blobData.id);
          return newErrors;
        });
      } else {
        throw new Error(`Failed to create blob URL for ${blobData.id}`);
      }
    } catch (err) {
      console.error(`🚫 useMultipleBlobUrls: Error adding blob ${blobData.id}:`, err);
      setErrors(prev => new Map(prev).set(blobData.id, err.message));
      if (onError) {
        onError(err, blobData.id);
      }
    }
  }, [onError]);

  // Remove a single blob
  const removeBlob = useCallback((blobId) => {
    const url = urlsRef.current.get(blobId);
    if (url) {
      blobUrlManager.revokeBlobUrl(url);
      urlsRef.current.delete(blobId);
    }

    setUrls(prev => {
      const newUrls = new Map(prev);
      newUrls.delete(blobId);
      return newUrls;
    });

    setErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(blobId);
      return newErrors;
    });
  }, []);

  // Refresh all URLs
  const refresh = useCallback(() => {
    createUrls(blobs);
  }, [blobs, createUrls]);

  // Create URLs when blobs change
  useEffect(() => {
    createUrls(blobs);
  }, [blobs, createUrls]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoCleanup) {
        blobUrlManager.revokeComponentUrls(componentIdRef.current);
      }
    };
  }, [autoCleanup]);

  return {
    urls,
    isLoading,
    errors,
    refresh,
    addBlob,
    removeBlob,
    getUrl: (id) => urls.get(id),
    hasError: (id) => errors.has(id),
    getError: (id) => errors.get(id)
  };
};

/**
 * Hook for component-level blob URL cleanup
 * @param {string} componentId - Unique identifier for the component
 * @returns {Object} { cleanupUrls, getStats }
 */
export const useBlobUrlCleanup = (componentId) => {
  const componentIdRef = useRef(componentId || `cleanup-component-${Date.now()}`);

  const cleanupUrls = useCallback(() => {
    blobUrlManager.revokeComponentUrls(componentIdRef.current);
  }, []);

  const getStats = useCallback(() => {
    return {
      componentUrls: blobUrlManager.getComponentUrls(componentIdRef.current),
      globalStats: blobUrlManager.getStats()
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      blobUrlManager.revokeComponentUrls(componentIdRef.current);
    };
  }, []);

  return {
    cleanupUrls,
    getStats
  };
};

export default useBlobUrl;
