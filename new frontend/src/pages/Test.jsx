import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassContainer from "../components/GlassContainer";
import { useQuery } from "@tanstack/react-query";
import CenteredLoader from "../components/CenteredLoader";
import { getTests } from "../api";
import { ExternalLink, BookOpen, Brain, Clock, Award, Play } from "lucide-react";

export default function Test() {
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");

  const {
    data: tests,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["tests"],
    queryFn: getTests,
  });

  // Sample subjects and topics for quiz generation
  const subjects = {
    "Mathematics": ["Algebra", "Geometry", "Calculus", "Statistics", "Trigonometry"],
    "Science": ["Physics", "Chemistry", "Biology", "Environmental Science"],
    "History": ["Ancient History", "Modern History", "World Wars", "Indian History"],
    "English": ["Grammar", "Literature", "Vocabulary", "Writing Skills"],
    "Computer Science": ["Programming", "Data Structures", "Algorithms", "Web Development"]
  };

  const handleStartQuiz = () => {
    if (selectedSubject && selectedTopic) {
      navigate(`/quiz/${selectedSubject}/${selectedTopic}`);
    }
  };

  return (
    <GlassContainer>
      <h2
        className="text-4xl md:text-5xl font-extrabold mb-6 drop-shadow-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-white hover:to-[#FF9933] hover:bg-clip-text hover:text-transparent"
        style={{ color: "#FFFFFF", fontFamily: "Nunito, sans-serif" }}
      >
        Test Center
      </h2>
      <p
        className="text-lg md:text-xl font-medium mb-8"
        style={{ color: "#FFFFFF", fontFamily: "Nunito, sans-serif" }}
      >
        Take tests to evaluate your knowledge and track your progress.
      </p>

      {/* AI-Generated Quiz Section */}
      <div className="mb-12">
        <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-xl p-8 border border-orange-300/30 mb-8">
          <div className="flex items-center mb-6">
            <Brain className="w-8 h-8 text-orange-400 mr-3" />
            <h3 className="text-2xl font-bold text-white">AI-Generated Quizzes</h3>
          </div>
          <p className="text-gray-300 mb-6">
            Generate personalized quizzes based on your lesson content with intelligent questions and instant feedback.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-white font-medium mb-2">Select Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedTopic("");
                }}
                className="w-full p-3 rounded-lg bg-white/10 border border-gray-600 text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="">Choose a subject...</option>
                {Object.keys(subjects).map(subject => (
                  <option key={subject} value={subject} className="bg-gray-800">
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Select Topic</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                disabled={!selectedSubject}
                className="w-full p-3 rounded-lg bg-white/10 border border-gray-600 text-white focus:border-orange-500 focus:outline-none disabled:opacity-50"
              >
                <option value="">Choose a topic...</option>
                {selectedSubject && subjects[selectedSubject].map(topic => (
                  <option key={topic} value={topic} className="bg-gray-800">
                    {topic}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm text-gray-300">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>10-15 minutes</span>
              </div>
              <div className="flex items-center">
                <BookOpen className="w-4 h-4 mr-2" />
                <span>5 questions</span>
              </div>
              <div className="flex items-center">
                <Award className="w-4 h-4 mr-2" />
                <span>Instant feedback</span>
              </div>
            </div>

            <button
              onClick={handleStartQuiz}
              disabled={!selectedSubject || !selectedTopic}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-lg hover:from-orange-600 hover:to-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Quiz
            </button>
          </div>
        </div>
      </div>

      {/* External Tests Section */}
      <div>
        <div className="flex items-center mb-6">
          <ExternalLink className="w-6 h-6 text-blue-400 mr-3" />
          <h3 className="text-2xl font-bold text-white">External Practice Tests</h3>
        </div>
        {isLoading ? (
          <div className="relative" style={{ height: "calc(100vh - 350px)" }}>
            <CenteredLoader />
          </div>
        ) : isError ? (
          <p className="text-red-500">
            {error?.message || "Failed to fetch external tests."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {tests &&
              tests.map((test) => (
              <a
                key={test.test_link}
                href={test.test_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flip-card w-72 h-96 mx-auto group focus:outline-none focus:ring-4 focus:ring-orange-300 transition-shadow hover:shadow-2xl"
                title={`Go to test: ${test.title}`}
              >
                <div className="flip-card-inner">
                  <div className="flip-card-front flex flex-col items-center justify-center bg-gradient-to-br from-orange-100/20 to-yellow-100/10 rounded-xl shadow-lg border border-orange-300/30 group-hover:scale-105 transition-transform">
                    <img
                      src={test.image}
                      alt={test.title}
                      className="w-44 h-44 object-cover rounded-md mb-2 border-4 border-white/30 shadow-lg"
                    />
                    <h3 className="text-lg font-bold text-white drop-shadow-lg text-center px-2 mt-2 group-hover:text-orange-300 transition-colors">
                      {test.title}
                    </h3>
                  </div>
                  <div className="flip-card-back flex flex-col items-center justify-center bg-gradient-to-br from-orange-400 to-yellow-300 rounded-xl shadow-lg border border-white/20 p-4 group-hover:scale-105 transition-transform">
                    <h3 className="text-lg font-bold text-white drop-shadow-lg text-center mb-2">
                      {test.title}
                    </h3>
                    <p className="text-white text-sm text-center mb-4 line-clamp-4">
                      {test.description}
                    </p>
                    <span
                      className="inline-flex items-center gap-2 px-5 py-2 bg-white text-orange-500 font-bold rounded-lg shadow-lg hover:bg-orange-500 hover:text-white transition-colors text-base mt-2 border-2 border-orange-400 group-hover:scale-110 group-hover:shadow-xl"
                      style={{ boxShadow: "0 4px 20px rgba(255,153,51,0.15)" }}
                    >
                      Take Test <ExternalLink className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </div>
                </a>
              ))}
          </div>
        )}
      </div>
      {/* Flip card styles */}
      <style>{`
        .flip-card {
          perspective: 1000px;
        }
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s cubic-bezier(.4,2,.6,1);
          transform-style: preserve-3d;
        }
        .flip-card:hover .flip-card-inner {
          transform: rotateY(180deg);
        }
        .flip-card-front, .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 0.75rem;
        }
        .flip-card-front {
          z-index: 2;
        }
        .flip-card-back {
          transform: rotateY(180deg);
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </GlassContainer>
  );
}
