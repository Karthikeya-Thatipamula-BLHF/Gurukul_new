import React, { useRef, useEffect, useState } from 'react';

/**
 * MobileEnhancedInput - Enhanced input component with mobile-specific optimizations
 * Automatically detects mobile devices and applies appropriate enhancements
 * Falls back to regular styling on desktop
 * 
 * Props:
 * - All standard input props
 * - icon: Icon component to display
 * - variant: 'glass' | 'chat' | 'form' | 'minimal'
 * - autoComplete: Enhanced autocomplete for mobile
 * - showValidation: Show validation states
 * - onMobileEnter: Callback for mobile enter key
 */
export default function MobileEnhancedInput({
  className = '',
  icon: Icon,
  variant = 'glass',
  type = 'text',
  placeholder = '',
  autoComplete,
  showValidation = false,
  onMobileEnter,
  ...props
}) {
  const inputRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle value changes
  useEffect(() => {
    if (props.value !== undefined) {
      setHasValue(!!props.value);
    }
  }, [props.value]);

  // Handle mobile-specific keyboard behavior
  const handleKeyDown = (e) => {
    if (props.onKeyDown) {
      props.onKeyDown(e);
    }

    if (isMobile && e.key === 'Enter' && !e.shiftKey && onMobileEnter) {
      e.preventDefault();
      onMobileEnter(e);
    }
  };

  // Handle focus events
  const handleFocus = (e) => {
    setIsFocused(true);
    if (props.onFocus) {
      props.onFocus(e);
    }

    // Mobile-specific focus behavior
    if (isMobile) {
      setTimeout(() => {
        e.target.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }, 300);
    }
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  const handleChange = (e) => {
    setHasValue(!!e.target.value);
    if (props.onChange) {
      props.onChange(e);
    }
  };

  // Get variant-specific styles
  const getVariantStyles = () => {
    const baseStyles = {
      width: '100%',
      fontFamily: 'Nunito, sans-serif',
      fontWeight: '500',
      color: '#ffffff',
      transition: 'all 0.3s ease',
      border: 'none',
      outline: 'none',
    };

    if (!isMobile) {
      // Desktop styles - keep existing behavior
      switch (variant) {
        case 'glass':
          return {
            ...baseStyles,
            height: '48px',
            padding: Icon ? '0 16px 0 40px' : '0 16px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          };
        case 'chat':
          return {
            ...baseStyles,
            minHeight: '46px',
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          };
        default:
          return baseStyles;
      }
    }

    // Mobile styles - enhanced
    const mobileStyles = {
      ...baseStyles,
      fontSize: '16px', // Prevent zoom on iOS
      minHeight: '48px',
      padding: Icon ? '12px 16px 12px 44px' : '12px 16px',
      borderRadius: '12px',
      background: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '2px solid rgba(255, 255, 255, 0.15)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(255, 215, 0, 0.05) inset',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent',
    };

    // Apply focus styles for mobile
    if (isFocused) {
      mobileStyles.background = 'rgba(255, 255, 255, 0.12)';
      mobileStyles.border = '2px solid rgba(255, 215, 0, 0.6)';
      mobileStyles.boxShadow = '0 6px 25px rgba(0, 0, 0, 0.15), 0 0 0 3px rgba(255, 215, 0, 0.15), 0 2px 8px rgba(255, 215, 0, 0.1) inset';
      mobileStyles.transform = 'translateY(-1px)';
    }

    return mobileStyles;
  };

  // Get container styles
  const getContainerStyles = () => {
    return {
      position: 'relative',
      width: '100%',
      marginBottom: isMobile ? '16px' : '12px',
    };
  };

  // Get icon styles
  const getIconStyles = () => {
    return {
      position: 'absolute',
      left: isMobile ? '14px' : '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: isFocused ? 'rgba(255, 215, 0, 0.8)' : 'rgba(255, 255, 255, 0.7)',
      transition: 'color 0.3s ease',
      zIndex: 1,
    };
  };

  // Get placeholder styles (for mobile)
  const placeholderStyles = isMobile ? {
    '::placeholder': {
      color: 'rgba(255, 255, 255, 0.6)',
      fontWeight: '400',
    }
  } : {};

  return (
    <div style={getContainerStyles()} className={`mobile-enhanced-input ${className}`}>
      {Icon && (
        <div style={getIconStyles()}>
          <Icon size={isMobile ? 20 : 18} />
        </div>
      )}
      
      <input
        ref={inputRef}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={getVariantStyles()}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...props}
      />

      {/* Mobile-specific enhancements */}
      {isMobile && (
        <style jsx>{`
          .mobile-enhanced-input input::placeholder {
            color: rgba(255, 255, 255, 0.6);
            font-weight: 400;
          }

          .mobile-enhanced-input input::-webkit-input-placeholder {
            color: rgba(255, 255, 255, 0.6);
            font-weight: 400;
          }

          .mobile-enhanced-input input::-moz-placeholder {
            color: rgba(255, 255, 255, 0.6);
            font-weight: 400;
            opacity: 1;
          }

          .mobile-enhanced-input input:-ms-input-placeholder {
            color: rgba(255, 255, 255, 0.6);
            font-weight: 400;
          }

          /* Enhanced focus ring for accessibility */
          .mobile-enhanced-input input:focus {
            outline: 3px solid rgba(255, 215, 0, 0.3);
            outline-offset: 2px;
          }

          /* High contrast mode support */
          @media (prefers-contrast: high) {
            .mobile-enhanced-input input {
              border-width: 3px !important;
              border-color: rgba(255, 255, 255, 0.4) !important;
            }
            
            .mobile-enhanced-input input:focus {
              border-color: rgba(255, 215, 0, 0.8) !important;
            }
          }

          /* Reduced motion support */
          @media (prefers-reduced-motion: reduce) {
            .mobile-enhanced-input input {
              transition: none !important;
              transform: none !important;
            }
          }
        `}</style>
      )}
    </div>
  );
}