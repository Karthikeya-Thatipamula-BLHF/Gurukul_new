/**
 * Test script for Financial Chat API
 * Use this to verify the Llama API endpoint is working correctly
 */

const UNIGURU_API_BASE_URL = "https://3a46c48e4d91.ngrok-free.app";

/**
 * Test the financial chat API endpoint
 */
export const testFinancialChatAPI = async () => {
  console.log("🧪 Testing Financial Chat API...");
  console.log("=" * 50);

  const testPayload = {
    model: "llama3.1",
    messages: [
      {
        role: "system",
        content:
          "You are a professional financial advisor AI assistant. Provide helpful, accurate financial guidance.",
      },
      {
        role: "user",
        content:
          "Hello! Can you help me with financial advice? This is a test message.",
      },
    ],
    max_tokens: 100,
    temperature: 0.7,
  };

  try {
    console.log(
      "📤 Sending test request to:",
      `${UNIGURU_API_BASE_URL}/v1/chat/completions`
    );

    const response = await fetch(
      `${UNIGURU_API_BASE_URL}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(testPayload),
      }
    );

    console.log("📊 Response Status:", response.status);
    console.log(
      "📊 Response Headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (response.ok) {
      const data = await response.json();
      console.log("✅ API Test Successful!");
      console.log("📝 Response Data:", data);

      if (data.choices && data.choices[0] && data.choices[0].message) {
        console.log("💬 AI Response:", data.choices[0].message.content);
        return {
          success: true,
          message: data.choices[0].message.content,
          data: data,
        };
      } else {
        console.log("⚠️ Unexpected response format");
        return {
          success: false,
          error: "Unexpected response format",
          data: data,
        };
      }
    } else {
      const errorText = await response.text();
      console.log("❌ API Test Failed!");
      console.log("📝 Error Response:", errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        status: response.status,
      };
    }
  } catch (error) {
    console.log("❌ Network Error!");
    console.log("📝 Error Details:", error.message);
    return {
      success: false,
      error: error.message,
      type: "network_error",
    };
  }
};

/**
 * Test with financial context data
 */
export const testFinancialChatWithContext = async () => {
  console.log("🧪 Testing Financial Chat API with Context...");
  console.log("=" * 50);

  const sampleFinancialContext = {
    user_profile: {
      monthly_income: 5000,
      monthly_expenses: 3500,
      savings_goal: 1000,
    },
    performance_metrics: {
      savings_rate: 30,
      financial_health_score: 75,
    },
    simulation_status: {
      current_month: 6,
      total_months: 12,
    },
  };

  const contextualPrompt = `
You are a financial advisor AI assistant. You have access to the user's current financial simulation data. 
Please provide personalized financial guidance based on their actual data.

USER'S FINANCIAL DATA:
${JSON.stringify(sampleFinancialContext, null, 2)}

USER QUESTION: How is my financial health looking so far?

Please provide helpful, personalized financial advice based on their specific situation. 
Be specific about their income, expenses, savings, and financial goals. 
Offer actionable recommendations and insights.
`;

  const testPayload = {
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
    max_tokens: 500,
    temperature: 0.7,
  };

  try {
    console.log("📤 Sending contextual test request...");

    const response = await fetch(
      `${UNIGURU_API_BASE_URL}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(testPayload),
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Contextual API Test Successful!");

      if (data.choices && data.choices[0] && data.choices[0].message) {
        console.log("💬 AI Financial Advice:", data.choices[0].message.content);
        return {
          success: true,
          message: data.choices[0].message.content,
          data: data,
        };
      }
    } else {
      const errorText = await response.text();
      console.log("❌ Contextual API Test Failed!");
      console.log("📝 Error Response:", errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }
  } catch (error) {
    console.log("❌ Contextual Test Network Error!");
    console.log("📝 Error Details:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Run all tests
 */
export const runAllFinancialChatTests = async () => {
  console.log("🚀 Running All Financial Chat API Tests...");
  console.log("=" * 60);

  const results = {
    basicTest: await testFinancialChatAPI(),
    contextualTest: await testFinancialChatWithContext(),
  };

  console.log("\n📊 Test Results Summary:");
  console.log("=" * 30);
  console.log(
    "Basic API Test:",
    results.basicTest.success ? "✅ PASSED" : "❌ FAILED"
  );
  console.log(
    "Contextual Test:",
    results.contextualTest.success ? "✅ PASSED" : "❌ FAILED"
  );

  if (results.basicTest.success && results.contextualTest.success) {
    console.log(
      "\n🎉 All tests passed! Financial Chat API is working correctly."
    );
  } else {
    console.log("\n⚠️ Some tests failed. Check the logs above for details.");
  }

  return results;
};

// Make functions available in browser console for manual testing
if (typeof window !== "undefined") {
  window.testFinancialChatAPI = testFinancialChatAPI;
  window.testFinancialChatWithContext = testFinancialChatWithContext;
  window.runAllFinancialChatTests = runAllFinancialChatTests;

  console.log("🔧 Financial Chat API test functions are available in console:");
  console.log("- testFinancialChatAPI()");
  console.log("- testFinancialChatWithContext()");
  console.log("- runAllFinancialChatTests()");
}
