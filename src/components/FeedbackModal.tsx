import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { useFeedback } from '../hooks/useFeedback';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<'feature-request' | 'bug-report' | 'general' | 'improvement'>('general');
  const [submitted, setSubmitted] = useState(false);
  
  const { submitFeedback, loading } = useFeedback();

  const categories = [
    { value: 'general', label: '💬 General Feedback', description: 'Share your overall experience' },
    { value: 'feature-request', label: '✨ Feature Request', description: 'Suggest new features' },
    { value: 'bug-report', label: '🐛 Bug Report', description: 'Report issues or bugs' },
    { value: 'improvement', label: '🚀 Improvement', description: 'Suggest improvements' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0 || !title.trim() || !message.trim()) {
      alert('Please fill in all fields and provide a rating');
      return;
    }

    const result = await submitFeedback({
      rating,
      title: title.trim(),
      message: message.trim(),
      category,
    });

    if (result.success) {
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        // Reset form
        setRating(0);
        setTitle('');
        setMessage('');
        setCategory('general');
        setSubmitted(false);
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          // Success State
          <div className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle size={32} className="text-green-600" />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
            <p className="text-gray-600 mb-4">
              Your feedback has been submitted successfully. We appreciate your input!
            </p>
            <p className="text-sm text-gray-500">
              We'll review your feedback and may reach out if we need more information.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageSquare size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Share Your Feedback</h2>
                    <p className="text-gray-600">Help us improve ReviewAI</p>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} />
                </motion.button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How would you rate your experience? *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-1"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Star
                        size={32}
                        className={`transition-colors ${
                          star <= (hoveredRating || rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </motion.button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-3 text-sm text-gray-600">
                      {rating === 1 && '😞 Poor'}
                      {rating === 2 && '😐 Fair'}
                      {rating === 3 && '🙂 Good'}
                      {rating === 4 && '😊 Very Good'}
                      {rating === 5 && '🤩 Excellent'}
                    </span>
                  )}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What type of feedback is this? *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <motion.button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value as any)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        category === cat.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="font-medium text-gray-900 mb-1">{cat.label}</div>
                      <div className="text-sm text-gray-600">{cat.description}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary of your feedback"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={100}
                />
                <div className="text-xs text-gray-500 mt-1">{title.length}/100 characters</div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please provide detailed feedback..."
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  maxLength={1000}
                />
                <div className="text-xs text-gray-500 mt-1">{message.length}/1000 characters</div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={loading || rating === 0 || !title.trim() || !message.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit Feedback
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default FeedbackModal;