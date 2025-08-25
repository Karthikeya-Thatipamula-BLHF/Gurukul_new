import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/**
 * Financial Chat API Slice
 * Handles chat functionality specifically for financial data analysis
 * Integrates with Llama model API for financial guidance
 */
export const financialChatApiSlice = createApi({
  reducerPath: "financialChatApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_UNIGURU_API_BASE_URL || "http://localhost:8000",
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      headers.set("Accept", "application/json");
      return headers;
    },
    timeout: 30000, // 30 second timeout for chat responses
  }),
  tagTypes: ["FinancialChat"],
  endpoints: (builder) => ({
    // Send financial chat message with context
    sendFinancialChatMessage: builder.mutation({
      query: ({ message, financialContext, userId }) => {
        // Create comprehensive financial context for the AI
        const contextualPrompt = `
You are a professional financial advisor AI assistant with expertise in personal finance, budgeting, investing, and financial planning.

ANALYSIS FRAMEWORK:
- Provide specific, actionable advice based on the user's actual financial data
- Use concrete numbers and percentages from their simulation
- Identify both strengths and areas for improvement
- Offer prioritized recommendations
- Consider their current progress and trends

USER'S FINANCIAL SIMULATION DATA:
${JSON.stringify(financialContext, null, 2)}

USER QUESTION: ${message}

RESPONSE GUIDELINES:
1. Start with a brief assessment of their current situation
2. Address their specific question with data-backed insights
3. Provide 2-3 specific, actionable recommendations
4. Include relevant financial metrics and benchmarks
5. End with encouragement and next steps

Please provide helpful, personalized financial advice that is:
- Specific to their data (use actual numbers)
- Actionable and practical
- Encouraging but realistic
- Focused on their question while considering their overall financial health
`;

        return {
          url: "/v1/chat/completions",
          method: "POST",
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
          body: {
            model: "llama3.1",
            messages: [
              {
                role: "system",
                content:
                  "You are a professional financial advisor AI assistant. Provide helpful, accurate financial guidance based on the user's data.",
              },
              {
                role: "user",
                content: contextualPrompt,
              },
            ],
            max_tokens: 2048,
            temperature: 0.7,
          },
        };
      },
      transformResponse: (response) => {
        // Transform the OpenAI-style response to our expected format
        if (response?.choices?.[0]?.message?.content) {
          return {
            message: response.choices[0].message.content.trim(),
            confidence: 0.9, // Default confidence
            model: "llama3.1",
          };
        }
        return {
          message:
            "I apologize, but I couldn't process your request at the moment.",
        };
      },
      invalidatesTags: ["FinancialChat"],
    }),

    // Get financial insights based on simulation data
    getFinancialInsights: builder.mutation({
      query: ({ financialData, analysisType = "general" }) => {
        const insightPrompt = `
Analyze the following financial data and provide insights:

FINANCIAL DATA:
${JSON.stringify(financialData, null, 2)}

ANALYSIS TYPE: ${analysisType}

Please provide:
1. Key financial health indicators
2. Areas of concern
3. Opportunities for improvement
4. Specific actionable recommendations
5. Risk assessment

Format your response in a clear, structured manner.
`;

        return {
          url: "/v1/chat/completions",
          method: "POST",
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
          body: {
            model: "llama3.1",
            messages: [
              {
                role: "system",
                content:
                  "You are a financial analysis expert. Provide detailed insights and recommendations based on financial data.",
              },
              {
                role: "user",
                content: insightPrompt,
              },
            ],
            max_tokens: 2048,
            temperature: 0.7,
          },
        };
      },
      transformResponse: (response) => {
        if (response?.choices?.[0]?.message?.content) {
          return {
            message: response.choices[0].message.content.trim(),
            model: "llama3.1",
          };
        }
        return { message: "Unable to analyze financial data at the moment." };
      },
      invalidatesTags: ["FinancialChat"],
    }),
  }),
});

export const {
  useSendFinancialChatMessageMutation,
  useGetFinancialInsightsMutation,
} = financialChatApiSlice;
