/**
 * Comprehensive content formatting utility for cleaning and formatting lesson content
 * Removes markdown symbols, asterisks, and other unwanted formatting characters
 * Converts content to clean, properly formatted HTML
 */

/**
 * Clean and format lesson content by removing markdown symbols and formatting properly
 * @param {string|object} rawContent - Raw content from backend (may be string or object)
 * @returns {string} - Clean, formatted HTML content
 */
export const formatLessonContent = (rawContent) => {
  try {
    let content = rawContent;

    // Handle different content types
    if (!content) {
      return '<p class="text-white/90">No content available.</p>';
    }

    // If content is an object, try to extract text
    if (typeof content === "object") {
      if (content.text) {
        content = content.text;
      } else if (content.explanation) {
        content = content.explanation;
      } else {
        // Try to parse as JSON
        try {
          const parsed = JSON.parse(JSON.stringify(content));
          content =
            parsed.text || parsed.explanation || JSON.stringify(content);
        } catch (e) {
          content = JSON.stringify(content);
        }
      }
    }

    // Convert to string if it's not already
    content = String(content);

    // Step 1: Remove JSON formatting and code blocks
    content = content
      // Remove JSON structure wrappers
      .replace(/^```\s*\n?\{\s*\n?.*?"text":\s*"/s, "")
      .replace(/"\s*\}?\s*```?\s*$/s, "")
      .replace(/^.*?"text":\s*"/s, "")
      .replace(/"\s*,?\s*"[^"]*":\s*[^,}]*[,}].*$/s, "")
      // Remove markdown code blocks
      .replace(/```[\s\S]*?```/g, "")
      // Remove inline code
      .replace(/`([^`]+)`/g, "$1")
      // Clean up escaped characters
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");

    // Step 2: Preprocess to separate concatenated headings and fix word wrapping
    content = content
      // Fix concatenated headings with common patterns
      .replace(
        /([a-z])([A-Z][a-z]+\s+(?:Topics|Implications|Applications|Knowledge|Uses|Benefits|Advantages|Challenges|Solutions|Methods|Techniques|Approaches|Strategies|Engineering|Industry|Physics|Mechanics))/g,
        "$1\n\n$2"
      )
      // Handle specific concatenated patterns
      .replace(/([a-z])(Advanced\s+Topics)/g, "$1\n\n$2")
      .replace(/([a-z])(Future\s+Implications)/g, "$1\n\n$2")
      .replace(/([a-z])(Practical\s+Applications)/g, "$1\n\n$2")
      .replace(/([a-z])(How\s+This\s+Knowledge\s+is\s+Used)/g, "$1\n\n$2")
      // Fix common concatenations in technical content
      .replace(/(systems)([A-Z][a-z]+\s+Topics)/g, "$1\n\n$2")
      .replace(/(propulsion)([A-Z][a-z]+\s+Topics)/g, "$1\n\n$2")
      .replace(/(manufacturing)([A-Z][a-z]+\s+Topics)/g, "$1\n\n$2")
      // Handle numbered headings that get concatenated
      .replace(
        /(\d+\.\s+[A-Za-z\s]+)([A-Z][a-z]+\s+(?:Topics|Engineering|Industry|Physics|Mechanics))/g,
        "$1\n\n$2"
      )
      // Add line breaks before common heading patterns that get concatenated
      .replace(
        /([.!?]\s*)([A-Z][a-z]+\s+(?:Implications|Applications|Knowledge|Uses|Benefits|Advantages|Challenges|Solutions|Methods|Techniques|Approaches|Strategies))/g,
        "$1\n\n$2"
      );

    // Step 3: Clean up markdown symbols and unwanted characters
    content = content
      // Remove emojis and special symbols commonly used in headers
      .replace(/[🎯📚📝🕉️💡🔍✨🌟⭐🎓📖🎨🔥💫🌈🎪🎭🎨🎯🌐]/g, "")
      // Remove multiple asterisks (but preserve single ones for now)
      .replace(/\*{3,}/g, "")
      // Remove multiple underscores
      .replace(/_{3,}/g, "")
      // Clean up extra whitespace around asterisks
      .replace(/\s*\*+\s*(?=\*)/g, "")
      // Remove standalone asterisks on their own lines
      .replace(/^\s*\*+\s*$/gm, "")
      // Standardize bullet points
      .replace(/^\s*[•·▪▫‣⁃]\s*/gm, "• ");

    // Step 4: Format main section headings (without markdown) with proper word wrapping
    content = content.replace(
      /^([A-Z][A-Za-z\s]+(?:Field|Background|Development|Terminology|Definitions|History|Applications|Properties|Characteristics|Electric|Conductor|Insulator|Dielectric|Implications|Knowledge|Uses|Benefits|Advantages|Challenges|Solutions|Methods|Techniques|Approaches|Strategies|Topics|Engineering|Industry|Physics|Mechanics)):?\s*$/gm,
      '<h4 class="text-amber-300 font-bold text-lg mb-3 mt-6 break-words">$1</h4>'
    );

    // Step 4a: Format specific heading patterns with word wrapping
    content = content.replace(
      /^(Advanced\s+Topics|Future\s+Implications|Practical\s+Applications|How\s+This\s+Knowledge\s+is\s+Used|How\s+This\s+Knowledge):?\s*$/gm,
      '<h4 class="text-amber-300 font-bold text-lg mb-3 mt-6 break-words">$1</h4>'
    );

    // Step 4b: Format other potential headings (standalone capitalized lines) with word wrapping
    content = content.replace(
      /^([A-Z][A-Za-z\s]{8,}):?\s*$/gm,
      '<h4 class="text-amber-300 font-bold text-lg mb-3 mt-6 break-words">$1</h4>'
    );

    // Step 3b: Format markdown headers (### format)
    content = content
      // Convert ### headings to h3
      .replace(
        /^###\s+(.+)$/gm,
        '<h3 class="text-amber-300 font-bold text-xl mb-4 mt-6 break-words">$1</h3>'
      )
      // Convert ## headings to h2
      .replace(
        /^##\s+(.+)$/gm,
        '<h2 class="text-amber-300 font-bold text-2xl mb-4 mt-8 break-words">$1</h2>'
      )
      // Convert # headings to h1
      .replace(
        /^#\s+(.+)$/gm,
        '<h1 class="text-amber-300 font-bold text-3xl mb-6 mt-8 break-words">$1</h1>'
      );

    // Step 3c: Format headers with markdown (simple styling)
    content = content.replace(
      /\*\*([^*\n]+)\*\*/g,
      '<h4 class="text-xl font-bold text-amber-300 mt-6 mb-4 break-words">$1</h4>'
    );

    // Step 3d: Format numbered headings (section headers) with proper word wrapping
    content = content.replace(
      /^(\d+\.\s+[A-Z][A-Za-z\s]+(?:Industry|Engineering|Physics|Mechanics|Applications|Topics|Field|Science|Technology|Systems|Methods|Techniques|Approaches|Strategies)):?\s*$/gm,
      '<h5 class="text-yellow-400 font-semibold text-base mb-2 mt-4 break-words">$1</h5>'
    );

    // Step 4: Format numbered points with colons (inline format)
    content = content.replace(
      /(\d+)\.\s*([^:\n]+):\s*/g,
      '<div class="mb-4">' +
        '<span class="text-amber-400 font-bold">$1. </span>' +
        '<span class="text-amber-200 font-semibold">$2: </span>' +
        '<span class="text-white/90">'
    );

    // Step 5: Format simple numbered points without colons (basic text)
    content = content.replace(
      /(\d+)\.\s*([^\n:]+)(?!\s*:)/g,
      '<div class="mb-3">' +
        '<span class="text-amber-400 font-bold">$1. </span>' +
        '<span class="text-white/95">$2</span>' +
        "</div>"
    );

    // Step 6: Close numbered point divs (inline format)
    content = content.replace(
      /(<span class="text-white\/90">.*?)(?=<div class="mb-|<h4|$)/gs,
      "$1</span></div>"
    );

    // Step 7: Format bullet points (basic text)
    content = content.replace(
      /^\s*•\s*([^\n]+)/gm,
      '<div class="mb-2 ml-6">' +
        '<span class="text-amber-400">• </span>' +
        '<span class="text-white/90">$1</span>' +
        "</div>"
    );

    // Step 8: Handle standalone colons and fix orphaned content
    content = content.replace(/^\s*:\s*$/gm, ""); // Remove standalone colons
    content = content.replace(/:\s*\n\s*([A-Z])/g, ": $1"); // Fix orphaned colons
    content = content.replace(/(\d+\.\s*[^:\n]+):\s*\n\s*([A-Z])/g, "$1: $2"); // Fix numbered items with split descriptions

    // Step 9: Fix sentence spacing and formatting issues
    content = content
      // Ensure proper spacing after periods, colons, and other punctuation
      .replace(/\.([A-Z])/g, ". $1") // Add space after period before capital letter
      .replace(/:([A-Z])/g, ": $1") // Add space after colon before capital letter
      .replace(/;([A-Z])/g, "; $1") // Add space after semicolon before capital letter
      // Fix common concatenation issues
      .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space between lowercase and uppercase letters
      .replace(/([.!?])([A-Z])/g, "$1 $2") // Ensure space after sentence endings
      // Fix specific terminology spacing issues
      .replace(/other\.Key/g, "other. Key")
      .replace(/rest Electric/g, "rest. Electric")
      .replace(/negative Electric/g, "negative. Electric")
      .replace(/force Potential/g, "force. Potential")
      .replace(/another([A-Z])/g, "another. $1")
      // Remove multiple consecutive line breaks
      .replace(/\n{3,}/g, "\n\n")
      // Remove trailing whitespace
      .replace(/[ \t]+$/gm, "")
      // Remove leading whitespace from lines (except for indented content)
      .replace(/^\s+/gm, "");

    // Step 9: Format paragraphs with better spacing
    content = content
      .split("\n\n")
      .map((paragraph) => {
        const trimmed = paragraph.trim();
        // Skip empty paragraphs and already formatted content
        if (
          !trimmed ||
          trimmed.includes("<div") ||
          trimmed.includes("<h4") ||
          trimmed.includes("<p")
        ) {
          return trimmed;
        }
        // Format as paragraph if it's plain text - Enhanced with better spacing
        return `<p class="mb-8 text-white/95 leading-relaxed text-lg font-medium bg-gradient-to-r from-white/2 to-transparent rounded-lg p-5 hover:bg-white/5 transition-all duration-300">${trimmed}</p>`;
      })
      .filter((paragraph) => paragraph.trim()) // Remove empty paragraphs
      .join("\n\n");

    // Step 10: Handle remaining single line breaks (but preserve HTML structure)
    content = content.replace(/\n(?!<|$)/g, "<br/>");

    // Step 11: Final cleanup - remove any remaining unwanted symbols
    content = content
      // Remove any remaining standalone asterisks
      .replace(/\*+/g, "")
      // Remove multiple underscores
      .replace(/_{2,}/g, "")
      // Replace multiple spaces with single space (but preserve intentional spacing)
      .replace(/\s{3,}/g, " ")
      // Add line breaks between divs for better readability
      .replace(/(<\/div>)\s*(<div)/g, "$1\n$2")
      // Add spacing after headers
      .replace(/(<\/h4>)\s*(<[^h])/g, "$1\n\n$2")
      // Clean up any remaining markdown-style formatting
      .replace(/^\s*-{3,}\s*$/gm, "") // Remove horizontal rules
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Convert markdown links to plain text
      // Final sentence spacing fix
      .replace(/([.!?])\s*([A-Z])/g, "$1 $2"); // Ensure single space after sentence endings

    // Wrap in responsive container to prevent horizontal scrolling
    content = `<div class="lesson-content-wrapper w-full max-w-none overflow-hidden break-words word-wrap-break-word">${content}</div>`;

    return content;
  } catch (error) {
    console.error("Error formatting lesson content:", error);
    return `<p class="text-white/90">${String(rawContent)}</p>`;
  }
};

/**
 * Clean content for video generation (removes all HTML and formatting)
 * @param {string} content - HTML formatted content
 * @returns {string} - Plain text suitable for video generation
 */
export const cleanContentForVideo = (content) => {
  if (!content) return "";

  let cleaned = content;

  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, " ");

  // Remove JSON formatting symbols
  cleaned = cleaned.replace(/[{}[\]"`,]/g, " ");

  // Remove markdown symbols
  cleaned = cleaned.replace(/[*#_`]/g, " ");

  // Remove extra whitespace and normalize
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // Remove common technical terms that shouldn't be in video narrative
  cleaned = cleaned.replace(
    /\b(json|html|markdown|code|syntax|format|structure)\b/gi,
    ""
  );

  return cleaned;
};

/**
 * Extract plain text from formatted content for TTS
 * @param {string} content - HTML formatted content
 * @returns {string} - Plain text suitable for text-to-speech
 */
export const extractTextForTTS = (content) => {
  if (!content) return "";

  let text = content;

  // Remove HTML tags but preserve spacing
  text = text.replace(/<[^>]*>/g, " ");

  // Convert common HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Clean up extra whitespace
  text = text.replace(/\s+/g, " ").trim();

  // Add natural pauses for better TTS
  text = text
    .replace(/\.\s+/g, ". ")
    .replace(/:\s+/g, ": ")
    .replace(/;\s+/g, "; ")
    .replace(/,\s+/g, ", ");

  return text;
};

/**
 * Format content specifically for display in the lesson viewer
 * @param {string|object} rawContent - Raw content from backend
 * @returns {string} - Formatted HTML content optimized for lesson display
 */
export const formatForLessonDisplay = (rawContent) => {
  const formatted = formatLessonContent(rawContent);

  // Add additional styling for lesson display
  return `<div class="lesson-content space-y-4">${formatted}</div>`;
};

export default {
  formatLessonContent,
  cleanContentForVideo,
  extractTextForTTS,
  formatForLessonDisplay,
};
