import React, { memo, useMemo } from 'react';
import AvatarViewer from './AvatarViewer';
import ImageViewer from './ImageViewer';
import ImageAvatarViewer from './ImageAvatarViewer';

/**
 * Unified Media Viewer Component
 * Automatically detects file type and renders appropriate viewer
 */
const MediaViewer = memo(function MediaViewer({
  mediaPath,
  mediaType = null, // 'image' | '3d' | null (auto-detect)
  className = "",
  enableControls = true,
  autoRotate = false,
  fallbackMessage = "Media",
  onError = null,
  onLoad = null,
  isFloatingAvatar = false, // New prop to indicate if this is a floating/pinned avatar
  ...props
}) {
  // Auto-detect media type if not provided
  const detectedType = useMemo(() => {
    if (mediaType) return mediaType;
    
    if (!mediaPath) return null;
    
    // Check for image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const modelExtensions = ['.glb', '.gltf'];
    
    const lowerPath = mediaPath.toLowerCase();
    
    if (imageExtensions.some(ext => lowerPath.includes(ext))) {
      return 'image';
    }
    
    if (modelExtensions.some(ext => lowerPath.includes(ext))) {
      return '3d';
    }
    
    // Check for data URLs
    if (mediaPath.startsWith('data:image/')) {
      return 'image';
    }
    
    if (mediaPath.startsWith('data:application/octet-stream') || mediaPath.startsWith('blob:')) {
      return '3d';
    }
    
    // Default to 3d for backward compatibility
    return '3d';
  }, [mediaPath, mediaType]);

  // Render appropriate viewer based on detected type
  if (detectedType === 'image') {
    // For floating avatars, use ImageAvatarViewer which handles 2D transformations
    if (isFloatingAvatar) {
      const {
        autoRotate,
        autoRotateSpeed,
        showEnvironment,
        environmentPreset,
        cameraPosition,
        enableInteraction,
        enableAnimations,
        isSpeaking,
        fov,
        lights,
        style: avatarStyle, // Exclude the 3D style prop
        ...imageAvatarProps
      } = props;

      return (
        <ImageAvatarViewer
          imagePath={mediaPath}
          className={className}
          enableControls={enableControls}
          fallbackMessage={fallbackMessage}
          onError={onError}
          onLoad={onLoad}
          {...imageAvatarProps}
        />
      );
    } else {
      // For regular image viewing, use ImageViewer with full controls
      const {
        autoRotate,
        autoRotateSpeed,
        showEnvironment,
        environmentPreset,
        position,
        rotation,
        scale,
        cameraPosition,
        enableInteraction,
        enableAnimations,
        isSpeaking,
        fov,
        lights,
        style: avatarStyle, // Exclude the 3D style prop
        ...imageProps
      } = props;

      return (
        <ImageViewer
          imagePath={mediaPath}
          className={className}
          enableControls={enableControls}
          fallbackMessage={fallbackMessage}
          onError={onError}
          onLoad={onLoad}
          {...imageProps}
        />
      );
    }
  }

  if (detectedType === '3d') {
    return (
      <AvatarViewer
        avatarPath={mediaPath}
        className={className}
        enableControls={enableControls}
        autoRotate={autoRotate}
        fallbackMessage={fallbackMessage}
        onError={onError}
        onLoad={onLoad}
        {...props}
      />
    );
  }
  
  // Fallback for unknown types
  return (
    <div className={`w-full h-full flex items-center justify-center bg-black/20 text-white/60 ${className}`}>
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-3 bg-white/10 rounded-lg flex items-center justify-center">
          <span className="text-2xl">📄</span>
        </div>
        <p className="mb-2">Unsupported file type</p>
        <p className="text-sm text-white/40">
          Supported: Images (JPG, PNG, WebP, etc.) and 3D Models (GLB)
        </p>
      </div>
    </div>
  );
});

export default MediaViewer;
