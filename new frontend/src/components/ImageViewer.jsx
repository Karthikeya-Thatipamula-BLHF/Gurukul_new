import React, { useState, useEffect, memo, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Move, Maximize2, Minimize2 } from 'lucide-react';

/**
 * Image Viewer Component
 * Displays uploaded images with zoom, pan, and rotation controls
 */
const ImageViewer = memo(function ImageViewer({
  imagePath,
  className = "",
  enableControls = true,
  fallbackMessage = "Image",
  onError = null,
  onLoad = null,
  style = {},
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Reset transformations when image path changes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
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

  // Zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  // Rotation control
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Reset all transformations
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Fullscreen toggle
  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Mouse drag handling
  const handleMouseDown = (e) => {
    if (!enableControls) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !enableControls) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e) => {
    if (!enableControls) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
  };

  // Add mouse event listeners
  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, position]);

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
      className={`relative w-full h-full overflow-hidden bg-black/20 ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}
      ref={containerRef}
      onWheel={handleWheel}
      style={style}
    >
      {/* Image */}
      <div className="w-full h-full flex items-center justify-center">
        <img
          ref={imageRef}
          src={imagePath}
          alt="Uploaded image"
          className={`max-w-none transition-all duration-200 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: 'center center'
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onMouseDown={handleMouseDown}
          draggable={false}
        />
      </div>

      {/* Loading state */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto mb-2"></div>
            <span>Loading image...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-red-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">❌</span>
            </div>
            <p className="mb-2">Failed to load image</p>
            <button
              onClick={() => {
                setImageError(false);
                setImageLoaded(false);
              }}
              className="px-4 py-2 bg-orange-500 rounded hover:bg-orange-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      {enableControls && imageLoaded && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-black/50 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-black/70 transition-colors text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-black/50 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-black/70 transition-colors text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 bg-black/50 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-black/70 transition-colors text-white"
            title="Rotate"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 bg-black/50 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-black/70 transition-colors text-white"
            title="Reset View"
          >
            <Move className="w-4 h-4" />
          </button>
          <button
            onClick={handleFullscreen}
            className="p-2 bg-black/50 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-black/70 transition-colors text-white"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Info overlay */}
      {enableControls && imageLoaded && (
        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg border border-white/20 px-3 py-2 text-white text-sm">
          Zoom: {Math.round(zoom * 100)}% | Rotation: {rotation}°
        </div>
      )}
    </div>
  );
});

export default ImageViewer;
