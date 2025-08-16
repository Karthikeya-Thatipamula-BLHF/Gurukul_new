import React from "react";
import FinancialChatInterface from "./FinancialChatInterface";

/**
 * Test component for Financial Chat Interface
 * Use this to test the chat functionality with sample data
 */
const FinancialChatTest = () => {
  // Sample financial data for testing
  const sampleFinancialData = {
    monthly_income: 5000,
    monthly_expenses: {
      housing: 1500,
      food: 600,
      transportation: 400,
      utilities: 200,
      entertainment: 300,
      healthcare: 150,
      other: 250
    },
    savings_goal: 1000,
    emergency_fund_target: 15000,
    debt: {
      credit_cards: 2500,
      student_loans: 15000,
      mortgage: 180000
    },
    investment_accounts: {
      retirement_401k: 25000,
      ira: 8000,
      brokerage: 5000
    }
  };

  const sampleSimulationResults = {
    current_month: 6,
    total_months: 12,
    total_income: 30000,
    total_expenses: 20400,
    total_savings: 9600,
    savings_rate: 32,
    financial_health_score: 78,
    monthly_data: [
      {
        month: 1,
        income: 5000,
        expenses: 3400,
        savings: 1600,
        emergency_fund: 1600
      },
      {
        month: 2,
        income: 5000,
        expenses: 3400,
        savings: 1600,
        emergency_fund: 3200
      },
      {
        month: 3,
        income: 5000,
        expenses: 3400,
        savings: 1600,
        emergency_fund: 4800
      },
      {
        month: 4,
        income: 5000,
        expenses: 3400,
        savings: 1600,
        emergency_fund: 6400
      },
      {
        month: 5,
        income: 5000,
        expenses: 3400,
        savings: 1600,
        emergency_fund: 8000
      },
      {
        month: 6,
        income: 5000,
        expenses: 3400,
        savings: 1600,
        emergency_fund: 9600
      }
    ],
    goals: {
      emergency_fund: {
        target: 15000,
        current: 9600,
        progress: 64
      },
      debt_payoff: {
        target: 0,
        current: 197500,
        monthly_payment: 800
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            Financial Chat Interface Test
          </h1>
          <p className="text-white/70 mb-4">
            This is a test page for the Financial Chat Interface. The chat is connected to the Llama AI model 
            and has access to sample financial simulation data.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-600/20 rounded-lg p-4">
              <h3 className="text-white font-medium mb-2">Sample Data Loaded:</h3>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• Monthly Income: $5,000</li>
                <li>• Monthly Expenses: $3,400</li>
                <li>• Savings Rate: 32%</li>
                <li>• Emergency Fund: $9,600</li>
                <li>• Financial Health Score: 78/100</li>
              </ul>
            </div>
            
            <div className="bg-green-600/20 rounded-lg p-4">
              <h3 className="text-white font-medium mb-2">Try These Questions:</h3>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• "How is my financial health?"</li>
                <li>• "Should I increase my savings?"</li>
                <li>• "What about my emergency fund?"</li>
                <li>• "How can I reduce expenses?"</li>
                <li>• "Investment recommendations?"</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4" style={{ height: "600px" }}>
          <FinancialChatInterface
            financialData={sampleFinancialData}
            simulationResults={sampleSimulationResults}
            userId="test-user-123"
            className="h-full"
          />
        </div>

        <div className="mt-6 bg-yellow-600/20 rounded-lg p-4">
          <h3 className="text-yellow-200 font-medium mb-2">⚠️ Testing Notes:</h3>
          <ul className="text-yellow-200/80 text-sm space-y-1">
            <li>• Make sure the UniGuru API endpoint (https://3a46c48e4d91.ngrok-free.app) is accessible</li>
            <li>• Check browser console for any API errors</li>
            <li>• The chat uses sample financial data for testing purposes</li>
            <li>• Responses should be contextually aware of the financial data provided</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FinancialChatTest;
