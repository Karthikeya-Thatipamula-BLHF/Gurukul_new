import React, { useCallback } from 'react';

/**
 * Image Avatar Settings Component
 * Provides controls that make sense for 2D image avatars
 */
const ImageAvatarSettings = ({
  pinPosition,
  pinRotation,
  pinScale,
  dispatch,
  setPinPosition,
  setPinRotation,
  setPinScale,
}) => {
  
  // Position controls (only X and Y make sense for images)
  const renderImagePositionControls = useCallback(() => {
    const handleXChange = (e) => {
      const value = parseFloat(e.target.value);
      const finalValue = isNaN(value) ? 0 : value;
      dispatch(setPinPosition({ ...pinPosition, x: finalValue }));
    };

    const handleYChange = (e) => {
      const value = parseFloat(e.target.value);
      const finalValue = isNaN(value) ? 0 : value;
      dispatch(setPinPosition({ ...pinPosition, y: finalValue }));
    };

    return (
      <div className="space-y-3">
        <h3 className="text-white font-medium text-sm">Image Position</h3>
        
        {/* Only X and Y for 2D positioning */}
        <div className="grid grid-cols-2 gap-3">
          {/* X Position */}
          <div>
            <label className="block text-white/70 text-xs mb-1">Horizontal (X)</label>
            <input
              type="number"
              min="-10"
              max="10"
              step="0.5"
              value={pinPosition.x.toFixed(1)}
              onChange={handleXChange}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-orange-400"
            />
          </div>

          {/* Y Position */}
          <div>
            <label className="block text-white/70 text-xs mb-1">Vertical (Y)</label>
            <input
              type="number"
              min="-10"
              max="10"
              step="0.5"
              value={pinPosition.y.toFixed(1)}
              onChange={handleYChange}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-orange-400"
            />
          </div>
        </div>
        
        <div className="text-xs text-white/40">
          Move the image left/right and up/down on screen
        </div>
      </div>
    );
  }, [pinPosition, dispatch, setPinPosition]);

  // Rotation control (only Z rotation makes sense for 2D images)
  const renderImageRotationControls = useCallback(() => {
    const handleRotationChange = (e) => {
      const value = parseInt(e.target.value);
      const finalValue = isNaN(value) ? 0 : value;
      // Keep X and Y at 0, only change Z for 2D rotation
      dispatch(setPinRotation({ x: 0, y: 0, z: finalValue }));
    };

    return (
      <div className="space-y-3">
        <h3 className="text-white font-medium text-sm">Image Rotation</h3>
        
        <div>
          <label className="block text-white/70 text-xs mb-1">Angle (degrees)</label>
          <input
            type="number"
            min="-180"
            max="180"
            step="15"
            value={pinRotation.z}
            onChange={handleRotationChange}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-orange-400"
          />
        </div>
        
        {/* Quick rotation buttons */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => dispatch(setPinRotation({ x: 0, y: 0, z: 0 }))}
            className="px-2 py-1 bg-white/10 text-white/70 rounded text-xs hover:bg-white/20 transition-colors"
          >
            0°
          </button>
          <button
            onClick={() => dispatch(setPinRotation({ x: 0, y: 0, z: 90 }))}
            className="px-2 py-1 bg-white/10 text-white/70 rounded text-xs hover:bg-white/20 transition-colors"
          >
            90°
          </button>
          <button
            onClick={() => dispatch(setPinRotation({ x: 0, y: 0, z: 180 }))}
            className="px-2 py-1 bg-white/10 text-white/70 rounded text-xs hover:bg-white/20 transition-colors"
          >
            180°
          </button>
          <button
            onClick={() => dispatch(setPinRotation({ x: 0, y: 0, z: 270 }))}
            className="px-2 py-1 bg-white/10 text-white/70 rounded text-xs hover:bg-white/20 transition-colors"
          >
            270°
          </button>
        </div>
        
        <div className="text-xs text-white/40">
          Rotate the image clockwise/counterclockwise
        </div>
      </div>
    );
  }, [pinRotation, dispatch, setPinRotation]);

  // Scale control (same as 3D but with different description)
  const renderImageScaleControl = useCallback(() => {
    const handleScaleChange = (e) => {
      const value = parseFloat(e.target.value);
      const finalValue = isNaN(value) ? 1 : Math.max(0.1, Math.min(5, value));
      dispatch(setPinScale(finalValue));
    };

    return (
      <div className="space-y-3">
        <h3 className="text-white font-medium text-sm">Image Size</h3>
        
        <div>
          <label className="block text-white/70 text-xs mb-1">Scale ({pinScale.toFixed(1)}x)</label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={pinScale}
            onChange={handleScaleChange}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
        
        {/* Quick scale buttons */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => dispatch(setPinScale(0.5))}
            className="px-2 py-1 bg-white/10 text-white/70 rounded text-xs hover:bg-white/20 transition-colors"
          >
            0.5x
          </button>
          <button
            onClick={() => dispatch(setPinScale(1.0))}
            className="px-2 py-1 bg-white/10 text-white/70 rounded text-xs hover:bg-white/20 transition-colors"
          >
            1x
          </button>
          <button
            onClick={() => dispatch(setPinScale(2.0))}
            className="px-2 py-1 bg-white/10 text-white/70 rounded text-xs hover:bg-white/20 transition-colors"
          >
            2x
          </button>
          <button
            onClick={() => dispatch(setPinScale(3.0))}
            className="px-2 py-1 bg-white/10 text-white/70 rounded text-xs hover:bg-white/20 transition-colors"
          >
            3x
          </button>
        </div>
        
        <div className="text-xs text-white/40">
          Make the image smaller or larger
        </div>
      </div>
    );
  }, [pinScale, dispatch, setPinScale]);

  return (
    <>
      {renderImagePositionControls()}
      {renderImageRotationControls()}
      {renderImageScaleControl()}
      
      {/* Image-specific tips */}
      <div className="p-3 bg-black/10 rounded-lg border border-white/5">
        <h4 className="text-white/80 text-xs font-medium mb-2">
          Image Avatar Tips
        </h4>
        <ul className="text-white/60 text-xs space-y-1">
          <li>• Position: Move image around the screen</li>
          <li>• Rotation: Rotate image in 2D plane</li>
          <li>• Scale: Resize image (0.1x to 5x)</li>
          <li>• Drag image to move it around</li>
          <li>• Images work best at 1x-3x scale</li>
        </ul>
      </div>
    </>
  );
};

export default ImageAvatarSettings;
