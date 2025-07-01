import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap, Users } from 'lucide-react';
import { PlanType } from '../hooks/useSubscription';

interface PlanBadgeProps {
  planType: PlanType;
  className?: string;
  showIcon?: boolean;
}

const PlanBadge: React.FC<PlanBadgeProps> = ({ planType, className = '', showIcon = true }) => {
  const getPlanConfig = () => {
    switch (planType) {
      case 'pro':
        return {
          label: 'Pro',
          icon: Crown,
          color: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white',
          textColor: 'text-white',
        };
      case 'team':
        return {
          label: 'Team',
          icon: Users,
          color: 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white',
          textColor: 'text-white',
        };
      default:
        return {
          label: 'Free',
          icon: Zap,
          color: 'bg-gray-100 text-gray-700 border border-gray-300',
          textColor: 'text-gray-700',
        };
    }
  };

  const config = getPlanConfig();
  const Icon = config.icon;

  return (
    <motion.div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.color} ${className}`}
      whileHover={{ scale: 1.05 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {showIcon && <Icon size={14} />}
      <span>{config.label}</span>
    </motion.div>
  );
};

export default PlanBadge;