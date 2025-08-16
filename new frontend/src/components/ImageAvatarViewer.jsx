import React, { useState, useEffect, memo, useRef } from 'react';

/**
 * Image Avatar Viewer Component
 * Specifically designed for displaying images as floating/pinned avatars
 * Handles 2D transformations that make sense for images
 */
const ImageAvatarViewer = memo(function ImageAvatarViewer({
  imagePath,
  className = "",
  position = [0, 0, 0], // Only X and Y matter for images, Z is ignored
  rotation = [0, 0, 0], // Only Z rotation (2D rotation) makes sense for images
  scale = 1,
  fallbackMessage = "Image Avatar",
  onError = null,
  onLoad = null,
  style = {},
  enableControls = false, // Usually false for floating avatars
  ...props
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef(null);

  // Reset state when image path changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [imagePath]);

  // Handle image load
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    if (onLoad) onLoad();
  };

  // Handle image error
  const handleImageError = (error) => {
    setImageError(true);
    setImageLoaded(false);
    if (onError) onError(error);
  };

  // Calculate CSS transforms based on position, rotation, and scale
  const imageTransform = React.useMemo(() => {
    const [x, y] = position; // Only use X and Y for 2D positioning
    const [, , zRotation] = rotation; // Only use Z rotation for 2D rotation
    
    // Convert position to pixels (multiply by a factor for reasonable movement)
    const pixelX = x * 50; // 1 unit = 50 pixels
    const pixelY = -y * 50; // Negative Y because CSS Y is inverted
    
    // Convert rotation from radians to degrees
    const degrees = (zRotation * 180) / Math.PI;
    
    return `translate(${pixelX}px, ${pixelY}px) scale(${scale}) rotate(${degrees}deg)`;
  }, [position, rotation, scale]);



  if (!imagePath) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-black/20 text-white/60 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 bg-white/10 rounded-lg flex items-center justify-center">
            <span className="text-2xl">🖼️</span>
          </div>
          <p>{fallbackMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full h-full overflow-visible ${className}`}
      ref={containerRef}
      style={style}
    >
      {/* Image Container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative transition-transform duration-200 ease-out"
          style={{
            transform: imageTransform,
            transformOrigin: 'center center'
          }}
        >
          <img
            src={imagePath}
            alt="Avatar Image"
            className="max-w-none h-auto object-contain"
            style={{
              maxHeight: '200px', // Reasonable default size
              maxWidth: '200px',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              border: '2px solid rgba(255, 255, 255, 0.1)'
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            draggable={false}
          />
        </div>
      </div>

      {/* Loading state */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto mb-2"></div>
            <span className="text-sm">Loading image...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg text-white">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-red-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">❌</span>
            </div>
            <p className="mb-2 text-sm">Failed to load image</p>
            <button
              onClick={() => {
                setImageError(false);
                setImageLoaded(false);
              }}
              className="px-3 py-1 bg-orange-500 rounded hover:bg-orange-600 transition-colors text-xs"
            >
              Retry
            </button>
          </div>
        </div>
      )}


    </div>
  );
});

export default ImageAvatarViewer;
