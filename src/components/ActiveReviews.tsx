import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, AlertTriangle, GitBranch, ExternalLink, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ActiveReview } from '../hooks/useGitHubIntegration';

interface ActiveReviewsProps {
  reviews: ActiveReview[];
}

const ActiveReviews: React.FC<ActiveReviewsProps> = ({ reviews }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 5;

  // Calculate pagination
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const endIndex = startIndex + reviewsPerPage;
  const currentReviews = reviews.slice(startIndex, endIndex);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'in-progress':
        return 'text-blue-600 bg-blue-50';
      case 'review-required':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'in-progress':
        return Clock;
      case 'review-required':
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'completed';
      case 'in-progress':
        return 'in progress';
      case 'review-required':
        return 'review required';
      default:
        return status;
    }
  };

  const getActionText = (review: ActiveReview) => {
    switch (review.status) {
      case 'completed':
        return 'Click to view details';
      case 'in-progress':
        return 'Click to continue review';
      case 'review-required':
        return 'Click to start review';
      default:
        return 'Click to review';
    }
  };

  const handleReviewClick = (review: ActiveReview) => {
    // Navigate to test review page with review data for resuming
    if (review.status === 'in-progress' || review.status === 'review-required') {
      navigate('/test', { 
        state: { 
          selectedRepo: review.reviewData?.repository || `owner/${review.repository}`,
          resumeReview: review.status === 'in-progress',
          reviewData: review.reviewData
        } 
      });
    } else if (review.status === 'completed') {
      // For completed reviews, could navigate to a review history page or show completion details
      navigate('/test', { 
        state: { 
          selectedRepo: review.reviewData?.repository || `owner/${review.repository}`,
          showCompleted: true,
          reviewData: review.reviewData
        } 
      });
    }
  };

  const handleViewAllClick = () => {
    navigate('/repositories');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Active Reviews</h3>
        <motion.button
          onClick={handleViewAllClick}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 cursor-pointer"
          whileHover={{ 
            scale: 1.05, 
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" 
          }}
          transition={{ duration: 0.1 }}
        >
          View All
          <ExternalLink size={14} />
        </motion.button>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <Clock size={32} className="text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No active reviews</p>
          <p className="text-sm text-gray-400">Reviews will appear here when you start them</p>
          <motion.button
            onClick={() => navigate('/test')}
            className="mt-4 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-colors mx-auto cursor-pointer"
            whileHover={{ 
              scale: 1.05, 
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
          >
            <Play size={16} />
            Start Review
          </motion.button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {currentReviews.map((review, index) => {
              const StatusIcon = getStatusIcon(review.status);
              
              return (
                <motion.div
                  key={review.id}
                  className="border border-gray-200 rounded-xl p-4 transition-all cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ 
                    scale: 1.01, 
                    y: -2, 
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
                  }}
                  onClick={() => handleReviewClick(review)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getStatusColor(review.status)}`}>
                        <StatusIcon size={16} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{review.repository}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <GitBranch size={14} />
                          <span>{review.branch}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-gray-500">{review.timeAgo}</span>
                      <span className={`mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                        {getStatusText(review.status)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      {review.status === 'completed' 
                        ? review.issues === 0 
                          ? 'All issues resolved' 
                          : `${review.issues} ${review.issues === 1 ? 'issue' : 'issues'} were found`
                        : review.status === 'in-progress'
                        ? `${review.issues} ${review.issues === 1 ? 'issue' : 'issues'} remaining`
                        : `${review.issues} ${review.issues === 1 ? 'issue' : 'issues'} found`
                      }
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {review.progress}%
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        review.status === 'completed' 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                          : 'bg-gradient-to-r from-blue-600 to-purple-600'
                      }`}
                      style={{ width: `${review.progress}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${review.progress}%` }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                    />
                  </div>

                  {/* Action hint */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {getActionText(review)}
                    </span>
                    <ExternalLink size={12} className="text-gray-400" />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1}-{Math.min(endIndex, reviews.length)} of {reviews.length} reviews
              </div>
              
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  whileHover={{ 
                    scale: currentPage === 1 ? 1 : 1.05, 
                    boxShadow: currentPage === 1 ? "" : "0 4px 6px -1px rgba(0, 0, 0, 0.1)" 
                  }}
                  whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
                  transition={{ duration: 0.1 }}
                >
                  <ChevronLeft size={16} />
                </motion.button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <motion.button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium cursor-pointer ${
                        page === currentPage
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" 
                      }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                    >
                      {page}
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  whileHover={{ 
                    scale: currentPage === totalPages ? 1 : 1.05, 
                    boxShadow: currentPage === totalPages ? "" : "0 4px 6px -1px rgba(0, 0, 0, 0.1)" 
                  }}
                  whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
                  transition={{ duration: 0.1 }}
                >
                  <ChevronRight size={16} />
                </motion.button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ActiveReviews;