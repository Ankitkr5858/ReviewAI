import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  GitBranch,
  Clock,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Filter,
  RefreshCw,
  Play,
  ChevronDown,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGitHubIntegration } from '../hooks/useGitHubIntegration';
import SubscriptionModal from './SubscriptionModal';
import Header from './Header';
import OverlaySpinner from './OverlaySpinner';

const Repositories: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { repositories, loading, refreshData } = useGitHubIntegration();

  const statusOptions = [
    { value: 'all', label: 'All Status', icon: Filter, color: 'text-gray-600' },
    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-green-600', description: 'All issues resolved by ReviewAI' },
    { value: 'active', label: 'Active', icon: CheckCircle, color: 'text-blue-600', description: 'Repository is healthy with no critical issues' },
    { value: 'review-required', label: 'Review Required', icon: Clock, color: 'text-orange-600', description: 'Has open issues that need attention' },
    { value: 'needs-attention', label: 'Needs Attention', icon: AlertTriangle, color: 'text-red-600', description: 'Has critical issues or high number of open issues (>10)' }
  ];

  const getStatusFromRepo = (repo: any) => {
    // CRITICAL: Check if this repository has been reviewed and completed by ReviewAI
    const reviewHistory = JSON.parse(localStorage.getItem('review_history') || '[]');
    const fixHistory = JSON.parse(localStorage.getItem('fix_history') || '[]');
    
    // Find the most recent review for this repository
    const recentReview = reviewHistory
      .filter((r: any) => r.repository === repo.full_name)
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
    // Check if there are any unresolved issues
    const unresolvedKey = `unresolved_issues_${repo.full_name}`;
    const unresolvedIssues = JSON.parse(localStorage.getItem(unresolvedKey) || '[]');
    
    // Check if this repo has been fixed by ReviewAI
    const hasBeenFixed = fixHistory.some((f: any) => f.repository === repo.full_name);
    
    if (recentReview) {
      const reviewDate = new Date(recentReview.timestamp);
      const hoursSinceReview = (Date.now() - reviewDate.getTime()) / (1000 * 60 * 60);
      
      // If reviewed recently and no unresolved issues, mark as completed
      if (unresolvedIssues.length === 0 && (recentReview.result?.issuesFound === 0 || hasBeenFixed)) {
        return 'completed';
      }
      
      // If has unresolved issues but was reviewed recently, mark as in progress
      if (unresolvedIssues.length > 0 && hoursSinceReview < 24) {
        return 'review-required';
      }
    }
    
    // Fallback to GitHub issue count for repositories not yet reviewed
    if (repo.open_issues_count > 10) return 'needs-attention';
    if (repo.open_issues_count > 0) return 'review-required';
    return 'active';
  };

  const getResolvedIssuesCount = (repo: any) => {
    // Get the count of issues that have been resolved by ReviewAI
    const fixHistory = JSON.parse(localStorage.getItem('fix_history') || '[]');
    const repoFixes = fixHistory.filter((f: any) => f.repository === repo.full_name);
    
    return repoFixes.reduce((total: number, fix: any) => total + (fix.issuesFixed || 0), 0);
  };

  const getOpenIssuesCount = (repo: any) => {
    // Get the actual count of unresolved issues tracked by ReviewAI
    const unresolvedKey = `unresolved_issues_${repo.full_name}`;
    const unresolvedIssues = JSON.parse(localStorage.getItem(unresolvedKey) || '[]');
    
    // If we have ReviewAI data, use that; otherwise fall back to GitHub count
    return unresolvedIssues.length > 0 ? unresolvedIssues.length : repo.open_issues_count;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'active':
        return 'text-blue-600 bg-blue-50';
      case 'review-required':
        return 'text-orange-600 bg-orange-50';
      case 'needs-attention':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'active':
        return CheckCircle;
      case 'review-required':
        return Clock;
      case 'needs-attention':
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const filteredRepos = repositories.filter(repo => {
    const matchesSearch = repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const status = getStatusFromRepo(repo);
    const matchesFilter = filter === 'all' || status === filter;
    return matchesSearch && matchesFilter;
  });

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleRepositoryClick = (repo: any) => {
    navigate('/test', { state: { selectedRepo: repo.full_name } });
  };

  // FIXED: Handle refresh with overlay spinner
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
      // Add a small delay to show the spinner
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setRefreshing(false);
    }
  };

  // FIXED: Handle sync with overlay spinner
  const handleSync = async () => {
    setSyncing(true);
    try {
      await refreshData();
      // Add a small delay to show the spinner
      await new Promise(resolve => setTimeout(resolve, 1500));
    } finally {
      setSyncing(false);
    }
  };

  const selectedFilterOption = statusOptions.find(option => option.value === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* FIXED HEADER */}
      <Header 
        onMenuClick={() => {}} 
        onSubscriptionClick={() => setShowSubscriptionModal(true)}
      />

      {/* OVERLAY SPINNERS */}
      <OverlaySpinner 
        isVisible={refreshing} 
        text="Refreshing repositories..." 
      />
      <OverlaySpinner 
        isVisible={syncing} 
        text="Syncing repositories..." 
      />

      {/* CENTERED CONTENT WITH EQUAL MARGINS - LIKE LANDING PAGE */}
      <div className="flex justify-center px-6 py-6">
        <div className="w-full max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Repositories</h1>
              <p className="text-gray-600">
                Manage your connected repositories ({repositories.length} total)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                onClick={handleRefresh}
                disabled={loading || refreshing || syncing}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                <RefreshCw size={16} className={(loading || refreshing) ? 'animate-spin' : ''} />
                Refresh
              </motion.button>
              <motion.button
                onClick={handleSync}
                disabled={loading || refreshing || syncing}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 cursor-pointer"
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                <Plus size={18} />
                Sync Repositories
              </motion.button>
            </div>
          </motion.div>

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search repositories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Beautiful Status Dropdown */}
              <div className="relative">
                <motion.button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer min-w-[180px] justify-between"
                  whileHover={{ 
                    scale: 1.02, 
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" 
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                >
                  <div className="flex items-center gap-2">
                    {selectedFilterOption && (
                      <selectedFilterOption.icon size={16} className={selectedFilterOption.color} />
                    )}
                    <span className="font-medium text-gray-900">
                      {selectedFilterOption?.label || 'All Status'}
                    </span>
                  </div>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {showFilterDropdown && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowFilterDropdown(false)}
                      />
                      
                      {/* Dropdown */}
                      <motion.div
                        className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="p-2">
                          {statusOptions.map((option) => (
                            <motion.button
                              key={option.value}
                              onClick={() => {
                                setFilter(option.value);
                                setShowFilterDropdown(false);
                              }}
                              className={`w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left ${
                                filter === option.value ? 'bg-gray-100' : ''
                              }`}
                              whileHover={{ 
                                scale: 1.01, 
                                boxShadow: "0 2px 4px -1px rgba(0, 0, 0, 0.1)" 
                              }}
                              whileTap={{ scale: 0.99 }}
                              transition={{ duration: 0.1 }}
                            >
                              <option.icon size={18} className={`${option.color} mt-0.5 flex-shrink-0`} />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{option.label}</div>
                                {option.description && (
                                  <div className="text-sm text-gray-500 mt-1">{option.description}</div>
                                )}
                              </div>
                              {filter === option.value && (
                                <CheckCircle size={16} className="text-blue-600 mt-0.5" />
                              )}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Repository Grid */}
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {filteredRepos.map((repo, index) => {
              const status = getStatusFromRepo(repo);
              const StatusIcon = getStatusIcon(status);
              const openIssues = getOpenIssuesCount(repo);
              const resolvedIssues = getResolvedIssuesCount(repo);
              
              return (
                <motion.div
                  key={repo.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 transition-all cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ 
                    scale: 1.02, 
                    y: -5, 
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
                  }}
                  onClick={() => handleRepositoryClick(repo)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                        <GitBranch size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{repo.name}</h3>
                        <p className="text-sm text-gray-600">
                          {repo.description || 'No description available'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        whileHover={{ 
                          scale: 1.1, 
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" 
                        }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ duration: 0.1 }}
                      >
                        <ExternalLink size={16} className="text-gray-500" />
                      </motion.a>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getStatusColor(status)}`}>
                      <StatusIcon size={14} />
                      <span className="capitalize font-medium">{status.replace('-', ' ')}</span>
                    </div>
                    {repo.language && (
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {repo.language}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900">{openIssues}</p>
                      <p className="text-xs text-gray-500">Open Issues</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-green-600">{resolvedIssues}</p>
                      <p className="text-xs text-gray-500">Resolved</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900">{repo.stargazers_count}</p>
                      <p className="text-xs text-gray-500">Stars</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Updated</p>
                      <p className="text-sm font-medium text-gray-900">{getTimeAgo(repo.updated_at)}</p>
                    </div>
                  </div>

                  {/* Action hint */}
                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      {status === 'completed' ? 'All issues resolved' : 'Click to start review'}
                    </span>
                    <Play size={12} className="text-gray-400" />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {filteredRepos.length === 0 && repositories.length > 0 && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <GitBranch size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No repositories found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </motion.div>
          )}

          {repositories.length === 0 && (
            <motion.div
              className="text-center py-12 bg-white rounded-xl border border-gray-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <GitBranch size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No repositories connected</h3>
              <p className="text-gray-500 mb-4">Connect your GitHub account to see your repositories</p>
              <motion.button
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-colors cursor-pointer"
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
                }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSync}
                transition={{ duration: 0.1 }}
              >
                Sync Repositories
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Subscription Modal */}
      <AnimatePresence>
        {showSubscriptionModal && (
          <SubscriptionModal onClose={() => setShowSubscriptionModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Repositories;