import React, { useEffect, useRef } from 'react';

/**
 * MobileFormWrapper - Enhances forms and input areas specifically for mobile devices
 * Provides touch-friendly interactions, better keyboard handling, and mobile-optimized layouts
 * 
 * Props:
 * - children: Form content to be wrapped
 * - className: Additional CSS classes
 * - enhancedKeyboard: Enable enhanced mobile keyboard handling (default: true)
 * - touchOptimized: Enable touch-optimized interactions (default: true)
 * - autoFocus: Auto-focus first input on mobile (default: false)
 */
export default function MobileFormWrapper({
  children,
  className = '',
  enhancedKeyboard = true,
  touchOptimized = true,
  autoFocus = false,
  ...props
}) {
  const formRef = useRef(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    if (!isMobile || !formRef.current) return;

    const form = formRef.current;

    // Auto-focus first input on mobile if requested
    if (autoFocus) {
      const firstInput = form.querySelector('input, textarea, select');
      if (firstInput && !firstInput.disabled) {
        // Delay to ensure proper rendering
        setTimeout(() => {
          firstInput.focus();
        }, 300);
      }
    }

    // Enhanced keyboard handling for mobile
    if (enhancedKeyboard) {
      const handleInputFocus = (e) => {
        const input = e.target;
        
        // Scroll into view with proper offset for mobile keyboards
        setTimeout(() => {
          input.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }, 300);

        // Add focused state styling
        input.classList.add('mobile-input-focused');
      };

      const handleInputBlur = (e) => {
        const input = e.target;
        input.classList.remove('mobile-input-focused');
      };

      // Handle Enter key behavior
      const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          const inputs = Array.from(form.querySelectorAll('input:not([type="submit"]), textarea, select'));
          const currentIndex = inputs.indexOf(e.target);
          
          // If it's a textarea, allow Enter unless it's single-line
          if (e.target.tagName === 'TEXTAREA' && e.target.rows > 1) {
            return;
          }
          
          // Move to next input or submit form
          if (currentIndex < inputs.length - 1) {
            e.preventDefault();
            inputs[currentIndex + 1].focus();
          } else if (e.target.form) {
            // Try to find and click submit button
            const submitButton = e.target.form.querySelector('button[type="submit"], input[type="submit"]');
            if (submitButton && !submitButton.disabled) {
              e.preventDefault();
              submitButton.click();
            }
          }
        }
      };

      // Add event listeners to all inputs
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        input.addEventListener('focus', handleInputFocus);
        input.addEventListener('blur', handleInputBlur);
        input.addEventListener('keydown', handleKeyDown);
      });

      // Cleanup
      return () => {
        inputs.forEach(input => {
          input.removeEventListener('focus', handleInputFocus);
          input.removeEventListener('blur', handleInputBlur);
          input.removeEventListener('keydown', handleKeyDown);
        });
      };
    }
  }, [isMobile, enhancedKeyboard, autoFocus]);

  useEffect(() => {
    if (!isMobile || !touchOptimized || !formRef.current) return;

    const form = formRef.current;

    // Enhanced touch interactions
    const handleTouchStart = (e) => {
      const button = e.target.closest('button');
      if (button && !button.disabled) {
        button.classList.add('mobile-button-pressed');
      }
    };

    const handleTouchEnd = (e) => {
      const button = e.target.closest('button');
      if (button) {
        setTimeout(() => {
          button.classList.remove('mobile-button-pressed');
        }, 150);
      }
    };

    // Prevent double-tap zoom on buttons and inputs
    const handleDoubleTouch = (e) => {
      if (e.target.matches('button, input, textarea, select')) {
        e.preventDefault();
      }
    };

    form.addEventListener('touchstart', handleTouchStart, { passive: true });
    form.addEventListener('touchend', handleTouchEnd, { passive: true });
    form.addEventListener('dblclick', handleDoubleTouch);

    return () => {
      form.removeEventListener('touchstart', handleTouchStart);
      form.removeEventListener('touchend', handleTouchEnd);
      form.removeEventListener('dblclick', handleDoubleTouch);
    };
  }, [isMobile, touchOptimized]);

  // On desktop, return children without wrapper
  if (!isMobile) {
    return <>{children}</>;
  }

  // On mobile, return enhanced wrapper
  return (
    <div
      ref={formRef}
      className={`mobile-form-wrapper ${className}`}
      {...props}
    >
      {children}
      
      {/* Mobile-specific CSS */}
      <style jsx>{`
        .mobile-form-wrapper {
          position: relative;
          width: 100%;
        }

        .mobile-form-wrapper :global(.mobile-input-focused) {
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2),
                      0 0 0 4px rgba(255, 215, 0, 0.2),
                      0 3px 10px rgba(255, 215, 0, 0.15) inset !important;
          transform: translateY(-2px) !important;
          background: rgba(255, 255, 255, 0.15) !important;
        }

        .mobile-form-wrapper :global(.mobile-button-pressed) {
          transform: scale(0.95) translateY(1px) !important;
          box-shadow: 0 3px 12px rgba(255, 153, 51, 0.4),
                      0 1px 4px rgba(255, 215, 0, 0.2) inset !important;
        }

        /* Prevent zoom on double tap */
        .mobile-form-wrapper :global(input),
        .mobile-form-wrapper :global(textarea),
        .mobile-form-wrapper :global(select),
        .mobile-form-wrapper :global(button) {
          touch-action: manipulation;
          user-select: none;
          -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .mobile-form-wrapper :global(input),
        .mobile-form-wrapper :global(textarea) {
          user-select: text;
          -webkit-user-select: text;
        }

        /* Enhanced spacing for mobile */
        .mobile-form-wrapper :global(.form-group) {
          margin-bottom: 1.25rem;
        }

        .mobile-form-wrapper :global(.form-row) {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* Better button grouping on mobile */
        .mobile-form-wrapper :global(.button-group) {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }

        .mobile-form-wrapper :global(.button-group.horizontal) {
          flex-direction: row;
          gap: 0.5rem;
        }

        /* Loading states for mobile */
        .mobile-form-wrapper :global(.loading) {
          pointer-events: none;
          opacity: 0.7;
        }

        .mobile-form-wrapper :global(.loading::after) {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 20px;
          height: 20px;
          margin: -10px 0 0 -10px;
          border: 2px solid rgba(255, 215, 0, 0.3);
          border-top: 2px solid rgba(255, 215, 0, 0.8);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}