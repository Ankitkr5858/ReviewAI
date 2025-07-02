import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, GitMerge, X, ExternalLink, FileText, Wand2 } from 'lucide-react';

interface PRNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  prData: {
    number: number;
    title: string;
    repository: string;
    issuesFound: number;
    issuesFixed: number;
    mergedByAI: boolean;
    commitSha: string;
    repositoryUrl: string;
    fixedFiles: string[];
    fixDetails: Array<{
      file: string;
      line: number;
      issue: string;
      fix: string;
      reason: string;
    }>;
  };
}

const PRNotificationModal: React.FC<PRNotificationModalProps> = ({
  isOpen,
  onClose,
  prData
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
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">🤖 ReviewAI Auto-Fixed Your PR!</h2>
                <p className="text-gray-600">Pull Request #{prData.number} has been processed</p>
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
          {/* PR Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Pull Request Summary</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Repository:</strong> {prData.repository}</div>
              <div><strong>Title:</strong> {prData.title}</div>
              <div><strong>Status:</strong> 
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  {prData.mergedByAI ? '🤖 Auto-Merged by ReviewAI' : '✅ Fixed by ReviewAI'}
                </span>
              </div>
            </div>
          </div>

          {/* Issues Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle size={24} className="text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">{prData.issuesFound}</div>
              <div className="text-sm text-red-700">Issues Found</div>
            </div>
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <Wand2 size={24} className="text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{prData.issuesFixed}</div>
              <div className="text-sm text-green-700">Auto-Fixed</div>
            </div>
            <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <FileText size={24} className="text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{prData.fixedFiles.length}</div>
              <div className="text-sm text-blue-700">Files Updated</div>
            </div>
          </div>

          {/* What ReviewAI Fixed */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">🔧 What ReviewAI Fixed For You</h3>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {prData.fixDetails.map((fix, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle size={16} className="text-green-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">
                        {fix.file}:Line {fix.line}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        <strong>Issue:</strong> {fix.issue}
                      </div>
                      <div className="text-sm text-green-700 mb-1">
                        <strong>Fix Applied:</strong> {fix.fix}
                      </div>
                      <div className="text-xs text-blue-600 bg-blue-50 rounded p-2">
                        <strong>💡 Why this matters:</strong> {fix.reason}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Section */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-900 mb-2">📚 For Future Reference</h3>
            <div className="text-sm text-yellow-800 space-y-2">
              <p>• <strong>Review the fixes:</strong> Check the commit to understand what was changed and why</p>
              <p>• <strong>Learn the patterns:</strong> These fixes help you write better code from the start</p>
              <p>• <strong>Best practices:</strong> ReviewAI follows industry standards to improve your code quality</p>
              <p>• <strong>Prevention:</strong> Understanding these fixes helps prevent similar issues in future PRs</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <motion.a
              href={`${prData.repositoryUrl}/commit/${prData.commitSha}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <GitMerge size={16} />
              View Commit Details
            </motion.a>
            <motion.a
              href={`${prData.repositoryUrl}/pull/${prData.number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ExternalLink size={16} />
              View Pull Request
            </motion.a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="text-center text-sm text-gray-600">
            <p>🤖 <strong>ReviewAI</strong> automatically reviewed, fixed, and {prData.mergedByAI ? 'merged' : 'updated'} your PR</p>
            <p className="text-xs mt-1">Keep coding with confidence! ReviewAI has your back.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PRNotificationModal;