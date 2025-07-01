import React from 'react';
import { motion } from 'framer-motion';
import { Crown, ArrowRight, X } from 'lucide-react';

interface UpgradePromptProps {
  title: string;
  message: string;
  feature: string;
  onUpgrade: () => void;
  onDismiss?: () => void;
  type?: 'banner' | 'modal' | 'inline';
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  title,
  message,
  feature,
  onUpgrade,
  onDismiss,
  type = 'inline'
}) => {
  if (type === 'banner') {
    return (
      <motion.div
        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-lg mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown size={24} />
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-purple-100 text-sm">{message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={onUpgrade}
              className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Upgrade Now
              <ArrowRight size={16} />
            </motion.button>
            {onDismiss && (
              <motion.button
                onClick={onDismiss}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={16} />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  if (type === 'modal') {
    return (
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-lg max-w-md w-full p-6"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown size={32} className="text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex gap-3">
              {onDismiss && (
                <motion.button
                  onClick={onDismiss}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Maybe Later
                </motion.button>
              )}
              <motion.button
                onClick={onUpgrade}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Crown size={16} />
                Upgrade Now
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Inline type
  return (
    <motion.div
      className="bg-purple-50 border border-purple-200 rounded-lg p-4"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className="flex items-start gap-3">
        <Crown size={20} className="text-purple-600 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-purple-900 mb-1">{title}</h4>
          <p className="text-purple-700 text-sm mb-3">{message}</p>
          <motion.button
            onClick={onUpgrade}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Unlock {feature}
            <ArrowRight size={14} />
          </motion.button>
        </div>
        {onDismiss && (
          <motion.button
            onClick={onDismiss}
            className="p-1 hover:bg-purple-100 rounded transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={16} className="text-purple-600" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default UpgradePrompt;