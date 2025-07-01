import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitMerge,
  GitPullRequest,
  AlertTriangle,
  CheckCircle,
  GitBranch,
  Clock,
  Wand2,
  ExternalLink,
  X,
  Calendar,
  FileText,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RecentActivity as ActivityType } from '../hooks/useGitHubIntegration';

interface RecentActivityProps {
  activities: ActivityType[];
}

interface ActivityDetailModalProps {
  activity: ActivityType;
  onClose: () => void;
}

const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({ activity, onClose }) => {
  const navigate = useNavigate();

  const handleViewRepository = () => {
    if (activity.repositoryUrl) {
      window.open(activity.repositoryUrl, '_blank');
    }
  };

  const handleStartReview = () => {
    if (activity.details?.repository) {
      navigate('/test', { 
        state: { 
          selectedRepo: activity.details.repository 
        } 
      });
      onClose();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-lg max-w-md w-full"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black rounded-lg">
                {activity.type === 'review' && <CheckCircle size={20} className="text-white" />}
                {activity.type === 'fix' && <Wand2 size={20} className="text-white" />}
                {activity.type === 'branch' && <GitBranch size={20} className="text-white" />}
                {activity.type === 'merge' && <GitMerge size={20} className="text-white" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Activity Details</h2>
                <p className="text-sm text-gray-600">{activity.repository}</p>
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

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Activity Message */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Activity</h3>
              <p className="text-gray-900">{activity.message}</p>
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={16} />
              <span>{activity.time}</span>
            </div>

            {/* Activity-specific details */}
            {activity.details?.type === 'review' && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Review Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Issues Found:</span>
                    <span className="font-medium ml-2">{activity.details.issuesFound}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Issues Resolved:</span>
                    <span className="font-medium ml-2">{activity.details.issuesResolved}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activity.details.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {activity.details.status === 'completed' ? 'Completed' : 'In Progress'}
                  </span>
                </div>
              </div>
            )}

            {activity.details?.type === 'fix' && (
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">AI Fix Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-700">Issues Fixed:</span>
                    <span className="font-medium ml-2">{activity.details.issuesFixed}</span>
                  </div>
                  <div>
                    <span className="text-green-700">Files Updated:</span>
                    <span className="font-medium ml-2">{activity.details.filesFixed?.length || 0}</span>
                  </div>
                </div>
                {activity.details.filesFixed && activity.details.filesFixed.length > 0 && (
                  <div className="mt-2">
                    <span className="text-green-700 text-xs">Files:</span>
                    <div className="mt-1 text-xs text-green-600">
                      {activity.details.filesFixed.slice(0, 3).map((file: string, index: number) => (
                        <div key={index}>📄 {file}</div>
                      ))}
                      {activity.details.filesFixed.length > 3 && (
                        <div>... and {activity.details.filesFixed.length - 3} more</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activity.details?.type === 'repository_update' && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Repository Info</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-700">Language:</span>
                    <span className="font-medium ml-2">{activity.details.language || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-gray-700">Open Issues:</span>
                    <span className="font-medium ml-2">{activity.details.openIssues}</span>
                  </div>
                  <div>
                    <span className="text-gray-700">Stars:</span>
                    <span className="font-medium ml-2">{activity.details.stars}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex gap-3">
            {activity.repositoryUrl && (
              <motion.button
                onClick={handleViewRepository}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ExternalLink size={16} />
                View Repository
              </motion.button>
            )}
            {(activity.details?.type === 'review' || activity.details?.type === 'repository_update') && (
              <motion.button
                onClick={handleStartReview}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Settings size={16} />
                Start Review
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'merge':
        return GitMerge;
      case 'review':
        return CheckCircle;
      case 'issue':
        return AlertTriangle;
      case 'pr':
        return GitPullRequest;
      case 'branch':
        return GitBranch;
      case 'schedule':
        return Clock;
      case 'fix':
        return Wand2;
      default:
        return Clock;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'merge':
        return 'text-green-600 bg-green-50';
      case 'review':
        return 'text-blue-600 bg-blue-50';
      case 'issue':
        return 'text-orange-600 bg-orange-50';
      case 'pr':
        return 'text-purple-600 bg-purple-50';
      case 'branch':
        return 'text-gray-600 bg-gray-50';
      case 'schedule':
        return 'text-indigo-600 bg-indigo-50';
      case 'fix':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleActivityClick = (activity: ActivityType) => {
    if (activity.clickable) {
      setSelectedActivity(activity);
    }
  };

  const handleViewAllActivity = () => {
    setShowAll(true);
  };

  const displayedActivities = showAll ? activities : activities.slice(0, 6);

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
        
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock size={32} className="text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No recent activity</p>
            <p className="text-sm text-gray-400">Activity will appear here as you use ReviewAI</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedActivities.map((activity, index) => {
              const ActivityIcon = getActivityIcon(activity.type);
              
              return (
                <motion.div
                  key={activity.id}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                    activity.clickable 
                      ? 'hover:bg-gray-50 cursor-pointer' 
                      : ''
                  }`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  onClick={() => handleActivityClick(activity)}
                  whileHover={activity.clickable ? { scale: 1.01 } : {}}
                >
                  <div className={`p-2 rounded-lg ${getActivityColor(activity.type)} flex-shrink-0`}>
                    <ActivityIcon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium">{activity.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500">{activity.time}</p>
                      {activity.repository && (
                        <>
                          <span className="text-xs text-gray-300">•</span>
                          <p className="text-xs text-gray-500">{activity.repository}</p>
                        </>
                      )}
                      {activity.clickable && (
                        <>
                          <span className="text-xs text-gray-300">•</span>
                          <p className="text-xs text-blue-500">Click for details</p>
                        </>
                      )}
                    </div>
                  </div>
                  {activity.clickable && (
                    <ExternalLink size={14} className="text-gray-400 flex-shrink-0" />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {!showAll && activities.length > 6 && (
          <motion.button
            onClick={handleViewAllActivity}
            className="w-full mt-4 py-2 text-sm text-gray-600 hover:text-gray-900 border-t border-gray-200 pt-4 cursor-pointer"
            whileHover={{ scale: 1.02 }}
          >
            View All Activity ({activities.length} total)
          </motion.button>
        )}

        {showAll && (
          <motion.button
            onClick={() => setShowAll(false)}
            className="w-full mt-4 py-2 text-sm text-gray-600 hover:text-gray-900 border-t border-gray-200 pt-4 cursor-pointer"
            whileHover={{ scale: 1.02 }}
          >
            Show Less
          </motion.button>
        )}
      </div>

      {/* Activity Detail Modal */}
      <AnimatePresence>
        {selectedActivity && (
          <ActivityDetailModal
            activity={selectedActivity}
            onClose={() => setSelectedActivity(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default RecentActivity;