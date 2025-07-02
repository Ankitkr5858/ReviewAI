import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, GitCommit, ExternalLink, X } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface CommitSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  commitDetails: {
    message: string;
    filesFixed: string[];
    issuesFixed: number;
    repositoryUrl: string;
    commitSha?: string;
  };
  loading?: boolean;
}

const CommitSuccessModal: React.FC<CommitSuccessModalProps> = ({
  isOpen,
  onClose,
  commitDetails,
  loading = false
}) => {
  if (!isOpen) return null;

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
        {loading ? (
          // Loading State
          <div className="p-8 text-center">
            <LoadingSpinner size="lg" text="Committing changes..." />
            <p className="text-gray-600 mt-4">Please wait while we apply the fixes...</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle size={24} className="text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Commit Successful!</h2>
                    <p className="text-sm text-gray-600">Changes pushed to repository</p>
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
                {/* Commit Message */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Commit Message</h3>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <GitCommit size={16} className="text-gray-500 mt-0.5" />
                      <p className="text-sm text-gray-900 font-mono">{commitDetails.message}</p>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{commitDetails.issuesFixed}</p>
                    <p className="text-sm text-green-700">Issues Fixed</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{commitDetails.filesFixed.length}</p>
                    <p className="text-sm text-blue-700">Files Updated</p>
                  </div>
                </div>

                {/* Files Fixed */}
                {commitDetails.filesFixed.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Files Modified</h3>
                    <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                      {commitDetails.filesFixed.map((file, index) => (
                        <div key={index} className="text-sm text-gray-600 py-1">
                          📄 {file}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex gap-3">
                <motion.a
                  href={commitDetails.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ExternalLink size={16} />
                  View on GitHub
                </motion.a>
                <motion.button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Close
                </motion.button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CommitSuccessModal;