import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Star, ThumbsUp, Clock, User, ChevronRight, Award, TrendingUp, Users, Target, ChevronLeft } from 'lucide-react';
import { useFeedback } from '../hooks/useFeedback';
import FeedbackModal from './FeedbackModal';

interface FeedbackSectionProps {
  showInDashboard?: boolean;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({ showInDashboard = false }) => {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { feedbacks, getFeedbackStats, getPaginatedFeedbacks, markHelpful } = useFeedback();
  const [refreshKey, setRefreshKey] = useState(0);

  const stats = getFeedbackStats();
  const feedbacksPerPage = showInDashboard ? 3 : 5;
  const paginatedData = getPaginatedFeedbacks(currentPage, feedbacksPerPage);

  // Listen for new feedback submissions for REAL-TIME updates
  useEffect(() => {
    const handleNewFeedback = () => {
      setRefreshKey(prev => prev + 1);
    };

    const handleStorageChange = () => {
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('feedbackSubmitted', handleNewFeedback);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('feedbackSubmitted', handleNewFeedback);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const getTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'feature-request': return '✨';
      case 'bug-report': return '🐛';
      case 'improvement': return '🚀';
      default: return '💬';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return 'text-green-600 bg-green-50';
      case 'reviewed': return 'text-blue-600 bg-blue-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-orange-600 bg-orange-50';
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (showInDashboard) {
    // Compact version for dashboard
    return (
      <>
        <div className="bg-white rounded-lg border border-gray-200 p-6" key={`dashboard-${refreshKey}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Community Feedback</h3>
            <motion.button
              onClick={() => setShowFeedbackModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-colors text-sm"
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
            >
              <MessageSquare size={16} />
              Give Feedback
            </motion.button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-900">{stats.totalFeedbacks}</div>
              <div className="text-xs text-gray-600">Total Feedback</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-1">
                <span className="text-xl font-bold text-gray-900">{stats.averageRating}</span>
                <Star size={16} className="text-yellow-400 fill-current" />
              </div>
              <div className="text-xs text-gray-600">Average Rating</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-900">{stats.statusStats.implemented || 0}</div>
              <div className="text-xs text-gray-600">Implemented</div>
            </div>
          </div>

          {/* Recent Feedbacks */}
          <div className="space-y-3">
            {paginatedData.feedbacks.length === 0 ? (
              <div className="text-center py-6">
                <MessageSquare size={32} className="text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No feedback yet</p>
                <p className="text-sm text-gray-400">Be the first to share your thoughts!</p>
              </div>
            ) : (
              paginatedData.feedbacks.map((feedback) => (
                <motion.div
                  key={`${feedback.id}-${refreshKey}`}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  whileHover={{ 
                    scale: 1.01, 
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" 
                  }}
                  transition={{ duration: 0.1 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={i < feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{getCategoryEmoji(feedback.category)}</span>
                        <span className="font-medium text-gray-900 text-sm truncate">{feedback.title}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(feedback.status)}`}>
                          {feedback.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{feedback.message}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>{feedback.userName}</span>
                        <span>•</span>
                        <span>{getTimeAgo(feedback.timestamp)}</span>
                        {feedback.helpful > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp size={10} />
                              {feedback.helpful}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
        />
      </>
    );
  }

  // PROFESSIONAL FULL VERSION FOR LANDING PAGE
  return (
    <>
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50/30" key={`landing-${refreshKey}`}>
        <div className="max-w-7xl mx-auto px-6">
          {/* PROFESSIONAL HEADER */}
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-5xl font-bold text-gray-900 mb-6">
                Trusted by developers
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> worldwide</span>
              </h2>
              <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                Real feedback from our community of developers who trust ReviewAI with their code quality and development workflow
              </p>
              
              <motion.button
                onClick={() => setShowFeedbackModal(true)}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-xl"
                whileHover={{ 
                  scale: 1.05, 
                  y: -2, 
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                <MessageSquare size={20} />
                Share Your Experience
              </motion.button>
            </motion.div>
          </div>

          {/* PROFESSIONAL STATS OVERVIEW */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
            <motion.div 
              className="text-center p-8 bg-white rounded-2xl border border-gray-200 shadow-sm"
              whileHover={{ 
                scale: 1.02, 
                y: -5, 
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
              }}
              transition={{ duration: 0.1 }}
            >
              <Users size={32} className="text-blue-600 mx-auto mb-4" />
              <div className="text-4xl font-bold text-gray-900 mb-2">{stats.totalFeedbacks}</div>
              <div className="text-gray-600 font-medium">Developer Reviews</div>
            </motion.div>

            <motion.div 
              className="text-center p-8 bg-white rounded-2xl border border-gray-200 shadow-sm"
              whileHover={{ 
                scale: 1.02, 
                y: -5, 
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
              }}
              transition={{ duration: 0.1 }}
            >
              <Star size={32} className="text-yellow-500 mx-auto mb-4" />
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-4xl font-bold text-gray-900">{stats.averageRating}</span>
                <Star size={24} className="text-yellow-400 fill-current" />
              </div>
              <div className="text-gray-600 font-medium">Average Rating</div>
            </motion.div>

            <motion.div 
              className="text-center p-8 bg-white rounded-2xl border border-gray-200 shadow-sm"
              whileHover={{ 
                scale: 1.02, 
                y: -5, 
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
              }}
              transition={{ duration: 0.1 }}
            >
              <Award size={32} className="text-green-600 mx-auto mb-4" />
              <div className="text-4xl font-bold text-gray-900 mb-2">{stats.statusStats.implemented || 0}</div>
              <div className="text-gray-600 font-medium">Features Implemented</div>
            </motion.div>

            <motion.div 
              className="text-center p-8 bg-white rounded-2xl border border-gray-200 shadow-sm"
              whileHover={{ 
                scale: 1.02, 
                y: -5, 
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
              }}
              transition={{ duration: 0.1 }}
            >
              <TrendingUp size={32} className="text-purple-600 mx-auto mb-4" />
              <div className="text-4xl font-bold text-gray-900 mb-2">{stats.statusStats.reviewed || 0}</div>
              <div className="text-gray-600 font-medium">Under Review</div>
            </motion.div>
          </div>

          {/* PROFESSIONAL FEEDBACK LIST WITH PAGINATION */}
          <div className="space-y-8">
            {paginatedData.feedbacks.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <MessageSquare size={64} className="text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">No feedback yet</h3>
                <p className="text-gray-500 text-lg">Be the first to share your experience with ReviewAI!</p>
              </div>
            ) : (
              <>
                {paginatedData.feedbacks.map((feedback, index) => (
                  <motion.div
                    key={`${feedback.id}-${refreshKey}`}
                    className="bg-white border border-gray-200 rounded-2xl p-8 transition-all"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ 
                      scale: 1.01, 
                      y: -5, 
                      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
                    }}
                  >
                    <div className="flex items-start gap-6">
                      {/* User Avatar */}
                      <div className="flex-shrink-0">
                        {feedback.userAvatar ? (
                          <img
                            src={feedback.userAvatar}
                            alt={feedback.userName}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                            <User size={24} className="text-white" />
                          </div>
                        )}
                      </div>

                      {/* Feedback Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <h4 className="text-xl font-semibold text-gray-900">{feedback.userName}</h4>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={20}
                                className={i < feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                          <span className="text-lg">{getCategoryEmoji(feedback.category)}</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(feedback.status)}`}>
                            {feedback.status}
                          </span>
                        </div>

                        <h5 className="text-lg font-medium text-gray-900 mb-3">{feedback.title}</h5>
                        <p className="text-gray-700 mb-4 leading-relaxed text-lg">"{feedback.message}"</p>

                        {/* Admin Response */}
                        {feedback.response && (
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-4 rounded-r-lg">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-bold">R</span>
                              </div>
                              <span className="font-semibold text-blue-900">ReviewAI Team</span>
                              <span className="text-sm text-blue-600">{getTimeAgo(feedback.response.timestamp)}</span>
                            </div>
                            <p className="text-blue-800 leading-relaxed">{feedback.response.message}</p>
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            <span className="flex items-center gap-2">
                              <Clock size={16} />
                              {getTimeAgo(feedback.timestamp)}
                            </span>
                            <motion.button
                              onClick={() => markHelpful(feedback.id)}
                              className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              transition={{ duration: 0.1 }}
                            >
                              <ThumbsUp size={16} />
                              Helpful ({feedback.helpful})
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* PAGINATION */}
                {paginatedData.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-12">
                    <motion.button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
                      whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
                      transition={{ duration: 0.1 }}
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </motion.button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: paginatedData.totalPages }, (_, i) => i + 1).map((page) => (
                        <motion.button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded-lg font-medium ${
                            page === currentPage
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ duration: 0.1 }}
                        >
                          {page}
                        </motion.button>
                      ))}
                    </div>

                    <motion.button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === paginatedData.totalPages}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: currentPage === paginatedData.totalPages ? 1 : 1.05 }}
                      whileTap={{ scale: currentPage === paginatedData.totalPages ? 1 : 0.95 }}
                      transition={{ duration: 0.1 }}
                    >
                      Next
                      <ChevronRight size={16} />
                    </motion.button>
                  </div>
                )}

                {/* Pagination Info */}
                <div className="text-center text-sm text-gray-500 mt-4">
                  Showing {((currentPage - 1) * feedbacksPerPage) + 1} to {Math.min(currentPage * feedbacksPerPage, paginatedData.totalFeedbacks)} of {paginatedData.totalFeedbacks} reviews
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </>
  );
};

export default FeedbackSection;