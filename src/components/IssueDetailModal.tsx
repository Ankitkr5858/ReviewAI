import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wand2, Settings, GitCommit, CheckCircle } from 'lucide-react';
import CodeDiffViewer from './CodeDiffViewer';
import ConfirmationModal from './ConfirmationModal';

interface CodeIssue {
  type: 'error' | 'warning' | 'info';
  severity: 'high' | 'medium' | 'low';
  file: string;
  line: number;
  column?: number;
  message: string;
  rule?: string;
  suggestion?: string;
  fixable?: boolean;
  originalCode?: string;
  suggestedCode?: string;
  id?: string;
  hash?: string;
}

interface IssueDetailModalProps {
  issue: CodeIssue;
  onClose: () => void;
  onAIFix: (issue: CodeIssue) => Promise<void>;
  onManualFix: (issue: CodeIssue) => void;
  repositoryUrl: string;
}

const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  issue,
  onClose,
  onAIFix,
  onManualFix,
  repositoryUrl
}) => {
  const [fixing, setFixing] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleAIFixClick = () => {
    // Show confirmation modal ONLY from this button
    setShowConfirmation(true);
  };

  const handleConfirmAIFix = async () => {
    setShowConfirmation(false);
    setFixing(true);
    try {
      await onAIFix(issue);
      setFixed(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Fix failed:', error);
    } finally {
      setFixing(false);
    }
  };

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Code Issue Details</h2>
                <p className="text-gray-600">{issue.file} - Line {issue.line}</p>
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
            {fixed ? (
              <motion.div
                className="text-center py-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-900 mb-2">Issue Fixed!</h3>
                <p className="text-green-700">The fix has been committed to your repository.</p>
              </motion.div>
            ) : (
              <>
                {/* Pass null to onApplyFix to prevent double confirmation */}
                <CodeDiffViewer issue={issue} onApplyFix={null} />

                {/* Action Buttons */}
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <motion.button
                    onClick={handleAIFixClick}
                    disabled={fixing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                    whileHover={{ scale: fixing ? 1 : 1.02 }}
                    whileTap={{ scale: fixing ? 1 : 0.98 }}
                  >
                    {fixing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Applying AI Fix...
                      </>
                    ) : (
                      <>
                        <Wand2 size={18} />
                        Apply AI Fix & Commit
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    onClick={() => onManualFix(issue)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Settings size={18} />
                    Fix Manually on GitHub
                  </motion.button>
                </div>

                {/* Additional Info */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">What happens when you apply AI fix:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-center gap-2">
                      <GitCommit size={14} />
                      Creates a new commit with the fix
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} />
                      Updates the issue status to resolved
                    </li>
                    <li className="flex items-center gap-2">
                      <Wand2 size={14} />
                      Applies best practices and coding standards
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* SINGLE Confirmation Modal - ONLY triggered from this modal */}
      <AnimatePresence>
        {showConfirmation && (
          <ConfirmationModal
            isOpen={showConfirmation}
            onClose={() => setShowConfirmation(false)}
            onConfirm={handleConfirmAIFix}
            title="Apply AI Fix"
            message={`Are you sure you want to apply AI fix to this issue in ${issue.file}? This will create a commit in your repository and mark the issue as resolved.`}
            confirmText="Apply Fix"
            type="warning"
            loading={fixing}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default IssueDetailModal;