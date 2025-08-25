import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { PIPELINE_API_BASE_URL } from "../config";

// API slice for the deployed pipeline-24-master service on Render
export const pipelineApiSlice = createApi({
  reducerPath: "pipelineApi",
  baseQuery: fetchBaseQuery({
    baseUrl: PIPELINE_API_BASE_URL,
    timeout: 300000, // 5 minute timeout for lesson generation
    prepareHeaders: (headers, { getState }) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["PipelineLessons", "GenerationTasks", "TTS"],
  endpoints: (builder) => ({
    // Generate lesson using the deployed pipeline service
    generatePipelineLesson: builder.mutation({
      query: ({
        subject,
        topic,
        user_id = "guest-user",
        include_wikipedia = true,
        force_regenerate = true,
      }) => {
        console.log("🚀 Generating lesson with Pipeline service:", {
          subject,
          topic,
          user_id,
          include_wikipedia,
          force_regenerate,
        });

        return {
          url: "/generate_lesson",
          method: "POST",
          body: {
            subject,
            topic,
            user_id,
            include_wikipedia,
            force_regenerate,
          },
        };
      },
      invalidatesTags: (result, error, { subject, topic }) => [
        { type: "PipelineLessons", id: `${subject}-${topic}` },
      ],
    }),

    // Generate lesson asynchronously
    generatePipelineLessonAsync: builder.mutation({
      query: ({
        subject,
        topic,
        user_id = "guest-user",
        include_wikipedia = true,
      }) => {
        console.log("⏳ Starting async lesson generation:", {
          subject,
          topic,
          user_id,
          include_wikipedia,
        });

        return {
          url: "/generate_lesson_async",
          method: "POST",
          body: {
            subject,
            topic,
            user_id,
            include_wikipedia,
          },
        };
      },
      invalidatesTags: ["GenerationTasks"],
    }),

    // Check generation task status
    checkGenerationTaskStatus: builder.query({
      query: (taskId) => `/lessons/tasks/${taskId}`,
      providesTags: (result, error, taskId) => [
        { type: "GenerationTasks", id: taskId },
      ],
    }),

    // List all active generation tasks
    listActiveTasks: builder.query({
      query: () => "/lessons/tasks",
      providesTags: ["GenerationTasks"],
    }),

    // Get lesson TTS generation
    generateLessonTTS: builder.mutation({
      query: ({
        task_id,
        subject,
        topic,
        user_id = "guest-user",
        include_sections = ["title", "shloka", "translation", "explanation", "activity", "question"],
        format_style = "complete",
      }) => ({
        url: "/lessons/generate-tts",
        method: "POST",
        body: {
          task_id,
          subject,
          topic,
          user_id,
          include_sections,
          format_style,
        },
      }),
      invalidatesTags: ["TTS"],
    }),

    // Generate TTS from arbitrary text
    generateTextTTS: builder.mutation({
      query: ({
        text,
        user_id = "guest-user",
        description,
      }) => ({
        url: "/tts/generate",
        method: "POST",
        body: {
          text,
          user_id,
          description,
        },
      }),
      invalidatesTags: ["TTS"],
    }),

    // Get audio file from pipeline service
    getAudioFile: builder.query({
      query: (filename) => `/api/audio/${filename}`,
      providesTags: (result, error, filename) => [
        { type: "TTS", id: filename },
      ],
    }),

    // List available audio files
    listAudioFiles: builder.query({
      query: () => "/api/audio-files",
      providesTags: ["TTS"],
    }),

    // Forward data to external server
    forwardDataToExternal: builder.mutation({
      query: ({
        data,
        endpoint = "/",
        method = "POST",
        headers = {},
        timeout = 30,
        user_id = "guest-user",
        description,
      }) => ({
        url: "/forward_data",
        method: "POST",
        body: {
          data,
          endpoint,
          method,
          headers,
          timeout,
          user_id,
          description,
        },
      }),
    }),

    // Send lesson to external server
    sendLessonToExternal: builder.mutation({
      query: ({
        subject,
        topic,
        user_id = "guest-user",
        endpoint = "/api/receive_lesson",
        include_metadata = true,
      }) => ({
        url: `/send_lesson_to_external?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}&user_id=${user_id}&endpoint=${endpoint}&include_metadata=${include_metadata}`,
        method: "POST",
      }),
    }),

    // Check external server connectivity
    checkExternalServer: builder.query({
      query: () => "/check_external_server",
    }),

    // Get pipeline service status
    getPipelineStatus: builder.query({
      query: () => "/",
      transformResponse: (response) => {
        // Extract useful status information
        return {
          service: "pipeline-24-master",
          status: "healthy",
          endpoints: response.endpoints || {},
          tts_integration: response.tts_integration || {},
          timestamp: new Date().toISOString(),
        };
      },
    }),

    // Get LLM status
    getLLMStatus: builder.query({
      query: () => "/llm_status",
    }),
  }),
});

// Export hooks for the pipeline API
export const {
  useGeneratePipelineLessonMutation,
  useGeneratePipelineLessonAsyncMutation,
  useCheckGenerationTaskStatusQuery,
  useLazyCheckGenerationTaskStatusQuery,
  useListActiveTasksQuery,
  useGenerateLessonTTSMutation,
  useGenerateTextTTSMutation,
  useGetAudioFileQuery,
  useListAudioFilesQuery,
  useForwardDataToExternalMutation,
  useSendLessonToExternalMutation,
  useCheckExternalServerQuery,
  useGetPipelineStatusQuery,
  useGetLLMStatusQuery,
} = pipelineApiSlice;

// Export the API slice itself for store configuration
export default pipelineApiSlice;