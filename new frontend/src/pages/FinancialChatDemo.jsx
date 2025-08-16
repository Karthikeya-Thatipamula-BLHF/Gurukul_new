import React from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../store/authSlice";
import FinancialChatInterface from "../components/FinancialChatInterface";
import { DollarSign, TrendingUp, PieChart, Target, Activity } from "lucide-react";

/**
 * Financial Chat Demo Page
 * Standalone page for testing and demonstrating the Financial Chat Interface
 */
const FinancialChatDemo = () => {
  const user = useSelector(selectUser);

  // Comprehensive sample financial data for testing
  const sampleFinancialData = {
    name: "Alex Johnson",
    monthly_income: 6500,
    monthly_expenses: {
      housing: 1800,
      food: 650,
      transportation: 450,
      utilities: 220,
      entertainment: 350,
      healthcare: 180,
      shopping: 300,
      other: 200
    },
    savings_goal: 1500,
    emergency_fund_target: 20000,
    debt: {
      credit_cards: 3200,
      student_loans: 18500,
      car_loan: 12000,
      mortgage: 220000
    },
    investment_accounts: {
      retirement_401k: 35000,
      ira: 12000,
      brokerage: 8500,
      crypto: 2500
    },
    financial_goals: {
      emergency_fund: { target: 20000, timeline: "12 months" },
      debt_payoff: { target: 33700, timeline: "24 months" },
      house_down_payment: { target: 50000, timeline: "36 months" },
      retirement: { target: 1000000, timeline: "25 years" }
    }
  };

  const sampleSimulationResults = {
    user_name: "Alex Johnson",
    current_month: 8,
    total_months: 12,
    total_income: 52000,
    total_expenses: 30400,
    total_savings: 21600,
    savings_rate: 41.5,
    financial_health_score: 82,
    monthly_data: [
      { month: 1, income: 6500, expenses: 4150, savings: 2350, emergency_fund: 2350, debt_payment: 800 },
      { month: 2, income: 6500, expenses: 3800, savings: 2700, emergency_fund: 5050, debt_payment: 800 },
      { month: 3, income: 6500, expenses: 3950, savings: 2550, emergency_fund: 7600, debt_payment: 800 },
      { month: 4, income: 6500, expenses: 3700, savings: 2800, emergency_fund: 10400, debt_payment: 800 },
      { month: 5, income: 6500, expenses: 3850, savings: 2650, emergency_fund: 13050, debt_payment: 800 },
      { month: 6, income: 6500, expenses: 3600, savings: 2900, emergency_fund: 15950, debt_payment: 800 },
      { month: 7, income: 6500, expenses: 3750, savings: 2750, emergency_fund: 18700, debt_payment: 800 },
      { month: 8, income: 6500, expenses: 3650, savings: 2850, emergency_fund: 21550, debt_payment: 800 }
    ],
    goals: {
      emergency_fund: {
        target: 20000,
        current: 21550,
        progress: 107.8,
        status: "achieved"
      },
      debt_payoff: {
        target: 0,
        current: 27300, // Reduced from original 33700
        progress: 19.0,
        monthly_payment: 800
      },
      house_down_payment: {
        target: 50000,
        current: 8500,
        progress: 17.0
      }
    },
    insights: {
      strengths: ["High savings rate", "Emergency fund achieved", "Consistent debt payments"],
      areas_for_improvement: ["Reduce entertainment spending", "Increase investment contributions"],
      recommendations: ["Consider increasing 401k contribution", "Look into high-yield savings account"]
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Financial AI Advisor Demo
              </h1>
              <p className="text-white/70">
                Interactive financial chat powered by Llama AI with comprehensive financial data analysis
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-600/20 px-3 py-2 rounded-lg">
                <Activity size={16} className="text-green-400" />
                <span className="text-green-200 text-sm font-medium">Health Score: 82/100</span>
              </div>
              <div className="flex items-center space-x-2 bg-blue-600/20 px-3 py-2 rounded-lg">
                <Target size={16} className="text-blue-400" />
                <span className="text-blue-200 text-sm font-medium">Savings Rate: 41.5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Financial Overview Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
              <h3 className="text-white font-medium mb-4 flex items-center">
                <DollarSign size={16} className="mr-2 text-green-400" />
                Financial Overview
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-white/60 mb-1">Monthly Income</div>
                  <div className="text-lg font-semibold text-green-400">$6,500</div>
                </div>
                
                <div>
                  <div className="text-xs text-white/60 mb-1">Monthly Expenses</div>
                  <div className="text-lg font-semibold text-red-400">$3,650</div>
                </div>
                
                <div>
                  <div className="text-xs text-white/60 mb-1">Monthly Savings</div>
                  <div className="text-lg font-semibold text-blue-400">$2,850</div>
                </div>
                
                <div>
                  <div className="text-xs text-white/60 mb-1">Emergency Fund</div>
                  <div className="text-lg font-semibold text-purple-400">$21,550</div>
                  <div className="text-xs text-green-400">✅ Goal Achieved!</div>
                </div>
                
                <div>
                  <div className="text-xs text-white/60 mb-1">Total Debt</div>
                  <div className="text-lg font-semibold text-orange-400">$27,300</div>
                  <div className="text-xs text-white/60">19% paid off</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-white font-medium mb-4 flex items-center">
                <TrendingUp size={16} className="mr-2 text-blue-400" />
                Quick Stats
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Simulation Progress</span>
                  <span className="text-blue-400 font-medium">8/12 months</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Debt-to-Income</span>
                  <span className="text-yellow-400 font-medium">35%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Investment Total</span>
                  <span className="text-green-400 font-medium">$58,000</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800/50 rounded-lg p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white mb-2 flex items-center">
                  <PieChart size={20} className="mr-2 text-purple-400" />
                  AI Financial Advisor Chat
                </h2>
                <p className="text-white/70 text-sm">
                  Ask questions about your financial data and get personalized advice from our AI advisor.
                  The AI has access to all your financial simulation data and can provide specific recommendations.
                </p>
              </div>
              
              <div style={{ height: "600px" }}>
                <FinancialChatInterface
                  financialData={sampleFinancialData}
                  simulationResults={sampleSimulationResults}
                  userId={user?.id || "demo-user"}
                  className="h-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Demo Instructions */}
        <div className="mt-6 bg-blue-600/10 border border-blue-500/30 rounded-lg p-6">
          <h3 className="text-blue-200 font-medium mb-3">💡 Demo Instructions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-200/80">
            <div>
              <h4 className="font-medium text-blue-200 mb-2">Try These Questions:</h4>
              <ul className="space-y-1">
                <li>• "How is my financial health overall?"</li>
                <li>• "Should I focus on debt or investing?"</li>
                <li>• "How can I optimize my spending?"</li>
                <li>• "What's my next financial priority?"</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-200 mb-2">Features to Test:</h4>
              <ul className="space-y-1">
                <li>• Quick action buttons for common questions</li>
                <li>• Follow-up suggestions after each response</li>
                <li>• Contextual advice based on your data</li>
                <li>• Real-time financial metrics display</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialChatDemo;
