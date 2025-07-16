import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, Users } from 'lucide-react';
import CalendlyIntegration from './CalendlyIntegration';

const BookCallSection: React.FC = () => {
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
            </div>
          </motion.div>

          {/* Right side - Calendly */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
            id="book-call"
          >
            <CalendlyIntegration />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BookCallSection;