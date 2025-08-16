import React, { useState, useEffect } from "react";
import GlassContainer from "../components/GlassContainer";
import GlassInput from "../components/GlassInput";
import GlassButton from "../components/GlassButton";
import { LessonLiveRenderer, LessonStreamRenderer } from "../components/LessonLiveRenderer";
import { useJupiterTTS } from "../hooks/useTTS";

import {
  useGenerateEnhancedLessonMutation,
  useGetUserProgressQuery,
  useGetUserAnalyticsQuery,
  useTriggerInterventionMutation,
  useGetIntegrationStatusQuery,
  formatEnhancedLessonData,
  formatUserProgressData
} from "../api/orchestrationApiSlice";
import { Book, BookOpen, BarChart3 } from "lucide-react";
import { cleanContentForVideo } from "../utils/contentFormatter";
import { useSelector } from "react-redux";
import { selectUserId } from "../store/authSlice";
import { toast } from "react-hot-toast";
import { API_BASE_URL, CHAT_API_BASE_URL } from "../config";
import { useVideo } from "../context/VideoContext";
import UserProgressDashboard from "../components/UserProgressDashboard";

export default function Subjects() {
  // Get user ID first (needed for hooks)
  const userId = useSelector(selectUserId) || "guest-user";



  // Orchestration API hooks
  const [
    generateEnhancedLesson,
    { data: enhancedLessonData, isLoading: isLoadingEnhanced, isError: isErrorEnhanced },
  ] = useGenerateEnhancedLessonMutation();

  const [
    triggerIntervention,
    { isLoading: isTriggeringIntervention },
  ] = useTriggerInterventionMutation();

  // Get integration status to check if orchestration is available
  const { data: integrationStatus, isLoading: isLoadingIntegration } = useGetIntegrationStatusQuery();

  // Get user progress if orchestration is available
  const { data: userProgress, isLoading: isLoadingProgress } = useGetUserProgressQuery(userId, {
    skip: !integrationStatus?.integration_status?.overall_valid || !userId || userId === "guest-user"
  });

  // Get user analytics if orchestration is available
  const { data: userAnalytics, isLoading: isLoadingAnalytics } = useGetUserAnalyticsQuery(userId, {
    skip: !integrationStatus?.integration_status?.overall_valid || !userId || userId === "guest-user"
  });

  // Video context
  const { generatedVideo, showVideoInSidebar, showVideo, hideVideo } = useVideo();

  // Component state
  const [selectedSubject, setSelectedSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [lessonData, setLessonData] = useState(null);
  const [includeWikipedia, setIncludeWikipedia] = useState(true);
  const [useKnowledgeStore, setUseKnowledgeStore] = useState(true);
  const [selectedVideoStyle, setSelectedVideoStyle] = useState('realistic'); // Video style selection

  // Orchestration-specific state
  const [useOrchestration, setUseOrchestration] = useState(true);
  const [showProgressDashboard, setShowProgressDashboard] = useState(false);
  const [lastQuizScore, setLastQuizScore] = useState(null);
  const [showInterventionPanel, setShowInterventionPanel] = useState(false);

  // Edge case handling states
  const [retryCount, setRetryCount] = useState(0);
  const [extendedWaitMode, setExtendedWaitMode] = useState(false);
  const [fallbackContentAvailable, setFallbackContentAvailable] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [lastError, setLastError] = useState(null);
  const maxRetries = 3;
  const extendedWaitThreshold = 300; // 5 minutes

  // TTS integration for Jupiter model responses
  const { handleJupiterResponse, serviceHealthy, isPlaying, stopTTS } = useJupiterTTS({
    onPlayStart: (text) => {
      console.log("🔊 Jupiter TTS: Started playing lesson content");
    },
    onPlayEnd: (text) => {
      console.log("🔊 Jupiter TTS: Finished playing lesson content");
    },
    onError: (error) => {
      console.warn("🔊 Jupiter TTS: Auto-play failed:", error.message);
    }
  });

  // Use the imported cleanContentForVideo utility for cleaning content

  // Helper function to transform lesson data into video format
  const transformLessonToVideoFormat = (lessonData, subject, topic) => {
    const rawExplanation = lessonData.explanation || lessonData.text || "";

    // Clean the content first using the imported utility
    const cleanedContent = cleanContentForVideo(rawExplanation);

    // Create a narrative story from the lesson content
    const narrativeStory = createNarrativeStory(cleanedContent, subject, topic);

    // Split narrative into meaningful sentences for scenes
    const sentences = narrativeStory.split(/[.!?]+/).filter(sentence =>
      sentence.trim().length > 10 && // Minimum meaningful length
      !sentence.includes('```') && // No code blocks
      !sentence.includes('json') && // No technical references
      !sentence.includes('html') // No HTML references
    );

    // Create scenes from cleaned sentences
    const scenes = sentences.map((sentence) => ({
      text: sentence.trim(),
      duration: Math.max(5.0, Math.min(8.0, sentence.trim().length * 0.08))
    }));

    // Create visual prompts for each scene (clean narrative descriptions)
    const prompts = sentences.map((sentence) => {
      const cleanPrompt = sentence.trim();
      const contextualPrompt = `${cleanPrompt}, spiritual journey, educational content, meditation theme`;
      return contextualPrompt;
    });

    // Calculate total duration
    const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);

    return {
      title: `${subject}: ${topic}`,
      level: "Advanced",
      duration: `${Math.round(totalDuration)}-${Math.round(totalDuration + 30)} seconds`,
      tts_enabled: true,
      scenes: scenes,
      prompts: prompts,
      text: narrativeStory, // Send the clean narrative story
      metadata: {
        theme: "spiritual journey and meditation",
        setting: "educational content",
        character: "spiritual seeker",
        lesson: "meditation and wisdom",
        mood: "profound and transformative",
        visual_style: "cinematic spiritual journey",
        duration_target: `${Math.round(totalDuration)} seconds`,
        created: new Date().toISOString().split('T')[0],
        story_type: "educational_lesson",
        production_generated: true
      },
      tts: true
    };
  };

  // Helper function to create a narrative story from lesson content
  const createNarrativeStory = (cleanedContent, subject, topic) => {
    // If content is too technical or contains formatting, create a simple narrative
    if (cleanedContent.length < 50 || cleanedContent.includes('quiz') || cleanedContent.includes('question')) {
      // Create a basic narrative based on subject and topic
      return createBasicNarrative(subject, topic);
    }

    // Extract key concepts and create a flowing narrative
    const sentences = cleanedContent.split(/[.!?]+/).filter(s => s.trim().length > 10);

    // Take the most meaningful sentences and create a story flow
    const meaningfulSentences = sentences
      .filter(s => !s.includes('*') && !s.includes('```') && s.length > 20)
      .slice(0, 8); // Limit to 8 key sentences for video

    if (meaningfulSentences.length === 0) {
      return createBasicNarrative(subject, topic);
    }

    // Join sentences to create a flowing narrative
    return meaningfulSentences.join('. ') + '.';
  };

  // Helper function to create a basic narrative when content is too technical
  const createBasicNarrative = (subject, topic) => {
    const narratives = {
      history: `In the ancient times, great stories unfolded that shaped our world. The tale of ${topic} in ${subject} reveals profound wisdom and timeless lessons. Through the mists of time, we discover remarkable events and extraordinary people. Their legacy continues to inspire and guide us today. These stories teach us about courage, wisdom, and the human spirit. Each chapter reveals new insights about our shared heritage. The lessons from the past illuminate our path forward. Understanding these stories helps us grow and learn.`,

      mathematics: `In the realm of numbers and patterns, ${topic} reveals the hidden beauty of ${subject}. Mathematical concepts dance together in perfect harmony. Each formula tells a story of logical thinking and problem-solving. Through careful observation, we discover elegant solutions. The world of mathematics opens doors to understanding. Every equation is a key to unlock new knowledge. These concepts help us make sense of the world around us. Mathematics is the language of the universe.`,

      science: `In the fascinating world of science, ${topic} unveils the mysteries of ${subject}. Natural phenomena reveal their secrets through careful study. Scientists explore and discover amazing truths about our universe. Each experiment brings new understanding and wonder. The laws of nature guide us toward greater knowledge. Through observation and inquiry, we learn about the world. Science helps us understand how things work. These discoveries improve our lives and expand our minds.`,

      default: `In the journey of learning, ${topic} opens new pathways of understanding in ${subject}. Knowledge flows like a river, carrying wisdom from one generation to the next. Each lesson builds upon previous discoveries and insights. Through study and reflection, we grow in wisdom and understanding. The pursuit of knowledge enriches our minds and souls. Every concept learned becomes a stepping stone to greater understanding. Education illuminates the path to personal growth and enlightenment. Learning is a lifelong adventure that never ends.`
    };

    return narratives[subject.toLowerCase()] || narratives.default;
  };

  // Helper function to get style modifiers based on selected style
  const getStyleModifiers = (style) => {
    const styleModifiers = {
      realistic: {
        visual_style: "photorealistic, high quality, detailed, natural lighting",
        negative_prompt: "cartoon, anime, illustration, painting, drawing, art, sketch"
      },
      artistic: {
        visual_style: "artistic, painterly, beautiful composition, creative lighting, stylized",
        negative_prompt: "photorealistic, photograph, realistic, plain, boring"
      },
      anime: {
        visual_style: "anime style, manga, Japanese animation, vibrant colors, expressive",
        negative_prompt: "photorealistic, photograph, realistic, western animation"
      }
    };

    return styleModifiers[style] || styleModifiers.realistic;
  };

  // Handler for triggering interventions
  const handleTriggerIntervention = async () => {
    if (!userId || userId === "guest-user") {
      toast.error("Please log in to access personalized interventions.");
      return;
    }

    try {
      const result = await triggerIntervention({
        user_id: userId,
        quiz_score: lastQuizScore
      }).unwrap();

      if (result.interventions && result.interventions.length > 0) {
        toast.success(
          `✅ ${result.interventions.length} intervention(s) triggered successfully!`,
          {
            duration: 4000,
            style: {
              background: 'linear-gradient(135deg, rgba(15, 15, 25, 0.95), rgba(25, 25, 35, 0.95))',
              color: '#fff',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '12px',
            },
          }
        );
        setShowInterventionPanel(true);
      } else {
        toast.info("No interventions needed at this time. Keep up the good work!");
      }
    } catch (error) {
      console.error("Failed to trigger intervention:", error);
      toast.error("Failed to trigger intervention. Please try again.");
    }
  };

  // Cleanup blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (generatedVideo?.url) {
        URL.revokeObjectURL(generatedVideo.url);
      }
    };
  }, [generatedVideo]);

  // Computed values for loading and error states
  const isLoadingData = isSubmitting;
  const isErrorData = false;
  const subjectData = lessonData;

  // Reset results when subject or topic changes
  useEffect(() => {
    setShowResults(false);
    setLessonData(null);
  }, [selectedSubject, topic]);

  // Ensure isSubmitting is properly reset when API request completes
  useEffect(() => {
    if (!isLoadingData && isSubmitting) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsSubmitting(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoadingData, isSubmitting]);

  // Helper function to check if both fields are valid (non-empty after trimming)
  const isFormValid = () => {
    return selectedSubject.trim().length > 0 && topic.trim().length > 0;
  };

  // Helper function to determine if button should be disabled
  const isButtonDisabled = () => {
    return isSubmitting || isLoadingData;
  };

  // Helper function to determine button visual state
  const getButtonVisualState = () => {
    if (isButtonDisabled()) {
      return "disabled"; // Fully disabled during submission/loading
    }
    if (!isFormValid()) {
      return "invalid"; // Visually dimmed but clickable when form is invalid
    }
    return "valid"; // Normal state when form is valid and not submitting
  };

  // Helper function to reset form and return to search
  const handleNewSearch = () => {
    setShowResults(false);
    setSelectedSubject("");
    setTopic("");
    setLessonData(null);
    setIncludeWikipedia(true);
    setUseKnowledgeStore(true);
    setRetryCount(0);
    setExtendedWaitMode(false);
    setFallbackContentAvailable(false);
    setIsOfflineMode(false);
    setLastError(null);
    hideVideo(); // Clear any generated video and hide from sidebar
  };

  // Retry logic with exponential backoff for lesson generation
  const retryLessonGeneration = async (apiCall, maxRetries = 3, baseDelay = 2000) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        setLastError(error.message);

        if (attempt === maxRetries - 1) {
          throw error; // Last attempt failed
        }

        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        console.log(`🔄 Lesson generation retry attempt ${attempt + 1}/${maxRetries} in ${delay}ms`);

        toast.loading(
          `🔄 Retrying lesson generation... (Attempt ${attempt + 2}/${maxRetries})\n⏱️ Please wait ${delay/1000} seconds`,
          {
            id: "lesson-retry-notification",
            duration: delay,
            style: {
              background: 'linear-gradient(135deg, rgba(15, 15, 25, 0.95), rgba(25, 25, 35, 0.95))',
              color: '#fff',
              border: '1px solid rgba(255, 153, 51, 0.3)',
              borderRadius: '12px',
              fontSize: '14px',
              maxWidth: '450px',
              boxShadow: '0 0 20px rgba(255, 153, 51, 0.1)',
            },
          }
        );

        // After the retry delay, update the main toast to continue showing progress
        setTimeout(() => {
          toast.loading(
            "📚 Continuing lesson generation... Please remain patient.\n🗄️ Knowledge Store processing may take 5-10 minutes.",
            {
              id: "lesson-generation",
              duration: Infinity,
              style: {
                background: 'linear-gradient(135deg, rgba(15, 15, 25, 0.95), rgba(25, 25, 35, 0.95))',
                color: '#fff',
                border: '1px solid rgba(255, 153, 51, 0.3)',
                borderRadius: '12px',
                fontSize: '14px',
                maxWidth: '450px',
                fontWeight: '500',
                boxShadow: '0 0 20px rgba(255, 153, 51, 0.1)',
              },
            }
          );
        }, delay);

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  // Check for cached lesson content
  const getCachedLessonContent = (subject, topic) => {
    try {
      const cacheKey = `lesson_${subject.toLowerCase()}_${topic.toLowerCase()}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const cacheAge = Date.now() - parsedCache.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (cacheAge < maxAge) {
          return parsedCache.data;
        }
      }
    } catch (error) {
      console.error("Error reading cached lesson content:", error);
    }
    return null;
  };

  // Save lesson content to cache
  const cacheLessonContent = (subject, topic, data) => {
    try {
      const cacheKey = `lesson_${subject.toLowerCase()}_${topic.toLowerCase()}`;
      const cacheData = {
        data: data,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Error caching lesson content:", error);
    }
  };



  // Import the comprehensive content formatter from utils
  // This function is now handled by the imported formatLessonContent utility

  // Send lesson content to generate-video endpoint via proxy
  const sendToVisionAPI = async (subject, topic, lessonData) => {
    try {
      console.log("🎬 Sending lesson content to AnimateDiff video generation API...");

      if (!lessonData?.explanation) {
        console.log("⚠️ No explanation available to send to video generation API");
        return;
      }

      // Transform lesson data into the required format with scenes and prompts
      const transformedContent = transformLessonToVideoFormat(lessonData, subject, topic);

      // Add video style to the content
      const styledContent = {
        ...transformedContent,
        video_style: selectedVideoStyle,
        style_modifiers: getStyleModifiers(selectedVideoStyle)
      };

      console.log("🎬 Transformed content for video generation:", styledContent);

      // Create the final payload for the API
      const payload = styledContent;

      console.log("🎬 AnimateDiff API Payload:", payload);
      if (import.meta.env.VITE_DEBUG_PROXY === 'true') {
        console.log("🎬 Target endpoint:", import.meta.env.VITE_VISION_API_URL || 'http://localhost:8501/generate-video');
        console.log("🎬 Ngrok endpoint:", import.meta.env.VITE_VISION_NGROK_URL || '');
      }

      let response;
      let usingProxy = false;

      // Standard headers with API key for all requests
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': 'shashank_ka_vision786'
      };

      try {
        // First attempt: Use flexible backend proxy (most reliable - avoids CORS)
        console.log("🎬 Attempting flexible backend proxy request via localhost:8001/proxy/vision-flexible...");
        const flexibleProxyResponse = await fetch(`${CHAT_API_BASE_URL}/proxy/vision-flexible`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          mode: 'cors',
          credentials: 'same-origin',
          body: JSON.stringify(payload)
        });

        // Check if flexible proxy request was successful
        if (flexibleProxyResponse.ok) {
          response = flexibleProxyResponse;
          usingProxy = true;
          console.log("🎬 Flexible backend proxy request successful");
        } else {
          console.log(`🎬 Flexible backend proxy failed with status ${flexibleProxyResponse.status}: ${flexibleProxyResponse.statusText}`);
          throw new Error(`Flexible backend proxy returned ${flexibleProxyResponse.status}`);
        }
      } catch (flexibleProxyError) {
        console.log("🎬 Flexible backend proxy failed, trying standard backend proxy...");
        console.log("🎬 Flexible proxy error:", flexibleProxyError.message);

        try {
          // Second attempt: Use standard backend proxy
          console.log("🎬 Attempting standard backend proxy request via localhost:8001/proxy/vision...");
          const backendProxyResponse = await fetch(`${CHAT_API_BASE_URL}/proxy/vision`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          mode: 'cors',
          credentials: 'same-origin',
          body: JSON.stringify({
            ...payload,
            target_endpoint: (import.meta.env.VITE_VISION_API_URL || "http://localhost:8501/generate-video")
          })
        });

        // Check if backend proxy request was successful
        if (backendProxyResponse.ok) {
          response = backendProxyResponse;
          usingProxy = true;
          console.log("🎬 Backend proxy request successful");
        } else {
          console.log(`🎬 Backend proxy failed with status ${backendProxyResponse.status}: ${backendProxyResponse.statusText}`);
          throw new Error(`Backend proxy returned ${backendProxyResponse.status}`);
        }
        } catch (backendProxyError) {
          console.log("🎬 Backend proxy failed, trying test proxy...");
          console.log("🎬 Backend proxy error:", backendProxyError.message);

          try {
            // Third attempt: Use backend test proxy
          console.log("🎬 Attempting backend test proxy via localhost:8001/test-generate-video...");
          const testProxyResponse = await fetch(`${CHAT_API_BASE_URL}/test-generate-video`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            mode: 'cors',
            credentials: 'same-origin',
            body: JSON.stringify(payload)
          });

          // Check if test proxy request was successful
          if (testProxyResponse.ok) {
            response = testProxyResponse;
            usingProxy = true;
            console.log("🎬 Backend test proxy request successful");
          } else {
            console.log(`🎬 Backend test proxy failed with status ${testProxyResponse.status}: ${testProxyResponse.statusText}`);
            throw new Error(`Backend test proxy returned ${testProxyResponse.status}`);
          }
        } catch (testProxyError) {
          console.log("🎬 Backend test proxy failed, trying ngrok endpoint...");
          console.log("🎬 Test proxy error:", testProxyError.message);

          try {
            // Third attempt: Use ngrok public endpoint with API key
            console.log("🎬 Attempting ngrok endpoint with API key...");
            const ngrokUrl = import.meta.env.VITE_VISION_NGROK_URL;
            const ngrokResponse = await fetch(`${ngrokUrl}/generate-video`, {
              method: 'POST',
              headers: {
                ...headers,
                'ngrok-skip-browser-warning': 'true' // Skip ngrok browser warning
              },
              mode: 'cors',
              credentials: 'omit',
              body: JSON.stringify(payload)
            });

            // Check if ngrok request was successful
            if (ngrokResponse.ok) {
              response = ngrokResponse;
              usingProxy = false;
              console.log("🎬 Ngrok endpoint request successful");
            } else {
              console.log(`🎬 Ngrok endpoint failed with status ${ngrokResponse.status}: ${ngrokResponse.statusText}`);
              throw new Error(`Ngrok endpoint returned ${ngrokResponse.status}`);
            }
          } catch (ngrokError) {
            console.log("🎬 Ngrok failed, trying Vite proxy as final fallback...");
            console.log("🎬 Ngrok error:", ngrokError.message);

            try {
              // Fourth attempt: Use Vite proxy (development only)
              console.log("🎬 Attempting Vite proxy via /api/vision...");
              const viteProxyResponse = await fetch("/api/vision", {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                },
                mode: 'cors',
                credentials: 'same-origin',
                body: JSON.stringify(payload)
              });

              // Check if Vite proxy request was successful
              if (viteProxyResponse.ok) {
                response = viteProxyResponse;
                usingProxy = true;
                console.log("🎬 Vite proxy request successful");
              } else {
                console.log(`🎬 Vite proxy failed with status ${viteProxyResponse.status}: ${viteProxyResponse.statusText}`);
                throw new Error(`Vite proxy returned ${viteProxyResponse.status}`);
              }
            } catch (viteProxyError) {
              console.log("🎬 All connection methods failed");
              console.log("🎬 Vite proxy error:", viteProxyError.message);
              throw new Error("All connection methods failed - backend proxy, test proxy, ngrok, and Vite proxy all failed");
            }
          }
        }
      }
    }

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `AnimateDiff API request failed: ${response.status} ${response.statusText}`;
        const methodUsedForError = usingProxy ? "proxy" : "direct request";

        try {
          const errorData = await response.json();
          if (errorData.error || errorData.message) {
            errorMessage = errorData.error || errorData.message;
          }
        } catch (e) {
          // If we can't parse error response, use the default message
        }

        console.log(`🎬 Final ${methodUsedForError} failed with status ${response.status}`);
        throw new Error(`${errorMessage} (via ${methodUsedForError})`);
      }

      // Handle response from AnimateDiff API
      const contentType = response.headers.get('content-type');
      let result;

      if (contentType && contentType.includes('video/')) {
        // Response is a video file (direct method)
        const videoBlob = await response.blob();
        console.log("🎥 Video blob created:", {
          size: videoBlob.size,
          type: videoBlob.type,
          isValid: videoBlob.size > 0
        });

        const videoUrl = URL.createObjectURL(videoBlob);
        console.log("🎥 Blob URL created:", videoUrl);

        result = {
          success: true,
          video_url: videoUrl,
          content_type: contentType,
          size: videoBlob.size,
          method: "direct"
        };
        console.log("🎬 Video generated successfully (direct):", result);
      } else {
        // Response is JSON (new transfer method)
        result = await response.json();
        console.log("🎬 AnimateDiff API Response:", result);

        // If video was transferred to main system, get it from there
        if (result.success && result.video_id && result.access_url) {
          console.log("🎬 Video transferred to main system, fetching from:", result.access_url);

          try {
            const videoResponse = await fetch(`${API_BASE_URL}${result.access_url}`, {
              method: 'GET',
              headers: {
                'Accept': 'video/mp4',
              },
              mode: 'cors',
              credentials: 'same-origin'
            });

            if (videoResponse.ok) {
              const videoBlob = await videoResponse.blob();
              const videoUrl = URL.createObjectURL(videoBlob);
              result = {
                ...result,
                video_url: videoUrl,
                content_type: videoResponse.headers.get('content-type') || 'video/mp4',
                size: videoBlob.size,
                method: "transferred"
              };
              console.log("🎬 Video fetched from main system successfully:", result);
            } else {
              console.log("⚠️ Failed to fetch video from main system, using fallback");
            }
          } catch (fetchError) {
            console.log("⚠️ Error fetching video from main system:", fetchError);
          }
        }
      }

      // Show success toast with method used and video info
      const methodUsed = usingProxy ? "via backend proxy" : "directly via public endpoint";
      const transferMethod = result.method === "transferred" ? " → transferred to main system" : "";
      const videoInfo = result.video_url ? `\n🎥 Video generated (${(result.size / 1024 / 1024).toFixed(2)} MB)` : '';

      toast.success(
        `🎬 AnimateDiff video generation completed ${methodUsed}${transferMethod}!${videoInfo}`,
        {
          duration: 6000,
          style: {
            background: 'linear-gradient(135deg, rgba(15, 15, 25, 0.95), rgba(25, 25, 35, 0.95))',
            color: '#fff',
            border: '1px solid rgba(255, 153, 51, 0.3)',
            borderRadius: '12px',
            fontSize: '14px',
            maxWidth: '500px',
            boxShadow: '0 0 20px rgba(255, 153, 51, 0.1)',
          },
        }
      );

      // If video was generated, store it for display
      if (result.video_url) {
        console.log("🎥 Generated video URL:", result.video_url);
        console.log("🎥 Video can be displayed using this URL in a <video> element");

        // Store the video data and show in sidebar
        showVideo({
          url: result.video_url,
          contentType: result.content_type,
          size: result.size,
          subject: subject,
          topic: topic,
          timestamp: new Date().toISOString()
        });
      }

      return result;
    } catch (error) {
      console.error("🎬 Error sending to video generation API:", error);

      // Determine error type for better user feedback
      let errorMessage = error.message;
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = "Network connection failed. Please check that your backend (localhost:8001) is running and can reach the AnimateDiff service.";
      } else if (error.message.includes('CORS')) {
        errorMessage = "Cross-origin request blocked. Using backend proxy to resolve the issue.";
      } else if (error.message.includes('404')) {
        errorMessage = "Video generation API endpoint not found. Please verify the AnimateDiff service endpoint is correct.";
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = "Authentication failed. Please verify the API key is correct.";
      } else if (error.message.includes('500') || error.message.includes('503')) {
        errorMessage = "AnimateDiff service is temporarily unavailable or unreachable. Please try again later.";
      } else if (error.message.includes('504')) {
        errorMessage = "Video generation request timed out. The process may take longer than expected.";
      }

      // Show error toast (non-blocking)
      toast.error(
        `🎬 Failed to connect to AnimateDiff API: ${errorMessage}\n📍 Backend Proxy: localhost:8001 → 192.168.0.121:8501\n🌐 Ngrok Fallback: 8c9ce043b836.ngrok-free.app`,
        {
          duration: 8000,
          style: {
            background: 'linear-gradient(135deg, rgba(15, 15, 25, 0.95), rgba(25, 25, 35, 0.95))',
            color: '#fff',
            border: '1px solid rgba(255, 153, 51, 0.3)',
            borderRadius: '12px',
            fontSize: '14px',
            maxWidth: '450px',
            boxShadow: '0 0 20px rgba(255, 153, 51, 0.1)',
          },
        }
      );
    }
  };







  // Streaming lesson generation function
  const handleStreamingSubmit = async (e) => {
    e.preventDefault();

    // Prevent submission if already processing
    if (isButtonDisabled()) {
      return;
    }

    // Validate form fields
    if (!isFormValid()) {
      toast.error(
        "Please fill in both Subject and Topic fields before generating a lesson.",
        {
          duration: 4000,
          style: {
            background: 'linear-gradient(135deg, rgba(15, 15, 25, 0.95), rgba(25, 25, 35, 0.95))',
            color: '#fff',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
          },
        }
      );
      return;
    }

    const trimmedSubject = selectedSubject.trim();
    const trimmedTopic = topic.trim();

    setIsSubmitting(true);
    setShowResults(true);
    setLessonData({ streaming: true, content: "" }); // Initialize streaming state

    // Show loading toast
    toast.loading(
      `🎓 Generating in-depth lesson content...\n📚 ${trimmedSubject}: ${trimmedTopic}\n⚡ Live streaming enabled`,
      {
        id: "streaming-lesson-generation",
        duration: Infinity,
        style: {
          background: 'linear-gradient(135deg, rgba(15, 15, 25, 0.95), rgba(25, 25, 35, 0.95))',
          color: '#fff',
          border: '1px solid rgba(255, 153, 51, 0.3)',
          borderRadius: '12px',
          fontSize: '14px',
          maxWidth: '450px',
          fontWeight: '500',
          boxShadow: '0 0 20px rgba(255, 153, 51, 0.1)',
        },
      }
    );

    try {
      // Determine which API endpoint to use
      const baseUrl = API_BASE_URL || "http://localhost:8001";
      const streamUrl = `${baseUrl}/generate_lesson_stream?subject=${encodeURIComponent(trimmedSubject)}&topic=${encodeURIComponent(trimmedTopic)}&include_wikipedia=${includeWikipedia}&use_knowledge_store=${useKnowledgeStore}`;

      console.log("🌊 Starting streaming lesson generation:", streamUrl);

      const response = await fetch(streamUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      // Process the stream
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log("🏁 Streaming complete");
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim()) {
            // Check for special markers
            if (line.includes('[STREAM_END]')) {
              console.log("✅ Stream ended successfully");
              break;
            } else if (line.includes('[STREAM_ERROR]')) {
              throw new Error("Streaming error occurred");
            } else if (line.startsWith('data: ')) {
              // Remove 'data: ' prefix
              const content = line.substring(6);

              // Filter out status messages and only accumulate actual lesson content
              const isStatusMessage = content.includes('🎓') || content.includes('📚') ||
                                    content.includes('🔍') || content.includes('✅') ||
                                    content.includes('⚠️') || content.includes('🌐') ||
                                    content.includes('🧠') || content.includes('📖') ||
                                    content.includes('📊') || content.includes('🎯') ||
                                    content.includes('[END]') || content.includes('[ERROR]') ||
                                    content.includes('Starting lesson') || content.includes('Gathering educational') ||
                                    content.includes('Accessing knowledge') || content.includes('Searching Wikipedia') ||
                                    content.includes('Generating comprehensive') || content.includes('Lesson content ready') ||
                                    content.includes('Total content:') || content.includes('Sources used:') ||
                                    content.includes('Lesson generation complete');

              // Only add actual lesson content, not status messages
              if (!isStatusMessage && content.trim()) {
                accumulatedContent += content + '\n';
              }

              // Update the lesson data with accumulated content
              setLessonData({
                streaming: true,
                content: accumulatedContent,
                subject: trimmedSubject,
                topic: trimmedTopic,
                title: `In-Depth Study: ${trimmedTopic} in ${trimmedSubject}`,
                status: "streaming",
                knowledge_base_used: useKnowledgeStore,
                wikipedia_used: includeWikipedia
              });
            } else {
              // Regular content line
              accumulatedContent += line + '\n';
              setLessonData(prev => ({
                ...prev,
                content: accumulatedContent
              }));
            }
          }
        }
      }

      // Finalize the lesson data
      setLessonData(prev => ({
        ...prev,
        streaming: false,
        status: "completed",
        generated_at: new Date().toISOString()
      }));

      // Dismiss loading toast and show success
      toast.dismiss("streaming-lesson-generation");
      toast.success(
        `🎉 Streaming lesson completed!\n📚 ${trimmedSubject}: ${trimmedTopic}\n✨ In-depth content ready for exploration!`,
        {
          duration: 6000,
          style: {
            background: 'linear-gradient(135deg, rgba(15, 15, 25, 0.95), rgba(25, 25, 35, 0.95))',
            color: '#fff',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '12px',
            fontSize: '14px',
            maxWidth: '450px',
            fontWeight: '500',
            boxShadow: '0 0 20px rgba(34, 197, 94, 0.1)',
          },
        }
      );

      // Trigger TTS for the final content if available
      if (serviceHealthy && accumulatedContent) {
        console.log("🔊 Jupiter TTS: Triggering auto-play for streamed content");
        handleJupiterResponse(accumulatedContent);
      }

    } catch (error) {
      console.error("❌ Streaming lesson generation failed:", error);

      toast.dismiss("streaming-lesson-generation");
      toast.error(
        `⚠️ Streaming lesson generation failed\n🔍 Error: ${error.message}\n💡 Try: Check connection or use regular generation`,
        {
          duration: 8000,
          style: {
            background: 'linear-gradient(135deg, rgba(15, 15, 25, 0.95), rgba(25, 25, 35, 0.95))',
            color: '#fff',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            fontSize: '14px',
            maxWidth: '450px',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.1)',
          },
        }
      );

      setLessonData({
        error: error.message,
        subject: trimmedSubject,
        topic: trimmedTopic,
        status: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassContainer>
      <div className="max-w-full mx-auto px-8 py-10">
        {/* Show input form only when no results are displayed */}
        {!showResults && (
          <>
            <div className="text-center mb-8">
              <h2
                className="text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-xl transition-all duration-300 bg-gradient-to-r from-white to-amber-200 bg-clip-text text-transparent"
                style={{
                  fontFamily: "Nunito, sans-serif",
                }}
              >
                Subject Explorer
              </h2>

              {/* Orchestration Status */}
              <div className="flex items-center justify-center space-x-4 mb-6">
                {integrationStatus?.integration_status?.overall_valid && (
                  <div className="flex items-center space-x-2 bg-green-500/20 px-3 py-1 rounded-full border border-green-500/40">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-300 text-sm font-medium">AI Enhanced</span>
                  </div>
                )}
              </div>
            </div>

            <p
              className="text-xl md:text-2xl font-medium mb-10 text-center text-white/90"
              style={{
                fontFamily: "Inter, Poppins, sans-serif",
              }}
            >
              Select a subject and enter a topic to begin your learning journey
            </p>

            {/* User Progress Dashboard */}
            {showProgressDashboard && userId && userId !== "guest-user" && (
              <div className="mb-10">
                <UserProgressDashboard
                  userProgress={formatUserProgressData(userProgress)}
                  userAnalytics={userAnalytics}
                  onTriggerIntervention={handleTriggerIntervention}
                  isLoadingProgress={isLoadingProgress}
                  isLoadingAnalytics={isLoadingAnalytics}
                  isTriggeringIntervention={isTriggeringIntervention}
                />
              </div>
            )}
            <div
              className="space-y-8 max-w-5xl mx-auto bg-white/10 p-10 rounded-xl backdrop-blur-md border border-white/20 shadow-lg"
            >
              <div className="relative group">
                <label className={`block mb-3 font-medium text-lg transition-opacity duration-300 ${
                  isButtonDisabled() ? 'text-white/50' : 'text-white/90'
                }`}>
                  Subject:
                </label>
                <div className="relative">
                  <GlassInput
                    type="text"
                    placeholder="Type any subject (e.g. Mathematics, Physics, History)"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    icon={Book}
                    autoComplete="off"
                    className={`text-lg py-3 ${isButtonDisabled() ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={isButtonDisabled()}
                  />
                </div>
              </div>

              <div>
                <label className={`block mb-3 font-medium text-lg transition-opacity duration-300 ${
                  isButtonDisabled() ? 'text-white/50' : 'text-white/90'
                }`}>
                  Topic:
                </label>
                <GlassInput
                  type="text"
                  placeholder="Enter a topic to explore"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  icon={BookOpen}
                  className={`text-lg py-3 ${isButtonDisabled() ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={isButtonDisabled()}
                />
              </div>

              {/* Toggle Switches */}
              <div className={`space-y-6 transition-opacity duration-300 ${
                isButtonDisabled() ? 'opacity-60' : ''
              }`}>
                {/* First Row - Include Wikipedia and Use Knowledge Store */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Include Wikipedia Toggle */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/20">
                    <div>
                      <label className={`font-medium text-lg block transition-opacity duration-300 ${
                        isButtonDisabled() ? 'text-white/50' : 'text-white/90'
                      }`}>
                        Include Wikipedia
                      </label>
                      <p className={`text-sm mt-1 transition-opacity duration-300 ${
                        isButtonDisabled() ? 'text-white/40' : 'text-white/60'
                      }`}>
                        Use Wikipedia data for enhanced content
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIncludeWikipedia(!includeWikipedia)}
                      disabled={isButtonDisabled()}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                        includeWikipedia ? "bg-amber-500" : "bg-gray-600"
                      } ${
                        isButtonDisabled()
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                          includeWikipedia ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Use Knowledge Store Toggle */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/20">
                    <div>
                      <label className={`font-medium text-lg block transition-opacity duration-300 ${
                        isButtonDisabled() ? 'text-white/50' : 'text-white/90'
                      }`}>
                        Use Knowledge Store
                      </label>
                      <p className={`text-sm mt-1 transition-opacity duration-300 ${
                        isButtonDisabled() ? 'text-white/40' : 'text-white/60'
                      }`}>
                        Access curated knowledge database
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUseKnowledgeStore(!useKnowledgeStore)}
                      disabled={isButtonDisabled()}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                        useKnowledgeStore ? "bg-amber-500" : "bg-gray-600"
                      } ${
                        isButtonDisabled()
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                          useKnowledgeStore ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Second Row - View Progress Button and Enhanced Mode Toggle */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* View Progress Button */}
                  {userId && userId !== "guest-user" && (
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/20">
                      <div>
                        <label className={`font-medium text-lg block transition-opacity duration-300 ${
                          isButtonDisabled() ? 'text-white/50' : 'text-white/90'
                        }`}>
                          View Progress
                        </label>
                        <p className={`text-sm mt-1 transition-opacity duration-300 ${
                          isButtonDisabled() ? 'text-white/40' : 'text-white/60'
                        }`}>
                          Show learning progress dashboard
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowProgressDashboard(!showProgressDashboard)}
                        disabled={isButtonDisabled()}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                          showProgressDashboard
                            ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300 hover:text-amber-200'
                            : 'bg-gray-500/20 hover:bg-amber-500/20 border-gray-500/40 hover:border-amber-500/40 text-gray-300 hover:text-amber-300'
                        } ${
                          isButtonDisabled()
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {showProgressDashboard ? 'Hide' : 'Show'}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Enhanced Mode Toggle */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/20">
                    <div>
                      <label className={`font-medium text-lg block transition-opacity duration-300 ${
                        isButtonDisabled() ? 'text-white/50' : 'text-white/90'
                      }`}>
                        Enhanced Mode
                      </label>
                      <p className={`text-sm mt-1 transition-opacity duration-300 ${
                        isButtonDisabled() ? 'text-white/40' : 'text-white/60'
                      }`}>
                        Use AI orchestration for personalized learning
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUseOrchestration(!useOrchestration)}
                      disabled={isButtonDisabled()}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                        useOrchestration ? "bg-amber-500" : "bg-gray-600"
                      } ${
                        isButtonDisabled()
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                          useOrchestration ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Video Style Selection */}
                <div className="mt-6">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/20">
                    <div className="mb-4">
                      <label className={`font-medium text-lg block transition-opacity duration-300 ${
                        isButtonDisabled() ? 'text-white/50' : 'text-white/90'
                      }`}>
                        Video Generation Style
                      </label>
                      <p className={`text-sm mt-1 transition-opacity duration-300 ${
                        isButtonDisabled() ? 'text-white/40' : 'text-white/60'
                      }`}>
                        Choose the visual style for generated videos
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {/* Realistic Style */}
                      <button
                        type="button"
                        onClick={() => setSelectedVideoStyle('realistic')}
                        disabled={isButtonDisabled()}
                        className={`p-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                          selectedVideoStyle === 'realistic'
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-gray-500/20 hover:bg-amber-500/10 border-gray-500/40 hover:border-amber-500/30 text-gray-300 hover:text-amber-300'
                        } ${
                          isButtonDisabled()
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-lg font-medium">📷</div>
                          <div className="text-sm font-medium mt-1">Realistic</div>
                          <div className="text-xs mt-1 opacity-75">Photorealistic style</div>
                        </div>
                      </button>

                      {/* Artistic Style */}
                      <button
                        type="button"
                        onClick={() => setSelectedVideoStyle('artistic')}
                        disabled={isButtonDisabled()}
                        className={`p-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                          selectedVideoStyle === 'artistic'
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-gray-500/20 hover:bg-amber-500/10 border-gray-500/40 hover:border-amber-500/30 text-gray-300 hover:text-amber-300'
                        } ${
                          isButtonDisabled()
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-lg font-medium">🎨</div>
                          <div className="text-sm font-medium mt-1">Artistic</div>
                          <div className="text-xs mt-1 opacity-75">Painterly style</div>
                        </div>
                      </button>

                      {/* Anime Style */}
                      <button
                        type="button"
                        onClick={() => setSelectedVideoStyle('anime')}
                        disabled={isButtonDisabled()}
                        className={`p-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                          selectedVideoStyle === 'anime'
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-gray-500/20 hover:bg-amber-500/10 border-gray-500/40 hover:border-amber-500/30 text-gray-300 hover:text-amber-300'
                        } ${
                          isButtonDisabled()
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-lg font-medium">🎌</div>
                          <div className="text-sm font-medium mt-1">Anime</div>
                          <div className="text-xs mt-1 opacity-75">Japanese animation</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-10 relative">
                {/* Streaming Generation Button */}
                <div className="relative">
                  <GlassButton
                    type="button"
                    onClick={handleStreamingSubmit}
                    icon={BookOpen}
                    variant="primary"
                    className={`px-8 py-4 text-lg font-medium transition-all duration-300 flex items-center justify-center ${
                      getButtonVisualState() === "invalid" ? "opacity-75" : ""
                    } ${
                      getButtonVisualState() === "disabled"
                        ? "cursor-not-allowed"
                        : ""
                    }`}
                    disabled={isButtonDisabled()}
                    aria-label={
                      isButtonDisabled()
                        ? "Generating in-depth lesson content with live streaming..."
                        : !isFormValid()
                        ? "Please fill in both Subject and Topic fields for in-depth exploration"
                        : "Generate in-depth lesson with live streaming"
                    }
                  >
                    {isButtonDisabled() ? "Streaming..." : "In-Depth Stream"}
                  </GlassButton>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Results Section */}
        {/* Loading Overlay - Positioned outside of results container for proper centering */}
        {(isLoadingData || isSubmitting) && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center">
            <div className="bg-white/10 rounded-xl p-8 backdrop-blur-md border border-white/30 shadow-xl w-full max-w-lg mx-4">
              {/* Orange Loader - Perfectly Centered */}
              <div className="flex justify-center items-center mb-6">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-orange-500/30 border-t-orange-500 border-r-orange-500"></div>
              </div>

              <div className="text-center">
                <p className="text-white/90 text-xl font-medium mb-3">
                  📚 Generating lesson content for "{selectedSubject.trim()}: {topic.trim()}"
                </p>
                <p className="text-amber-300 text-lg mb-4">
                  ⏱️ This will take approximately 2 minutes. Please be patient.
                </p>
                <div className="bg-gradient-to-r from-orange-900/20 to-amber-900/20 rounded-lg p-4 border border-orange-500/30">
                  <p className="text-orange-200 text-sm">
                    🤖 AI is analyzing your topic and creating personalized content
                    <br />
                    ✨ Including explanations, activities, and questions
                    <br />
                    📖 Integrating knowledge from multiple sources
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {showResults && (
          <div className="bg-white/20 rounded-xl p-8 backdrop-blur-md border border-white/30 shadow-xl">

            {isLoadingData || isSubmitting ? (
              <div className="text-center py-8">
                <p className="text-white/70">Loading...</p>
              </div>
            ) : isErrorData ? (
              <div className="text-red-400 text-center my-8 p-6 bg-white/5 rounded-xl border border-red-500/20">
                <p className="font-semibold mb-4 text-xl">
                  Sorry, the service is currently unavailable. Please try again
                  later.
                </p>
                <div className="mt-8">
                  <GlassButton
                    onClick={handleNewSearch}
                    variant="secondary"
                    className="px-6 py-3 text-lg"
                  >
                    Try Again
                  </GlassButton>
                </div>
              </div>
            ) : subjectData ? (
              <div className="space-y-8">

                {/* Structured lesson content */}
                <div className="space-y-10">
                  {/* Title */}
                  {subjectData?.title && (
                    <div className="text-center">
                      <div className="mb-4">
                        <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-amber-200">
                          {subjectData.title}
                        </h2>
                      </div>
                      <div className="mt-3 flex justify-center">
                        <div className="bg-gradient-to-r from-amber-500/30 to-amber-600/30 text-amber-200 px-4 py-1.5 rounded-full text-base font-medium border border-amber-500/30 shadow-lg">
                          {selectedSubject.trim()}: {topic.trim()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shloka and Translation */}
                  {subjectData?.shloka && (
                    <div className="bg-amber-900/20 p-8 rounded-xl border border-amber-500/40 shadow-lg mx-auto max-w-4xl">
                      <div className="mb-5">
                        <p className="italic text-amber-200 font-medium text-center text-xl leading-relaxed">
                          {subjectData.shloka}
                        </p>
                      </div>
                      {subjectData?.translation && (
                        <div className="bg-white/10 p-4 rounded-lg">
                          <p className="text-white/90 text-base text-center">
                            <span className="text-amber-300 font-medium">
                              Translation:
                            </span>{" "}
                            {subjectData.translation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mode and Enhancement Indicators */}
                  {(() => {
                    const formattedLesson = formatEnhancedLessonData(subjectData);
                    const isEnhanced = formattedLesson?.isEnhanced;
                    const contentLength = subjectData?.content?.length || 0;
                    const isLongContent = contentLength > 500;
                    const contentType = subjectData?.content_type || 'standard';

                    return (
                      <div className="space-y-3">
                        {/* Mode Indicator */}
                        <div className={`p-3 rounded-xl border shadow-lg ${
                          isEnhanced
                            ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-500/40'
                            : 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-500/40'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full animate-pulse ${
                                isEnhanced ? 'bg-green-500' : 'bg-blue-500'
                              }`}></div>
                              <span className={`font-medium ${
                                isEnhanced ? 'text-green-300' : 'text-blue-300'
                              }`}>
                                {isEnhanced ? '🚀 Enhanced Mode' : '📚 Basic Mode'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3 text-sm">
                              {/* Content Length Indicator */}
                              <span className={`px-2 py-1 rounded-full ${
                                isLongContent
                                  ? 'bg-purple-500/20 text-purple-200'
                                  : 'bg-gray-500/20 text-gray-200'
                              }`}>
                                📝 {isLongContent ? 'Comprehensive' : 'Concise'} ({contentLength} chars)
                              </span>

                              {/* Wikipedia Indicator */}
                              <span className={`px-2 py-1 rounded-full ${
                                includeWikipedia
                                  ? 'bg-orange-500/20 text-orange-200'
                                  : 'bg-gray-500/20 text-gray-200'
                              }`}>
                                {includeWikipedia ? '🌐 Wikipedia' : '🧠 Pure AI'}
                              </span>

                              {/* Content Type */}
                              {contentType !== 'standard' && (
                                <span className="bg-indigo-500/20 text-indigo-200 px-2 py-1 rounded-full">
                                  {contentType === 'concise' ? '⚡ Concise' : '📖 Basic'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Features (only for orchestration) */}
                        {isEnhanced && (
                          <div className="bg-gradient-to-r from-amber-900/20 to-yellow-900/20 p-3 rounded-xl border border-amber-500/30">
                            <div className="flex items-center space-x-4 text-sm text-amber-200">
                              {formattedLesson.ragEnhanced && (
                                <span className="bg-green-500/20 px-2 py-1 rounded-full">📚 RAG Enhanced</span>
                              )}
                              {formattedLesson.triggersDetected > 0 && (
                                <span className="bg-amber-500/20 px-2 py-1 rounded-full">
                                  ⚡ {formattedLesson.triggersDetected} Triggers
                                </span>
                              )}
                              {formattedLesson.sourceDocumentsCount > 0 && (
                                <span className="bg-blue-500/20 px-2 py-1 rounded-full">
                                  📖 {formattedLesson.sourceDocumentsCount} Sources
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Explanation/Content - Enhanced User-Friendly Design */}
                  {(subjectData?.explanation || subjectData?.text || subjectData?.content) && (
                    <div className="relative">
                      {/* Content Header with Modern Design */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-xl transform rotate-3">
                                <span className="text-white font-bold text-lg transform -rotate-3">1</span>
                              </div>
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-full animate-pulse"></div>
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-white mb-1">
                                {subjectData?.streaming ? "Live Lesson Content" : "Lesson Content"}
                              </h3>
                              <p className="text-white/60 text-sm">
                                {subjectData?.streaming ? "Content is being generated in real-time" : "Comprehensive lesson explanation"}
                              </p>
                            </div>
                          </div>

                          {/* Status Indicators */}
                          <div className="flex items-center space-x-3">
                            {subjectData?.streaming && (
                              <div className="flex items-center space-x-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-4 py-2 rounded-full border border-green-500/30">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-green-300 text-sm font-medium">LIVE</span>
                              </div>
                            )}
                            <div className="bg-white/10 px-3 py-1 rounded-full">
                              <span className="text-white/70 text-xs">📚 Educational Content</span>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar for Streaming */}
                        {subjectData?.streaming && (
                          <div className="w-full bg-white/10 rounded-full h-1 mb-4">
                            <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-1 rounded-full animate-pulse" style={{width: '70%'}}></div>
                          </div>
                        )}
                      </div>

                      {/* Content Display with Enhanced Styling */}
                      <div className="relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-3xl p-10 border border-white/20 shadow-2xl w-full max-w-none overflow-hidden">
                        {/* Decorative Elements */}
                        <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-full blur-xl"></div>
                        <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-xl"></div>

                        {/* Content Area with Live Rendering */}
                        <div className="relative z-10">
                          {subjectData?.streaming ? (
                            <LessonStreamRenderer
                              streamingContent={subjectData?.content || ''}
                              isStreaming={subjectData?.streaming}
                              speed={25} // Optimal speed for readability
                              className="w-full"
                              onComplete={() => {
                                console.log('🎉 Lesson streaming completed');
                                // Auto-play TTS after streaming completes
                                if (serviceHealthy && subjectData?.content) {
                                  setTimeout(() => {
                                    console.log("🔊 Jupiter TTS: Triggering auto-play for streamed lesson content");
                                    handleJupiterResponse(subjectData.content);
                                  }, 1000);
                                }
                              }}
                            />
                          ) : subjectData?.content || subjectData?.explanation || subjectData?.text ? (
                            <LessonLiveRenderer
                              content={subjectData?.content || subjectData?.explanation || subjectData?.text || ''}
                              speed={20} // Optimal character rendering speed
                              lineDelay={150} // Smooth delay between lines
                              autoStart={true}
                              showCursor={true}
                              className="w-full"
                              onComplete={() => {
                                console.log('🎉 Lesson rendering completed');
                                // Auto-play TTS after rendering completes
                                const content = subjectData?.content || subjectData?.explanation || subjectData?.text;
                                if (serviceHealthy && content) {
                                  setTimeout(() => {
                                    console.log("🔊 Jupiter TTS: Triggering auto-play for rendered lesson content");
                                    handleJupiterResponse(content);
                                  }, 1000);
                                }
                              }}
                            />
                          ) : (
                            <div className="text-white/70 text-center py-8">
                              <p>No content available to display.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Activity - Enhanced User-Friendly Design */}
                  {subjectData?.activity && (
                    <div className="relative mt-8">
                      {/* Activity Header */}
                      <div className="mb-6">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl transform -rotate-3">
                              <span className="text-white font-bold text-lg transform rotate-3">2</span>
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-purple-300 to-purple-400 rounded-full animate-pulse"></div>
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white mb-1">Interactive Activity</h3>
                            <p className="text-white/60 text-sm">Hands-on learning experience</p>
                          </div>
                        </div>
                      </div>

                      {/* Activity Content */}
                      <div className="relative bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm rounded-3xl p-8 border border-indigo-500/20 shadow-2xl">
                        {/* Decorative Elements */}
                        <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-xl"></div>
                        <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-xl"></div>

                        {/* Activity Icon */}
                        <div className="absolute top-6 right-6 w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">🎯</span>
                        </div>

                        {/* Content */}
                        <div className="relative z-10">
                          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                            <p className="text-white/95 leading-relaxed text-lg font-medium">
                              {subjectData.activity}
                            </p>
                          </div>

                          {/* Action Hint */}
                          <div className="mt-4 flex items-center justify-center">
                            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 px-4 py-2 rounded-full border border-indigo-500/30">
                              <span className="text-indigo-300 text-sm font-medium">💡 Try this activity to reinforce your learning</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Question - Enhanced User-Friendly Design */}
                  {subjectData?.question && (
                    <div className="relative mt-8">
                      {/* Question Header */}
                      <div className="mb-6">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-xl transform rotate-6">
                              <span className="text-white font-bold text-lg transform -rotate-6">3</span>
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full animate-pulse"></div>
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white mb-1">Reflection Question</h3>
                            <p className="text-white/60 text-sm">Think deeply about this concept</p>
                          </div>
                        </div>
                      </div>

                      {/* Question Content */}
                      <div className="relative bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm rounded-3xl p-8 border border-amber-500/20 shadow-2xl">
                        {/* Decorative Elements */}
                        <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-xl"></div>
                        <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-xl"></div>

                        {/* Question Icon */}
                        <div className="absolute top-6 right-6 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">❓</span>
                        </div>

                        {/* Content */}
                        <div className="relative z-10">
                          <div className="bg-gradient-to-r from-white/5 to-white/10 rounded-2xl p-6 border border-white/10">
                            <p className="text-white/95 leading-relaxed text-lg font-medium italic">
                              "{subjectData.question}"
                            </p>
                          </div>

                          {/* Thinking Prompt */}
                          <div className="mt-4 flex items-center justify-center">
                            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-4 py-2 rounded-full border border-amber-500/30">
                              <span className="text-amber-300 text-sm font-medium">🤔 Take a moment to reflect on this</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fallback for legacy content format - Enhanced */}
                  {(subjectData?.lesson || subjectData?.content) &&
                    !subjectData?.title && (
                      <div className="relative mt-8">
                        <div className="mb-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                              <span className="text-white text-sm">📚</span>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white">Legacy Content</h3>
                              <p className="text-white/60 text-sm">Formatted lesson content</p>
                            </div>
                          </div>
                        </div>
                        <div
                          className="content-container bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl break-words overflow-wrap-anywhere"
                          dangerouslySetInnerHTML={{
                            __html: subjectData?.lesson || subjectData?.content,
                          }}
                        />
                      </div>
                    )}

                  {/* Emergency fallback - Enhanced Debug Display */}
                  {!subjectData?.title && !subjectData?.lesson && !subjectData?.content && (
                    <div className="relative mt-8">
                      <div className="mb-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                            <span className="text-white text-sm">🔧</span>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">Debug Information</h3>
                            <p className="text-white/60 text-sm">Raw lesson data for troubleshooting</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl p-6 border border-red-500/20 shadow-xl">
                        <pre className="text-white/90 whitespace-pre-wrap text-sm overflow-auto max-h-96 bg-black/20 rounded-xl p-4">
                          {JSON.stringify(subjectData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex justify-center items-center gap-6 mt-12">
                  {/* New Search Button */}
                  <GlassButton
                    onClick={handleNewSearch}
                    variant="secondary"
                    className="px-6 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all"
                  >
                    New Search
                  </GlassButton>
                </div>
              </div>
            ) : (
              <div className="text-center p-12 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl">
                {/* Empty State Icon */}
                <div className="mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">📚</span>
                  </div>
                  <div className="w-32 h-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent mx-auto"></div>
                </div>

                {/* Message */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-3">No Content Available</h3>
                  <p className="text-white/70 text-lg leading-relaxed max-w-md mx-auto">
                    We couldn't find any content for this topic. Please try searching for a different subject or check your connection.
                  </p>
                </div>

                {/* Action Button */}
                <GlassButton
                  onClick={handleNewSearch}
                  variant="secondary"
                  className="px-8 py-4 text-lg font-medium shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <span className="flex items-center space-x-2">
                    <span>🔍</span>
                    <span>Try Again</span>
                  </span>
                </GlassButton>
              </div>
            )}
          </div>
        )}

        {/* Original Video Player Section - Only show when not in sidebar mode */}
        {generatedVideo && !showVideoInSidebar && (
          <div className="mt-8 bg-white/20 rounded-xl p-8 backdrop-blur-md border border-white/30 shadow-xl">
            <div className="text-center mb-6">
              <h3 className="text-3xl font-bold text-white mb-2">
                🎬 Generated Video
              </h3>
              <p className="text-amber-300 text-lg">
                📚 {generatedVideo.subject}: {generatedVideo.topic}
              </p>
              <p className="text-white/70 text-sm mt-2">
                🎥 Size: {(generatedVideo.size / 1024 / 1024).toFixed(2)} MB •
                📅 Generated: {new Date(generatedVideo.timestamp).toLocaleString()}
              </p>
            </div>

            <div className="flex justify-center">
              <div className="bg-black/50 rounded-xl p-4 backdrop-blur-sm border border-orange-500/30 shadow-2xl">
                <video
                  src={generatedVideo.url}
                  controls
                  autoPlay={false}
                  loop
                  muted
                  className="max-w-full max-h-96 rounded-lg shadow-lg"
                  style={{ maxWidth: '600px', width: '100%' }}
                  onLoadStart={() => console.log("🎥 Video load started")}
                  onLoadedData={() => console.log("🎥 Video data loaded")}
                  onCanPlay={() => console.log("🎥 Video can play")}
                  onError={(e) => {
                    console.error("🎥 Video error:", e);
                    console.error("🎥 Video error details:", e.target.error);
                    console.error("🎥 Video src:", generatedVideo.url);
                  }}
                >
                  <p className="text-white">
                    Your browser doesn't support video playback.
                    <a
                      href={generatedVideo.url}
                      download="generated_video.mp4"
                      className="text-orange-400 hover:text-orange-300 underline ml-1"
                    >
                      Download the video instead
                    </a>
                  </p>
                </video>

                {/* Debug info */}
                <div className="mt-4 p-3 bg-gray-800/50 rounded-lg text-xs text-white/70">
                  <p><strong>Debug Info:</strong></p>
                  <p>URL: {generatedVideo.url}</p>
                  <p>Content Type: {generatedVideo.contentType}</p>
                  <p>Size: {generatedVideo.size} bytes</p>
                  <p>URL Valid: {generatedVideo.url ? 'Yes' : 'No'}</p>
                  <p>URL Type: {generatedVideo.url?.startsWith('blob:') ? 'Blob URL' : 'Regular URL'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-6">
              <a
                href={generatedVideo.url}
                download={`${generatedVideo.subject}_${generatedVideo.topic}_video.mp4`}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-medium rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                📥 Download Video
              </a>

              <button
                onClick={() => {
                  console.log("🎥 Testing video URL:", generatedVideo.url);
                  const video = document.querySelector('video');
                  if (video) {
                    console.log("🎥 Video element found:", video);
                    console.log("🎥 Video src:", video.src);
                    console.log("🎥 Video readyState:", video.readyState);
                    console.log("🎥 Video networkState:", video.networkState);
                    video.load(); // Force reload
                  }
                }}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                🔄 Test Video
              </button>

              <button
                onClick={hideVideo}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-medium rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                ✕ Close Video
              </button>
            </div>
          </div>
        )}
      </div>
    </GlassContainer>
  );
}
