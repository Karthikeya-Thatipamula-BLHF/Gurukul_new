/**
 * Blob URL Error Boundary
 * =======================
 * 
 * Error boundary component specifically designed to catch and handle
 * blob URL related errors, including ERR_FILE_NOT_FOUND errors.
 */

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import blobUrlManager from '../utils/blobUrlManager';

class BlobUrlErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Check if this is a blob URL related error
    const isBlobError = error.message?.includes('blob:') || 
                       error.message?.includes('ERR_FILE_NOT_FOUND') ||
                       error.message?.includes('Failed to fetch') ||
                       error.stack?.includes('blob:');

    return {
      hasError: true,
      isBlobError
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚫 BlobUrlErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // If it's a blob URL error, try to clean up and recover
    if (this.state.isBlobError) {
      this.handleBlobUrlError(error);
    }

    // Report to error tracking service if available
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleBlobUrlError = (error) => {
    console.log('🔧 Attempting to recover from blob URL error...');
    
    // Clean up potentially corrupted blob URLs
    if (this.props.componentId) {
      blobUrlManager.revokeComponentUrls(this.props.componentId);
    }

    // Clean up old URLs that might be causing issues
    blobUrlManager.cleanupOldUrls(5 * 60 * 1000); // Clean URLs older than 5 minutes

    // Log current blob URL stats for debugging
    const stats = blobUrlManager.getStats();
    console.log('📊 Blob URL stats after cleanup:', stats);
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));

    // Additional cleanup on retry
    this.handleBlobUrlError(this.state.error);

    // Call retry callback if provided
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleReset = () => {
    // Full reset - clear all blob URLs and restart
    blobUrlManager.cleanup();
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, isBlobError, retryCount } = this.state;
      const { fallback: Fallback, showDetails = false } = this.props;

      // If a custom fallback component is provided, use it
      if (Fallback) {
        return (
          <Fallback 
            error={error}
            retry={this.handleRetry}
            reset={this.handleReset}
            isBlobError={isBlobError}
            retryCount={retryCount}
          />
        );
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
          
          <h3 className="text-lg font-semibold text-red-300 mb-2">
            {isBlobError ? 'Media Loading Error' : 'Something went wrong'}
          </h3>
          
          <p className="text-red-200 text-center mb-4 max-w-md">
            {isBlobError 
              ? 'There was an issue loading media content. This usually happens when files are temporarily unavailable.'
              : 'An unexpected error occurred while rendering this component.'
            }
          </p>

          {showDetails && error && (
            <details className="mb-4 w-full max-w-md">
              <summary className="text-red-300 cursor-pointer hover:text-red-200">
                Error Details
              </summary>
              <div className="mt-2 p-3 bg-red-900/20 rounded border border-red-500/30">
                <p className="text-xs text-red-200 font-mono break-all">
                  {error.message}
                </p>
              </div>
            </details>
          )}

          <div className="flex space-x-3">
            <button
              onClick={this.handleRetry}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
              disabled={retryCount >= 3}
            >
              <RefreshCw className="w-4 h-4" />
              <span>
                {retryCount >= 3 ? 'Max Retries Reached' : `Retry ${retryCount > 0 ? `(${retryCount}/3)` : ''}`}
              </span>
            </button>

            {isBlobError && (
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-orange-500/20 border border-orange-500/30 text-orange-300 rounded-lg hover:bg-orange-500/30 transition-colors"
              >
                Reset Media
              </button>
            )}
          </div>

          {isBlobError && (
            <p className="text-xs text-red-300/60 mt-3 text-center">
              Try refreshing the page if the issue persists
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export const withBlobUrlErrorBoundary = (Component, options = {}) => {
  return React.forwardRef((props, ref) => (
    <BlobUrlErrorBoundary {...options}>
      <Component {...props} ref={ref} />
    </BlobUrlErrorBoundary>
  ));
};

// Hook for programmatic error boundary usage
export const useBlobUrlErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const handleError = React.useCallback((error) => {
    console.error('🚫 Blob URL error handled:', error);
    
    // Check if it's a blob URL error
    const isBlobError = error.message?.includes('blob:') || 
                       error.message?.includes('ERR_FILE_NOT_FOUND') ||
                       error.message?.includes('Failed to fetch');

    if (isBlobError) {
      // Clean up old URLs
      blobUrlManager.cleanupOldUrls(5 * 60 * 1000);
      
      // Set error state
      setError(error);
      
      // Auto-clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
    hasError: !!error
  };
};

export default BlobUrlErrorBoundary;
