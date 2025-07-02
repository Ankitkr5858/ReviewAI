import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Star, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Send,
  Filter,
  Search,
  ChevronDown,
  Eye,
  Reply,
  Settings,
  BarChart3,
  RefreshCw,
  Trash2,
  Home,
  ArrowLeft
} from 'lucide-react';
import { useFeedback, Feedback } from '../hooks/useFeedback';
import { useNavigate } from 'react-router-dom';

const AdminFeedbackPanel: React.FC = () => {
  const navigate = useNavigate();
  const { feedbacks, updateFeedbackStatus, respondToFeedback, deleteFeedback, getFeedbackStats } = useFeedback();
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [responseText, setResponseText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responding, setResponding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const stats = getFeedbackStats();

  // Listen for new feedback submissions (REAL-TIME)
  useEffect(() => {
    const handleNewFeedback = () => {
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('feedbackSubmitted', handleNewFeedback);
    return () => window.removeEventListener('feedbackSubmitted', handleNewFeedback);
  }, []);

  // REMOVED AUTO-REFRESH - Only manual refresh now
  const statusOptions = [
    { value: 'all', label: 'All Status', count: feedbacks.length },
    { value: 'pending', label: 'Pending Review', count: stats.statusStats.pending || 0 },
    { value: 'reviewed', label: 'Under Review', count: stats.statusStats.reviewed || 0 },
    { value: 'implemented', label: 'Implemented', count: stats.statusStats.implemented || 0 },
    { value: 'rejected', label: 'Rejected', count: stats.statusStats.rejected || 0 },
  ];

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesStatus = filterStatus === 'all' || feedback.status === filterStatus;
    const matchesSearch = feedback.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.userName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'reviewed': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'implemented': return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return AlertTriangle;
      case 'reviewed': return Clock;
      case 'implemented': return CheckCircle;
      case 'rejected': return XCircle;
      default: return Clock;
    }
  };

  const handleStatusChange = async (feedbackId: string, newStatus: string) => {
    await updateFeedbackStatus(feedbackId, newStatus as any);
    setRefreshKey(prev => prev + 1);
  };

  const handleRespond = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setResponseText(feedback.response?.message || '');
    setShowResponseModal(true);
  };

  const submitResponse = async () => {
    if (!selectedFeedback || !responseText.trim()) return;

    setResponding(true);
    try {
      await respondToFeedback(selectedFeedback.id, responseText.trim());
      setShowResponseModal(false);
      setSelectedFeedback(null);
      setResponseText('');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to send response:', error);
    } finally {
      setResponding(false);
    }
  };

  const handleDelete = async (feedbackId: string) => {
    await deleteFeedback(feedbackId);
    setShowDeleteConfirm(null);
    setRefreshKey(prev => prev + 1);
  };

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

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft size={16} />
              Back to App
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🛠️ Admin Panel</h1>
              <p className="text-gray-600">Manage user feedback, respond to reviews, and track implementation status</p>
            </div>
          </div>
          <motion.button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw size={16} />
            Refresh
          </motion.button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div 
            className="bg-white p-6 rounded-lg border border-gray-200"
            key={`total-${refreshKey}`}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFeedbacks}</p>
                <p className="text-sm text-gray-600">Total Feedback</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white p-6 rounded-lg border border-gray-200"
            key={`rating-${refreshKey}`}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
                <p className="text-sm text-gray-600">Average Rating</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white p-6 rounded-lg border border-gray-200"
            key={`pending-${refreshKey}`}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, delay: 0.2 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle size={24} className="text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.statusStats.pending || 0}</p>
                <p className="text-sm text-gray-600">Pending Review</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white p-6 rounded-lg border border-gray-200"
            key={`implemented-${refreshKey}`}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, delay: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.statusStats.implemented || 0}</p>
                <p className="text-sm text-gray-600">Implemented</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {filteredFeedbacks.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <MessageSquare size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No feedback found</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No feedback has been submitted yet'
                }
              </p>
            </div>
          ) : (
            filteredFeedbacks.map((feedback, index) => {
              const StatusIcon = getStatusIcon(feedback.status);
              
              return (
                <motion.div
                  key={`${feedback.id}-${refreshKey}`}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-start gap-4">
                    {/* User Avatar */}
                    <div className="flex-shrink-0">
                      {feedback.userAvatar ? (
                        <img
                          src={feedback.userAvatar}
                          alt={feedback.userName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                          <User size={20} className="text-white" />
                        </div>
                      )}
                    </div>

                    {/* Feedback Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{feedback.userName}</h3>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              className={i < feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                            />
                          ))}
                        </div>
                        <span className="text-sm">{getCategoryEmoji(feedback.category)}</span>
                        <span className="text-sm text-gray-500">{getTimeAgo(feedback.timestamp)}</span>
                      </div>

                      <h4 className="font-medium text-gray-900 mb-2">{feedback.title}</h4>
                      <p className="text-gray-700 mb-4">{feedback.message}</p>

                      {/* Admin Response */}
                      {feedback.response && (
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded-r-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">A</span>
                            </div>
                            <span className="font-medium text-blue-900">Admin Response</span>
                            <span className="text-sm text-blue-600">{getTimeAgo(feedback.response.timestamp)}</span>
                          </div>
                          <p className="text-blue-800">{feedback.response.message}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-4">
                        {/* Status Selector */}
                        <div className="flex items-center gap-2">
                          <StatusIcon size={16} className={getStatusColor(feedback.status).split(' ')[0]} />
                          <select
                            value={feedback.status}
                            onChange={(e) => handleStatusChange(feedback.id, e.target.value)}
                            className={`text-sm border rounded-lg px-3 py-1 ${getStatusColor(feedback.status)}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Under Review</option>
                            <option value="implemented">Implemented</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>

                        {/* Respond Button */}
                        <motion.button
                          onClick={() => handleRespond(feedback)}
                          className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Reply size={14} />
                          {feedback.response ? 'Update Response' : 'Respond'}
                        </motion.button>

                        {/* Delete Button */}
                        <motion.button
                          onClick={() => setShowDeleteConfirm(feedback.id)}
                          className="flex items-center gap-2 px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Trash2 size={14} />
                          Delete
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(null)}
            >
              <motion.div
                className="bg-white rounded-lg max-w-md w-full"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Trash2 size={24} className="text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Delete Feedback</h3>
                      <p className="text-gray-600">This action cannot be undone</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-6">
                    Are you sure you want to delete this feedback? This will permanently remove it from the system.
                  </p>

                  <div className="flex gap-3">
                    <motion.button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={() => handleDelete(showDeleteConfirm)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Delete
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Response Modal */}
        <AnimatePresence>
          {showResponseModal && selectedFeedback && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResponseModal(false)}
            >
              <motion.div
                className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedFeedback.response ? 'Update Response' : 'Respond to Feedback'}
                  </h2>
                  <p className="text-gray-600 mt-1">Responding to: {selectedFeedback.title}</p>
                </div>

                {/* Original Feedback */}
                <div className="p-6 bg-gray-50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedFeedback.userName}</p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < selectedFeedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700">"{selectedFeedback.message}"</p>
                </div>

                {/* Response Form */}
                <div className="p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Response
                  </label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Write your response to this feedback..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    maxLength={1000}
                  />
                  <div className="text-xs text-gray-500 mt-1">{responseText.length}/1000 characters</div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                  <div className="flex gap-3">
                    <motion.button
                      onClick={() => setShowResponseModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={submitResponse}
                      disabled={!responseText.trim() || responding}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      whileHover={{ scale: responding ? 1 : 1.02 }}
                      whileTap={{ scale: responding ? 1 : 0.98 }}
                    >
                      {responding ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Send Response
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminFeedbackPanel;