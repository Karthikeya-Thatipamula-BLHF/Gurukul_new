import React, { useState } from 'react';
import GlassContainer from '../components/GlassContainer';
import GlassInput from '../components/GlassInput';
import GlassButton from '../components/GlassButton';
import MobileFormWrapper from '../components/MobileFormWrapper';
import MobileEnhancedInput from '../components/MobileEnhancedInput';
import { Mail, Lock, User, Phone, Search, MessageCircle } from 'lucide-react';

/**
 * Mobile Input Demo Page - Showcases all mobile input enhancements
 * This page demonstrates the comprehensive mobile input rework
 */
export default function MobileInputDemo() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    country: '',
    age: '',
    feedback: ''
  });

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Form submitted! Check console for data.');
  };

  return (
    <GlassContainer>
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Mobile Input Demo
          </h1>
          <p className="text-lg text-white/80 mb-6">
            Complete mobile input rework - Desktop layouts remain untouched
          </p>
          <div className="text-sm text-white/60 bg-white/5 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="font-medium mb-2">🎯 Mobile-Only Enhancements:</p>
            <ul className="text-left space-y-1">
              <li>• Touch-friendly 52px minimum heights</li>
              <li>• Enhanced glassmorphism styling</li>
              <li>• iOS zoom prevention (16px font-size)</li>
              <li>• Improved focus states & animations</li>
              <li>• Better accessibility & keyboard navigation</li>
              <li>• Responsive form layouts</li>
            </ul>
          </div>
        </div>

        {/* Standard Glass Inputs Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Standard Glass Inputs</h2>
          <MobileFormWrapper enhancedKeyboard={true} touchOptimized={true}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassInput
                type="text"
                placeholder="Full Name"
                icon={User}
                value={formData.name}
                onChange={handleInputChange('name')}
              />
              <GlassInput
                type="email"
                placeholder="Email Address"
                icon={Mail}
                value={formData.email}
                onChange={handleInputChange('email')}
              />
              <GlassInput
                type="tel"
                placeholder="Phone Number"
                icon={Phone}
                value={formData.phone}
                onChange={handleInputChange('phone')}
              />
              <GlassInput
                type="password"
                placeholder="Password"
                icon={Lock}
              />
            </div>
          </MobileFormWrapper>
        </div>

        {/* Enhanced Mobile Inputs Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Enhanced Mobile Inputs</h2>
          <MobileFormWrapper enhancedKeyboard={true} touchOptimized={true}>
            <div className="space-y-6">
              <MobileEnhancedInput
                type="text"
                placeholder="Search anything..."
                icon={Search}
                variant="glass"
              />
              <MobileEnhancedInput
                type="email"
                placeholder="Enhanced email input"
                icon={Mail}
                variant="form"
              />
              <MobileEnhancedInput
                type="text"
                placeholder="Chat-style input"
                icon={MessageCircle}
                variant="chat"
              />
            </div>
          </MobileFormWrapper>
        </div>

        {/* Transparent Chat Inputs Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Chat Interface Inputs</h2>
          <div className="space-y-6">
            <textarea
              className="w-full bg-transparent text-white px-4 py-3 outline-none resize-none"
              placeholder="Transparent chat textarea..."
              rows="3"
              value={formData.message}
              onChange={handleInputChange('message')}
            />
            <div className="flex items-center space-x-3">
              <textarea
                className="w-full bg-transparent text-white px-4 py-3 outline-none resize-none"
                placeholder="Multi-line chat input..."
                rows="2"
              />
              <GlassButton variant="primary">Send</GlassButton>
            </div>
          </div>
        </div>

        {/* Specialized Form Elements */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Specialized Form Elements</h2>
          <MobileFormWrapper enhancedKeyboard={true} touchOptimized={true}>
            <div className="space-y-6">
              {/* Select Dropdown */}
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">
                  Country Selection
                </label>
                <select
                  value={formData.country}
                  onChange={handleInputChange('country')}
                  className="w-full px-4 py-3 bg-white/15 border border-white/20 rounded-lg text-white focus:outline-none"
                >
                  <option value="">Select Country</option>
                  <option value="us">United States</option>
                  <option value="uk">United Kingdom</option>
                  <option value="ca">Canada</option>
                  <option value="au">Australia</option>
                  <option value="in">India</option>
                </select>
              </div>

              {/* Number Input */}
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">
                  Age
                </label>
                <input
                  type="number"
                  placeholder="Enter your age"
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={handleInputChange('age')}
                  className="w-full px-4 py-3 bg-white/15 border border-white/20 rounded-lg text-white focus:outline-none"
                />
              </div>

              {/* Large Textarea */}
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">
                  Feedback
                </label>
                <textarea
                  placeholder="Share your detailed feedback..."
                  rows="6"
                  value={formData.feedback}
                  onChange={handleInputChange('feedback')}
                  className="w-full px-4 py-3 bg-white/15 border border-white/20 rounded-lg text-white focus:outline-none resize-vertical"
                />
              </div>
            </div>
          </MobileFormWrapper>
        </div>

        {/* Colored Inputs (Agent Simulator Style) */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Colored Specialized Inputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Financial Input
              </label>
              <input
                type="text"
                placeholder="Blue themed input"
                className="w-full bg-blue-600/30 border border-blue-500/40 rounded-lg py-3 px-4 text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Wellness Input
              </label>
              <input
                type="text"
                placeholder="Orange themed input"
                className="w-full bg-orange-600/30 border border-orange-500/40 rounded-lg py-3 px-4 text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Education Input
              </label>
              <input
                type="text"
                placeholder="Green themed input"
                className="w-full bg-green-600/30 border border-green-500/40 rounded-lg py-3 px-4 text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Button Showcase */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Enhanced Mobile Buttons</h2>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
            <GlassButton variant="primary" className="min-w-48">
              Primary Button
            </GlassButton>
            <GlassButton variant="secondary" className="min-w-48">
              Secondary Button
            </GlassButton>
            <button
              style={{
                background: 'linear-gradient(135deg, rgba(255, 153, 51, 0.8), rgba(255, 215, 0, 0.6))',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '12px',
                padding: '12px 24px',
                color: 'white',
                fontWeight: '600',
                minWidth: '192px'
              }}
            >
              Gradient Button
            </button>
          </div>
        </div>

        {/* Form Submission */}
        <div className="text-center">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-white/60 text-sm">
              <p>All form data will be logged to console on submission</p>
            </div>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <GlassButton type="submit" variant="primary" className="min-w-48">
                Submit Form
              </GlassButton>
              <GlassButton 
                type="button" 
                variant="secondary" 
                className="min-w-48"
                onClick={() => setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  message: '',
                  country: '',
                  age: '',
                  feedback: ''
                })}
              >
                Clear Form
              </GlassButton>
            </div>
          </form>
        </div>

        {/* Mobile-Only Message */}
        <div className="mt-12 text-center">
          <div className="md:hidden bg-green-500/20 border border-green-500/40 rounded-lg p-4">
            <p className="text-green-300 font-medium">
              🎉 You're viewing this on mobile! All enhancements are active.
            </p>
          </div>
          <div className="hidden md:block bg-blue-500/20 border border-blue-500/40 rounded-lg p-4">
            <p className="text-blue-300 font-medium">
              💻 You're on desktop - mobile enhancements don't affect this view.
            </p>
            <p className="text-blue-200 text-sm mt-2">
              Resize to mobile width (&lt; 768px) to see mobile enhancements.
            </p>
          </div>
        </div>
      </div>
    </GlassContainer>
  );
}