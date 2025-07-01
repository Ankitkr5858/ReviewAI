import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  FolderGit2,
  FileText,
  Settings,
  X,
  Wand2,
  Crown,
  TrendingUp,
  Play,
  GitBranch,
  Zap,
  BarChart3,
  Download
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscriptionClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onSubscriptionClick }) => {
  const navigate = useNavigate();

  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/repositories', icon: FolderGit2, label: 'Repositories' },
    { path: '/test', icon: Play, label: 'Test Review' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const quickActions = [
    {
      icon: GitBranch,
      label: 'Add Repository',
      description: 'Connect a new repo',
      action: () => navigate('/repositories'),
      color: 'bg-black'
    },
    {
      icon: Zap,
      label: 'Run Review',
      description: 'Start manual review',
      action: () => navigate('/test'),
      color: 'bg-black'
    },
    {
      icon: BarChart3,
      label: 'View Reports',
      description: 'Download analytics',
      action: () => {
        // Generate and download a real report
        const reportData = generateReport();
        downloadReport(reportData);
      },
      color: 'bg-black'
    }
  ];

  const generateReport = () => {
    const reviewHistory = JSON.parse(localStorage.getItem('review_history') || '[]');
    const fixHistory = JSON.parse(localStorage.getItem('fix_history') || '[]');
    
    const totalReviews = reviewHistory.length;
    const totalIssuesFound = reviewHistory.reduce((sum: number, r: any) => 
      sum + (r.result?.issuesFound || 0), 0
    );
    const totalIssuesFixed = fixHistory.reduce((sum: number, f: any) => 
      sum + (f.issuesFixed || 0), 0
    );
    
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalReviews,
        totalIssuesFound,
        totalIssuesFixed,
        fixRate: totalIssuesFound > 0 ? Math.round((totalIssuesFixed / totalIssuesFound) * 100) : 0
      },
      reviewHistory: reviewHistory.map((r: any) => ({
        repository: r.repository,
        timestamp: r.timestamp,
        issuesFound: r.result?.issuesFound || 0,
        status: r.status || 'completed'
      })),
      fixHistory: fixHistory.map((f: any) => ({
        repository: f.repository,
        timestamp: f.timestamp,
        issuesFixed: f.issuesFixed || 0,
        filesFixed: f.filesFixed || []
      }))
    };
    
    return report;
  };

  const downloadReport = (data: any) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `reviewai-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Show success message
    alert('Report downloaded successfully!');
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50 lg:translate-x-0 flex flex-col"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <motion.div 
                className="flex items-center gap-3"
                whileHover={{ scale: 1.02 }}
              >
                <div className="p-2 bg-black rounded-lg">
                  <Wand2 size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">ReviewAI</h2>
                  <p className="text-xs text-gray-500">v1.0.0</p>
                </div>
              </motion.div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded lg:hidden"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2 mb-6">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-black text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                    onClick={() => window.innerWidth < 1024 && onClose()}
                  >
                    <item.icon size={18} />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* Quick Actions Section */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 px-3">Quick Actions</h3>
              <div className="space-y-2">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={index}
                    onClick={() => {
                      action.action();
                      window.innerWidth < 1024 && onClose();
                    }}
                    className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-left"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`p-2 ${action.color} rounded-lg flex-shrink-0`}>
                      <action.icon size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{action.label}</p>
                      <p className="text-xs text-gray-500 truncate">{action.description}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </nav>

          {/* Subscription CTA */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <motion.div
              className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Go Pro</span>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                Unlock advanced features and unlimited repositories
              </p>
              <motion.button
                onClick={onSubscriptionClick}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Crown size={14} />
                Upgrade Now
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;