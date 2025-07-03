import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  GitBranch,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  FileText,
  Users,
  Zap,
  RefreshCw,
  BarChart3,
  Activity,
  Target,
  Wand2,
  Crown,
  User,
  LogOut,
  Settings as SettingsIcon,
  Menu,
  Play
} from 'lucide-react';
import StatsCard from './StatsCard';
import RecentActivity from './RecentActivity';
import ActiveReviews from './ActiveReviews';
import SubscriptionModal from './SubscriptionModal';
import Header from './Header';
import OverlaySpinner from './OverlaySpinner';
import { useGitHubIntegration } from '../hooks/useGitHubIntegration';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { 
    dashboardStats, 
    activeReviews, 
    recentActivity, 
    repositories,
    loading,
    refreshData,
    disconnect
  } = useGitHubIntegration();

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [realTimeStats, setRealTimeStats] = useState({
    weeklyGrowth: 0,
    monthlyTarget: 0,
    efficiency: 0,
    qualityScore: 0
  });

  // Calculate real-time dynamic stats
  useEffect(() => {
    const calculateDynamicStats = () => {
      const reviewHistory = JSON.parse(localStorage.getItem('review_history') || '[]');
      const fixHistory = JSON.parse(localStorage.getItem('fix_history') || '[]');
      
      // Weekly growth calculation
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentReviews = reviewHistory.filter((r: any) => 
        new Date(r.timestamp) > oneWeekAgo
      );
      const weeklyGrowth = Math.min(100, (recentReviews.length / 7) * 100);

      // Monthly target (aim for 30 reviews per month)
      const monthlyTarget = Math.min(100, (dashboardStats.reviewsCompleted / 30) * 100);

      // Efficiency score based on issues resolved vs found
      const totalIssuesFound = reviewHistory.reduce((sum: number, r: any) => 
        sum + (r.result?.issuesFound || 0), 0
      );
      const efficiency = totalIssuesFound > 0 
        ? Math.round((dashboardStats.issuesResolved / totalIssuesFound) * 100)
        : 100;

      // Quality score based on critical issues resolved
      const criticalIssuesResolved = fixHistory.reduce((sum: number, f: any) => {
        const criticalCount = f.fixedIssues?.filter((issue: any) => 
          issue.severity === 'high'
        ).length || 0;
        return sum + criticalCount;
      }, 0);
      const qualityScore = Math.min(100, criticalIssuesResolved * 10);

      setRealTimeStats({
        weeklyGrowth: Math.round(weeklyGrowth),
        monthlyTarget: Math.round(monthlyTarget),
        efficiency: Math.round(efficiency),
        qualityScore: Math.round(qualityScore)
      });
    };

    calculateDynamicStats();
    
    // Update stats every 30 seconds for real-time feel
    const interval = setInterval(calculateDynamicStats, 30000);
    return () => clearInterval(interval);
  }, [dashboardStats, activeReviews]);

  // Calculate dynamic changes based on recent activity
  const getChangePercentage = (current: number, type: string) => {
    const history = JSON.parse(localStorage.getItem('review_history') || '[]');
    const lastWeek = history.filter((r: any) => {
      const reviewDate = new Date(r.timestamp);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return reviewDate > weekAgo;
    });

    switch (type) {
      case 'reviews':
        return lastWeek.length > 0 ? `+${Math.round((lastWeek.length / 7) * 100)}%` : '0%';
      case 'repositories':
        return repositories.length > 0 ? `+${repositories.length}` : '0';
      case 'issues':
        const weeklyIssues = lastWeek.reduce((sum: number, r: any) => 
          sum + (r.result?.issuesFound || 0), 0
        );
        return weeklyIssues > 0 ? `+${Math.round((weeklyIssues / 7) * 10)}%` : '0%';
      case 'time':
        const timeSaved = parseInt(dashboardStats.timeSaved.replace('h', ''));
        return timeSaved > 0 ? `+${Math.round(timeSaved / 7)}h` : '0h';
      default:
        return '0%';
    }
  };

  // Handle refresh with overlay spinner
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

  const stats = [
    {
      title: 'Reviews Completed',
      value: dashboardStats.reviewsCompleted.toLocaleString(),
      change: getChangePercentage(dashboardStats.reviewsCompleted, 'reviews'),
      trend: 'up' as const,
      icon: CheckCircle,
      color: 'green' as const,
      percentage: realTimeStats.weeklyGrowth
    },
    {
      title: 'Active Repositories',
      value: dashboardStats.activeRepositories.toString(),
      change: getChangePercentage(dashboardStats.activeRepositories, 'repositories'),
      trend: 'up' as const,
      icon: GitBranch,
      color: 'blue' as const,
      percentage: Math.min(100, (dashboardStats.activeRepositories / 10) * 100)
    },
    {
      title: 'Issues Resolved',
      value: dashboardStats.issuesResolved.toLocaleString(),
      change: getChangePercentage(dashboardStats.issuesResolved, 'issues'),
      trend: 'up' as const,
      icon: AlertTriangle,
      color: 'orange' as const,
      percentage: realTimeStats.efficiency
    },
    {
      title: 'Time Saved',
      value: dashboardStats.timeSaved,
      change: getChangePercentage(0, 'time'),
      trend: 'up' as const,
      icon: Clock,
      color: 'purple' as const,
      percentage: realTimeStats.monthlyTarget
    }
  ];

  // Performance metrics for the new cards
  const performanceStats = [
    {
      title: 'Weekly Activity',
      value: `${realTimeStats.weeklyGrowth}%`,
      change: '+12%',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'green' as const,
      percentage: realTimeStats.weeklyGrowth
    },
    {
      title: 'Code Quality',
      value: `${realTimeStats.qualityScore}%`,
      change: '+8%',
      trend: 'up' as const,
      icon: Target,
      color: 'blue' as const,
      percentage: realTimeStats.qualityScore
    },
    {
      title: 'Efficiency Rate',
      value: `${realTimeStats.efficiency}%`,
      change: '+15%',
      trend: 'up' as const,
      icon: Zap,
      color: 'purple' as const,
      percentage: realTimeStats.efficiency
    },
    {
      title: 'Monthly Progress',
      value: `${realTimeStats.monthlyTarget}%`,
      change: '+24%',
      trend: 'up' as const,
      icon: BarChart3,
      color: 'orange' as const,
      percentage: realTimeStats.monthlyTarget
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        onMenuClick={() => {}} 
        onSubscriptionClick={() => setShowSubscriptionModal(true)}
      />

      {/* Overlay Spinner for refresh */}
      <OverlaySpinner 
        isVisible={refreshing} 
        text="Refreshing dashboard data..." 
      />

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Monitor your automated code review performance</span>
                {repositories.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Activity size={14} />
                      {repositories.length} repositories connected
                    </span>
                  </>
                )}
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
            <motion.button
              onClick={handleRefresh}
              disabled={loading || refreshing}
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
          </div>

          {/* Stats Grid */}
          <motion.div
            className="grid grid-cols-4 gap-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              >
                <StatsCard {...stat} isLoading={loading} />
              </motion.div>
            ))}
          </motion.div>

          {/* Performance Metrics */}
          <motion.div
            className="grid grid-cols-4 gap-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {performanceStats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
                <StatsCard {...stat} isLoading={loading} />
              </motion.div>
            ))}
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Active Reviews */}
            <motion.div
              className="col-span-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <ActiveReviews reviews={activeReviews} />
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              className="col-span-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <RecentActivity activities={recentActivity} />
            </motion.div>
          </div>

          {/* Empty State */}
          {repositories.length === 0 && (
            <motion.div
              className="text-center py-12 bg-white rounded-lg border border-gray-200 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <GitBranch size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No repositories connected</h3>
              <p className="text-gray-500 mb-4">Connect your first repository to start using ReviewAI</p>
              <motion.button
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-colors cursor-pointer"
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/repositories')}
                transition={{ duration: 0.1 }}
              >
                Add Repository
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <SubscriptionModal onClose={() => setShowSubscriptionModal(false)} />
      )}
    </div>
  );
};

export default Dashboard;