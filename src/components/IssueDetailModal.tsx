import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wand2, Settings, GitCommit, CheckCircle, Code, ArrowRight, AlertTriangle, Info } from 'lucide-react';
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

  // Get specific explanation for what the AI fix will do
  const getCodeExplanation = (issue: CodeIssue) => {
    if (!issue.originalCode || !issue.suggestedCode) {
      return {
        whatItDoes: "This fix will resolve the identified issue according to best practices.",
        whyBetter: "The suggested change follows coding standards and prevents potential problems.",
        impact: "Improves code quality and maintainability."
      };
    }

    const original = issue.originalCode.trim();
    const suggested = issue.suggestedCode.trim();
    const rule = issue.rule?.toLowerCase() || '';
    const message = issue.message.toLowerCase();

    // Missing semicolon
    if (rule.includes('semi') || message.includes('semicolon')) {
      return {
        whatItDoes: `Adds a semicolon (;) at the end of the statement`,
        whyBetter: "Explicitly terminates the statement instead of relying on JavaScript's automatic semicolon insertion (ASI). This prevents bugs when code is minified or when certain patterns are used.",
        impact: "🛡️ Prevents unexpected statement combinations, 🔧 Makes code more predictable, 📦 Safer when code is minified"
      };
    }

    // Console.log statements
    if (rule.includes('console') || message.includes('console.log')) {
      return {
        whatItDoes: `Removes or comments out the console.log statement`,
        whyBetter: "Eliminates debugging code that shouldn't be in production. Console logs can expose sensitive data and clutter the browser console for end users.",
        impact: "🔒 Prevents data exposure, 🚀 Cleaner production code, 👥 Better user experience"
      };
    }

    // Strict equality
    if (rule.includes('eqeqeq') || message.includes('strict equality') || message.includes('===')) {
      return {
        whatItDoes: `Changes loose equality (==) to strict equality (===)`,
        whyBetter: "Strict equality (===) compares both value AND type without automatic type conversion. This prevents unexpected results like '0' == 0 being true.",
        impact: "🎯 More predictable comparisons, 🐛 Prevents type coercion bugs, 📚 Follows JavaScript best practices"
      };
    }

    // Error handling
    if (rule.includes('error') || message.includes('error handling') || message.includes('try-catch')) {
      return {
        whatItDoes: `Wraps the async operation in a try-catch block`,
        whyBetter: "Catches any errors that might occur during the async operation (network failures, server errors, etc.) instead of letting them crash the application.",
        impact: "💥 Prevents app crashes, 👥 Better user experience with error messages, 🔧 Easier debugging"
      };
    }

    // Unused variables
    if (rule.includes('unused') || message.includes('unused')) {
      return {
        whatItDoes: `Prefixes the variable name with underscore`,
        whyBetter: "The underscore prefix is a convention that tells other developers (and linters) that this variable is intentionally unused. This removes the warning while keeping the variable for future use.",
        impact: "🧹 Cleaner code without warnings, 📝 Documents intentional non-use, 🤝 Better team communication"
      };
    }

    // Security issues (innerHTML)
    if (rule.includes('innerHTML') || message.includes('xss')) {
      return {
        whatItDoes: `Changes innerHTML to textContent`,
        whyBetter: "textContent safely sets text without interpreting HTML, preventing XSS attacks. innerHTML can execute malicious scripts if user input contains HTML/JavaScript.",
        impact: "🛡️ Prevents XSS attacks, 🔒 Safer handling of user input, 👤 Protects user data"
      };
    }

    // Default explanation
    return {
      whatItDoes: `Changes "${original}" to "${suggested}"`,
      whyBetter: "This change follows coding best practices and resolves the identified issue.",
      impact: "📈 Improves code quality and follows industry standards"
    };
  };

  const codeExplanation = getCodeExplanation(issue);

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

                {/* 🔧 COMPACT CODE EXPLANATION SECTION */}
                {issue.originalCode && issue.suggestedCode && (
                  <motion.div
                    className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Code size={18} className="text-blue-600" />
                      <h3 className="text-base font-semibold text-blue-900">What This AI Fix Will Do</h3>
                    </div>

                    <div className="space-y-3">
                      {/* What the code does - COMPACT */}
                      <div className="flex items-start gap-2">
                        <ArrowRight size={16} className="text-blue-600 mt-1 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-blue-900 text-sm">🔧 What the fix does: </span>
                          <span className="text-blue-800 text-sm">{codeExplanation.whatItDoes}</span>
                        </div>
                      </div>

                      {/* Why it's better - COMPACT */}
                      <div className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-green-600 mt-1 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-green-900 text-sm">✅ Why this is better: </span>
                          <span className="text-green-800 text-sm">{codeExplanation.whyBetter}</span>
                        </div>
                      </div>

                      {/* Impact - COMPACT */}
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className="text-orange-600 mt-1 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-orange-900 text-sm">🎯 How this improves your code: </span>
                          <span className="text-orange-800 text-sm">{codeExplanation.impact}</span>
                        </div>
                      </div>

                      {/* Code comparison visual - COMPACT */}
                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <h4 className="font-medium text-gray-900 mb-2 text-sm">📝 Before vs After:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs font-medium text-red-700 mb-1 flex items-center gap-1">
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              Your Current Code
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded p-2 font-mono text-xs">
                              <code className="text-red-800">{issue.originalCode}</code>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              AI Suggested Fix
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded p-2 font-mono text-xs">
                              <code className="text-green-800">{issue.suggestedCode}</code>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Learning tip - COMPACT */}
                    <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-300">
                      <p className="text-blue-900 text-xs">
                        <strong>💡 Pro Tip:</strong> Understanding these specific changes helps you write better code from the start!
                      </p>
                    </div>
                  </motion.div>
                )}

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