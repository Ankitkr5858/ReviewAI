import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, User, Mail, Phone, MessageSquare } from 'lucide-react';
import CalendlyIntegration from './CalendlyIntegration';

const BookCallSection: React.FC = () => {
  const [showCalendly, setShowCalendly] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowCalendly(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Book a <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Demo Call</span> with Founder
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Schedule a personalized demo to see how ReviewAI can transform your development workflow and improve your code quality
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Founder info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-gradient-to-br from-slate-700 to-slate-800 text-white p-8 rounded-2xl shadow-xl"
          >
            <div className="text-center mb-8">
              <div className="w-32 h-32 bg-white/10 rounded-full mx-auto mb-6 flex items-center justify-center">
                <img
                  src="/DSC_0222.jpg"
                  alt="Ankit Kumar"
                  className="w-28 h-28 rounded-full object-cover"
                  onError={(e) => {
                    // Fallback if image doesn't load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling!.style.display = 'flex';
                  }}
                />
                <div className="w-28 h-28 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full items-center justify-center text-white font-bold text-3xl hidden">
                  AK
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-2">Ankit Kumar</h3>
              <p className="text-slate-300 mb-4 text-lg">Founder & CEO, ReviewAI</p>
            </div>

            <div className="space-y-6">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Clock size={20} className="text-blue-400" />
                  <span className="font-medium text-lg">30 Minute Session</span>
                </div>
                <p className="text-slate-300 pl-8">
                  In-depth discussion about your development workflow and how ReviewAI can help
                </p>
              </div>

              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle size={20} className="text-green-400" />
                  <span className="font-medium text-lg">What to Expect</span>
                </div>
                <ul className="text-slate-300 space-y-2 pl-8">
                  <li>• Personalized product walkthrough</li>
                  <li>• Custom integration strategy</li>
                  <li>• Pricing and ROI discussion</li>
                  <li>• Technical questions answered</li>
                </ul>
              </div>

              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar size={20} className="text-purple-400" />
                  <span className="font-medium text-lg">Availability</span>
                </div>
                <p className="text-slate-300 pl-8">
                  Monday to Friday, 9:00 AM - 6:00 PM IST
                </p>
              </div>

              <div className="pt-4">
                <p className="text-slate-300 text-sm text-center">
                  For urgent inquiries, email directly at{' '}
                  <a href="mailto:ankitkr5858@gmail.com" className="text-blue-400 hover:underline">
                    ankitkr5858@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right side - Calendly or Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            {showCalendly ? (
              <CalendlyIntegration 
                url="https://calendly.com/ankitkr5858/30min" 
                prefill={{
                  name: formData.name,
                  email: formData.email,
                  customAnswers: {
                    a1: formData.phone,
                    a2: formData.message
                  }
                }}
              />
            ) : (
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Schedule Your Demo</h3>
                
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What would you like to discuss? (Optional)
                    </label>
                    <div className="relative">
                      <MessageSquare size={20} className="absolute left-3 top-3 text-gray-400" />
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Tell us about your project or specific questions..."
                      />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Continue to Calendar
                  </motion.button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BookCallSection;