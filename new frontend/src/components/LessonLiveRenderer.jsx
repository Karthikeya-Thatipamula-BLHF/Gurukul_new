import React, { useState, useEffect, useRef } from 'react';
import { formatLessonContent } from '../utils/contentFormatter';
import '../styles/lessonRenderer.css';

/**
 * LessonLiveRenderer - Component for rendering lesson content line by line with typing effect
 * Similar to chatbot streaming but optimized for lesson content display
 */
export const LessonLiveRenderer = ({
  content = '',
  speed = 50, // milliseconds per character
  lineDelay = 300, // delay between lines in milliseconds
  onComplete = null,
  className = '',
  showCursor = true,
  autoStart = true
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const contentRef = useRef(null);

  // Split content into lines for progressive rendering
  const lines = content ? content.split('\n').filter(line => line.trim()) : [];

  // Smart auto-scroll: only scroll to bottom if user hasn't manually scrolled up
  useEffect(() => {
    if (contentRef.current && !userHasScrolled) {
      const element = contentRef.current;
      const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50; // 50px tolerance

      if (isAtBottom) {
        element.scrollTop = element.scrollHeight;
      }
    }
  }, [displayedContent, userHasScrolled]);

  // Track user scroll behavior
  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const handleScroll = () => {
      const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
      setUserHasScrolled(!isAtBottom);
    };

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, []);

  // Start rendering when content changes
  useEffect(() => {
    if (content && autoStart && !isRendering) {
      setDisplayedContent('');
      setCurrentLineIndex(0);
      setCurrentCharIndex(0);
      setIsComplete(false);
      setIsRendering(true);
    }
  }, [content, autoStart]);

  // Main rendering logic
  useEffect(() => {
    if (!isRendering || isComplete || lines.length === 0) return;

    const currentLine = lines[currentLineIndex];
    if (!currentLine) {
      // All lines processed
      setIsComplete(true);
      setIsRendering(false);
      if (onComplete) onComplete();
      return;
    }

    if (currentCharIndex < currentLine.length) {
      // Render character by character
      const timer = setTimeout(() => {
        setDisplayedContent(prev => {
          const newContent = prev + currentLine[currentCharIndex];
          return newContent;
        });
        setCurrentCharIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else {
      // Line complete, move to next line after delay
      const timer = setTimeout(() => {
        setDisplayedContent(prev => prev + '\n');
        setCurrentLineIndex(prev => prev + 1);
        setCurrentCharIndex(0);
      }, lineDelay);

      return () => clearTimeout(timer);
    }
  }, [currentLineIndex, currentCharIndex, lines, speed, lineDelay, isRendering, isComplete]);

  // Manual start function
  const startRendering = () => {
    if (!isRendering && !isComplete) {
      setIsRendering(true);
    }
  };

  // Reset function
  const resetRendering = () => {
    setDisplayedContent('');
    setCurrentLineIndex(0);
    setCurrentCharIndex(0);
    setIsComplete(false);
    setIsRendering(false);
  };

  // Skip to end function
  const skipToEnd = () => {
    setDisplayedContent(content);
    setIsComplete(true);
    setIsRendering(false);
    if (onComplete) onComplete();
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
      setUserHasScrolled(false);
    }
  };

  return (
    <div className={`lesson-live-renderer ${className} relative`}>
      <div
        ref={contentRef}
        className="lesson-content text-white/95 leading-relaxed text-lg w-full max-w-none overflow-hidden max-h-[70vh] overflow-y-auto custom-scrollbar"
        style={{
          scrollBehavior: 'smooth'
        }}
      >
        <div
          className="whitespace-pre-wrap font-sans prose prose-invert max-w-none w-full overflow-x-hidden break-words"
          dangerouslySetInnerHTML={{
            __html: formatLessonContent(displayedContent)
          }}
        />
        {showCursor && isRendering && !isComplete && (
          <span className="animate-pulse text-amber-400 ml-1 text-xl">▋</span>
        )}
      </div>

      {/* Scroll to bottom button - appears when user has scrolled up during rendering */}
      {userHasScrolled && isRendering && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 bg-amber-500/80 hover:bg-amber-500 text-white p-2 rounded-full shadow-lg transition-all duration-200 z-10 flex items-center justify-center"
          title="Scroll to bottom to see new content"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
      
      {/* Control buttons and speed indicator */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-2">
          {!autoStart && !isRendering && !isComplete && (
            <button
              onClick={startRendering}
              className="px-4 py-2 bg-amber-500/20 text-amber-300 rounded-lg hover:bg-amber-500/30 transition-colors"
            >
              Start Rendering
            </button>
          )}
          {isRendering && (
            <button
              onClick={skipToEnd}
              className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              Skip to End
            </button>
          )}
          {(isComplete || isRendering) && (
            <button
              onClick={resetRendering}
              className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {/* Rendering status */}
        {isRendering && (
          <div className="flex items-center gap-2 text-sm text-white/60">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <span>Live rendering...</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * LessonStreamRenderer - Component for handling streaming lesson content
 * Renders content as it arrives from the streaming API
 */
export const LessonStreamRenderer = ({
  streamingContent = '',
  isStreaming = false,
  speed = 30,
  className = '',
  onComplete = null
}) => {
  const [renderedContent, setRenderedContent] = useState('');
  const [lastProcessedLength, setLastProcessedLength] = useState(0);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const contentRef = useRef(null);

  // Smart auto-scroll: only scroll to bottom if user hasn't manually scrolled up
  useEffect(() => {
    if (contentRef.current && !userHasScrolled) {
      const element = contentRef.current;
      const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50; // 50px tolerance

      if (isAtBottom) {
        element.scrollTop = element.scrollHeight;
      }
    }
  }, [renderedContent, userHasScrolled]);

  // Track user scroll behavior
  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const handleScroll = () => {
      const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
      setUserHasScrolled(!isAtBottom);
    };

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, []);

  // Process new streaming content
  useEffect(() => {
    if (streamingContent.length > lastProcessedLength) {
      const newContent = streamingContent.slice(lastProcessedLength);
      
      // Add new content character by character with delay
      let charIndex = 0;
      const addChar = () => {
        if (charIndex < newContent.length) {
          setRenderedContent(prev => prev + newContent[charIndex]);
          charIndex++;
          setTimeout(addChar, speed);
        } else {
          setLastProcessedLength(streamingContent.length);
        }
      };
      
      addChar();
    }
  }, [streamingContent, lastProcessedLength, speed]);

  // Handle streaming completion
  useEffect(() => {
    if (!isStreaming && streamingContent && onComplete) {
      onComplete();
    }
  }, [isStreaming, streamingContent, onComplete]);

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
      setUserHasScrolled(false);
    }
  };

  return (
    <div className={`lesson-stream-renderer ${className} relative`}>
      <div
        ref={contentRef}
        className="lesson-content text-white/95 leading-relaxed text-lg w-full max-w-none overflow-hidden max-h-[70vh] overflow-y-auto custom-scrollbar"
        style={{
          scrollBehavior: 'smooth'
        }}
      >
        <div
          className="whitespace-pre-wrap font-sans prose prose-invert max-w-none w-full overflow-x-hidden break-words"
          dangerouslySetInnerHTML={{
            __html: formatLessonContent(renderedContent)
          }}
        />
        {isStreaming && (
          <span className="animate-pulse text-amber-400 ml-1 text-xl">▋</span>
        )}
      </div>

      {/* Scroll to bottom button - appears when user has scrolled up during streaming */}
      {userHasScrolled && isStreaming && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 bg-amber-500/80 hover:bg-amber-500 text-white p-2 rounded-full shadow-lg transition-all duration-200 z-10 flex items-center justify-center"
          title="Scroll to bottom to see new content"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default LessonLiveRenderer;
