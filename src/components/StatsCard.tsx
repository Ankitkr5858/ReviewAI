import React from 'react';
import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: LucideIcon;
  color: 'green' | 'blue' | 'orange' | 'purple';
  isLoading?: boolean;
  percentage?: number;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
  isLoading = false,
  percentage = 0
}) => {
  // SINGLE BRAND COLOR SYSTEM - ALL BLUE
  const colorClasses = {
    green: 'text-blue-600 bg-blue-50',
    blue: 'text-blue-600 bg-blue-50',
    orange: 'text-blue-600 bg-blue-50',
    purple: 'text-blue-600 bg-blue-50'
  };

  // SINGLE BRAND COLOR PROGRESS BARS - ALL BLUE GRADIENT
  const progressColors = {
    green: 'bg-gradient-to-r from-blue-600 to-purple-600',
    blue: 'bg-gradient-to-r from-blue-600 to-purple-600',
    orange: 'bg-gradient-to-r from-blue-600 to-purple-600',
    purple: 'bg-gradient-to-r from-blue-600 to-purple-600'
  };

  const trendColor = trend === 'up' ? 'text-blue-600' : 'text-blue-600';
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;

  // FIXED: Calculate real percentage based on title and value
  const getRealPercentage = () => {
    if (percentage > 0) return percentage; // Use provided percentage if available
    
    // Calculate based on actual values
    const numericValue = parseInt(value.replace(/[^\d]/g, '')) || 0;
    
    switch (title) {
      case 'Reviews Completed':
        // Target: 30 reviews per month
        return Math.min(100, (numericValue / 30) * 100);
      case 'Active Repositories':
        // Target: 10 repositories
        return Math.min(100, (numericValue / 10) * 100);
      case 'Issues Resolved':
        // Target: 50 issues
        return Math.min(100, (numericValue / 50) * 100);
      case 'Time Saved':
        // Target: 40 hours
        return Math.min(100, (numericValue / 40) * 100);
      case 'Weekly Activity':
        // Already a percentage
        return numericValue;
      case 'Code Quality':
        // Calculate based on issues resolved vs found
        const reviewHistory = JSON.parse(localStorage.getItem('review_history') || '[]');
        const totalIssuesFound = reviewHistory.reduce((sum: number, r: any) => 
          sum + (r.result?.issuesFound || 0), 0
        );
        const fixHistory = JSON.parse(localStorage.getItem('fix_history') || '[]');
        const totalIssuesFixed = fixHistory.reduce((sum: number, f: any) => 
          sum + (f.issuesFixed || 0), 0
        );
        return totalIssuesFound > 0 ? Math.round((totalIssuesFixed / totalIssuesFound) * 100) : 100;
      case 'Efficiency Rate':
        // Calculate efficiency based on time saved vs time spent
        return Math.min(100, numericValue * 2); // Efficiency multiplier
      case 'Monthly Progress':
        // Progress towards monthly goals
        return Math.min(100, (numericValue / 30) * 100);
      default:
        return Math.min(100, numericValue);
    }
  };

  const realPercentage = getRealPercentage();

  return (
    <motion.div
      className="bg-white rounded-xl border border-gray-200 p-6 transition-all h-full"
      whileHover={{ 
        scale: 1.02, 
        y: -5, 
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
      }}
      transition={{ duration: 0.1 }}
    >
      <div className="relative z-10 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${colorClasses[color]} relative`}>
            <Icon size={24} />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-50" />
              </div>
            )}
          </div>
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon size={16} />
            <span className="text-sm font-medium">{change}</span>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {isLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse w-16" />
              ) : (
                value
              )}
            </h3>
            <p className="text-gray-600 text-sm">{title}</p>
          </div>
          
          {/* FIXED: ALWAYS show progress bar with real data */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <motion.div
                className={`h-1 rounded-full ${progressColors[color]}`}
                initial={{ width: 0 }}
                animate={{ width: `${realPercentage}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{Math.round(realPercentage)}% of target</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;