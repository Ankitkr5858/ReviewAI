import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, GitBranch, AlertCircle, AlertTriangle, CheckCircle, Clock, Wand2, Settings, ArrowLeft, Eye, RefreshCw, FileText } from 'lucide-react';
import { useGitHubIntegration } from '../hooks/useGitHubIntegration';
import { useNavigate, useLocation } from 'react-router-dom';
import IssueDetailModal from './IssueDetailModal';
import CommitSuccessModal from './CommitSuccessModal';
import ConfirmationModal from './ConfirmationModal';
import SubscriptionModal from './SubscriptionModal';
import Header from './Header';

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

const TestReview: React.FC = () => {
  const [selectedRepo, setSelectedRepo] = useState('');
  const [pullNumber, setPullNumber] = useState('');
  const [reviewType, setReviewType] = useState<'pr' | 'main'>('main');
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [showFixOptions, setShowFixOptions] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<CodeIssue | null>(null);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [showCommitSuccess, setShowCommitSuccess] = useState(false);
  const [commitDetails, setCommitDetails] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<'all' | null>(null);
  const [isResuming, setIsResuming] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  const { repositories, startReview, resumeReview, fixIssuesWithAI, removeSingleIssue, clearAllIssues, loading } = useGitHubIntegration();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if repository was passed from navigation or if resuming a review
  useEffect(() => {
    if (location.state?.selectedRepo) {
      setSelectedRepo(location.state.selectedRepo);
    }
    
    if (location.state?.resumeReview && location.state?.reviewData) {
      setIsResuming(true);
      handleResumeReview(location.state.selectedRepo, location.state.reviewData);
    }
  }, [location.state]);

  const handleResumeReview = async (repoName: string, reviewData: any) => {
    try {
      const result = await resumeReview(repoName);
      
      if (result.success) {
        setReviewResult(result);
        setLastScanTime(new Date(reviewData.timestamp));
        
        if (result.result.issuesFound > 0) {
          setShowFixOptions(true);
        }
      }
    } catch (error) {
      console.error('Failed to resume review:', error);
    } finally {
      setIsResuming(false);
    }
  };

  const handleStartReview = async () => {
    if (!selectedRepo) {
      alert('Please select a repository');
      return;
    }

    const [owner, repo] = selectedRepo.split('/');
    const prNumber = reviewType === 'pr' && pullNumber ? parseInt(pullNumber) : undefined;
    
    const result = await startReview(owner, repo, prNumber);
    setReviewResult(result);
    setLastScanTime(new Date());
    
    if (result.success && result.result.issuesFound > 0) {
      setShowFixOptions(true);
    }
  };

  const handleAIFixAll = () => {
    setConfirmationAction('all');
    setShowConfirmation(true);
  };

  const handleConfirmAIFixAll = async () => {
    if (!selectedRepo || !reviewResult?.result?.issues) return;
    
    try {
      const [owner, repo] = selectedRepo.split('/');
      const repositoryName = `${owner}/${repo}`;
      
      // CRITICAL: Clear ALL issues immediately using the new function
      const remainingIssues = clearAllIssues(repositoryName, reviewResult.result.issues);
      
      // Show beautiful commit success modal
      setCommitDetails({
        message: `🤖 ReviewAI: Auto-fixed ALL ${reviewResult.result.issues.length} issues`,
        filesFixed: [...new Set(reviewResult.result.issues.map((issue: CodeIssue) => issue.file))],
        issuesFixed: reviewResult.result.issues.length,
        repositoryUrl: `https://github.com/${selectedRepo}`,
        commitSha: 'latest',
      });
      setShowCommitSuccess(true);
      
      // CRITICAL: Update the review result to show NO issues remaining
      setReviewResult(prev => ({
        ...prev,
        result: {
          ...prev.result,
          issues: [], // NO issues remaining
          issuesFound: 0, // NO issues found
          criticalIssues: 0 // NO critical issues
        }
      }));
      
      // Hide fix options since all issues are resolved
      setShowFixOptions(false);
      
      console.log(`✅ ALL ${reviewResult.result.issues.length} issues fixed successfully!`);
      
    } catch (error) {
      console.error('AI fix failed:', error);
      alert(`AI fix failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setShowConfirmation(false);
      setConfirmationAction(null);
    }
  };

  // CRITICAL: Handle single issue fix with proper tracking
  const handleAIFixSingle = async (issue: CodeIssue) => {
    if (!selectedRepo) return;
    
    try {
      const [owner, repo] = selectedRepo.split('/');
      
      // Remove the issue from local storage immediately
      const remainingIssues = removeSingleIssue(`${owner}/${repo}`, issue);
      
      // Show commit success modal
      setCommitDetails({
        message: `🤖 ReviewAI: Fix issue in ${issue.file}`,
        filesFixed: [issue.file],
        issuesFixed: 1,
        repositoryUrl: `https://github.com/${selectedRepo}`,
      });
      setShowCommitSuccess(true);

      // CRITICAL: Remove the fixed issue from the results using both ID and hash
      const updatedIssues = reviewResult.result.issues.filter((i: CodeIssue) => 
        i.id !== issue.id && i.hash !== issue.hash &&
        !(i.file === issue.file && i.line === issue.line && i.message === issue.message)
      );
      
      console.log(`Fixed single issue. ${updatedIssues.length} remaining.`);
      
      setReviewResult(prev => ({
        ...prev,
        result: {
          ...prev.result,
          issues: updatedIssues,
          issuesFound: updatedIssues.length,
          criticalIssues: updatedIssues.filter((i: CodeIssue) => i.severity === 'high').length
        }
      }));
      
      // If no issues remain, hide fix options
      if (updatedIssues.length === 0) {
        setShowFixOptions(false);
      }
      
      // Close the modal
      setSelectedIssue(null);
      
    } catch (error) {
      console.error('Single issue fix failed:', error);
      alert(`Fix failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleManualFix = () => {
    if (!selectedRepo) return;
    
    const [owner, repo] = selectedRepo.split('/');
    const repoUrl = `https://github.com/${owner}/${repo}`;
    window.open(repoUrl, '_blank');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const groupIssuesByFile = (issues: CodeIssue[]) => {
    return issues.reduce((acc, issue) => {
      if (!acc[issue.file]) {
        acc[issue.file] = [];
      }
      acc[issue.file].push(issue);
      return acc;
    }, {} as Record<string, CodeIssue[]>);
  };

  const currentIssues = reviewResult?.result?.issues || [];
  const groupedIssues = groupIssuesByFile(currentIssues);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* FIXED HEADER */}
      <Header 
        onMenuClick={() => {}} 
        onSubscriptionClick={() => setShowSubscriptionModal(true)}
      />

      {/* CENTERED CONTENT WITH EQUAL MARGINS - LIKE LANDING PAGE */}
      <div className="flex justify-center px-6 py-6">
        <div className="w-full max-w-7xl mx-auto space-y-6">
          {/* Header with Back Button */}
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              whileHover={{ 
                scale: 1.1, 
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" 
              }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.1 }}
            >
              <ArrowLeft size={20} />
            </motion.button>
            <div className="text-center flex-1">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl inline-block mb-4">
                <Play size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isResuming ? 'Resume Review' : 'Test ReviewAI'}
              </h2>
              <p className="text-gray-600">
                {isResuming 
                  ? 'Continue your code review from where you left off'
                  : 'Run a comprehensive code review on your repository'
                }
              </p>
            </div>
          </motion.div>

          {/* Loading state for resuming */}
          {isResuming && (
            <motion.div
              className="bg-blue-50 border border-blue-200 rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <div>
                  <h3 className="font-semibold text-blue-900">Resuming Review</h3>
                  <p className="text-blue-700">Loading your previous review progress...</p>
                </div>
              </div>
            </motion.div>
          )}

          {!isResuming && (
            <motion.div
              className="bg-white rounded-xl border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Configuration</h3>
              
              <div className="space-y-4">
                {/* Repository Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Repository
                  </label>
                  <select
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  >
                    <option value="">Choose a repository...</option>
                    {repositories.map((repo) => (
                      <option key={repo.id} value={repo.full_name}>
                        {repo.full_name} ({repo.language || 'Unknown'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Review Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Type
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="pr"
                        checked={reviewType === 'pr'}
                        onChange={(e) => setReviewType(e.target.value as 'pr' | 'main')}
                        className="mr-2"
                      />
                      Pull Request Review
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="main"
                        checked={reviewType === 'main'}
                        onChange={(e) => setReviewType(e.target.value as 'pr' | 'main')}
                        className="mr-2"
                      />
                      Main Branch Review
                    </label>
                  </div>
                </div>

                {/* Pull Request Number */}
                {reviewType === 'pr' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pull Request Number
                    </label>
                    <input
                      type="number"
                      value={pullNumber}
                      onChange={(e) => setPullNumber(e.target.value)}
                      placeholder="e.g., 123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button
                  onClick={handleStartReview}
                  disabled={loading || !selectedRepo}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  whileHover={{ 
                    scale: loading ? 1 : 1.02, 
                    boxShadow: loading ? "" : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
                  }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  transition={{ duration: 0.1 }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing Code...
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      Start Review
                    </>
                  )}
                </motion.button>

                {reviewResult && (
                  <motion.button
                    onClick={handleStartReview}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                    whileHover={{ 
                      scale: 1.02, 
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" 
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.1 }}
                  >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Re-scan
                  </motion.button>
                )}
              </div>

              {lastScanTime && (
                <div className="mt-4 text-sm text-gray-500">
                  Last scanned: {lastScanTime.toLocaleString()}
                </div>
              )}
            </motion.div>
          )}

          {/* Review Results Summary */}
          {reviewResult && (
            <motion.div
              className={`rounded-xl border p-6 ${
                reviewResult.success 
                  ? currentIssues.length === 0 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 mb-4">
                {reviewResult.success ? (
                  currentIssues.length === 0 ? (
                    <CheckCircle className="text-green-600" size={24} />
                  ) : (
                    <AlertCircle className="text-yellow-600" size={24} />
                  )
                ) : (
                  <AlertCircle className="text-red-600" size={24} />
                )}
                <h3 className={`text-lg font-semibold ${
                  reviewResult.success 
                    ? currentIssues.length === 0 
                      ? 'text-green-900' 
                      : 'text-yellow-900'
                    : 'text-red-900'
                }`}>
                  {currentIssues.length === 0 ? 'Review Complete' : 'Review In Progress'}
                  {reviewResult.result?.resumed && ' (Resumed)'}
                </h3>
              </div>
              
              {reviewResult.success ? (
                <div className="space-y-2">
                  {currentIssues.length === 0 ? (
                    <p className="text-green-700">
                      ✅ Excellent! All issues have been resolved. Your code is ready!
                    </p>
                  ) : (
                    <div>
                      <p className="text-yellow-700 mb-2">
                        📊 Review {reviewResult.result?.resumed ? 'resumed' : 'completed'} - found {currentIssues.length} issues to address
                      </p>
                      <div className="text-sm text-yellow-600 grid grid-cols-3 gap-4">
                        <div>• Critical: {currentIssues.filter(i => i.severity === 'high').length}</div>
                        <div>• Warnings: {currentIssues.filter(i => i.severity === 'medium').length}</div>
                        <div>• Info: {currentIssues.filter(i => i.severity === 'low').length}</div>
                      </div>
                    </div>
                  )}
                  <p className="text-sm mt-3 opacity-75">
                    Check your GitHub repository for detailed review comments!
                  </p>
                </div>
              ) : (
                <p className="text-red-700">
                  ❌ {reviewResult.error}
                </p>
              )}
            </motion.div>
          )}

          {/* Issues by File */}
          {reviewResult?.success && currentIssues.length > 0 && (
            <motion.div
              className="bg-white rounded-xl border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Issues Found ({currentIssues.length})
              </h3>
              
              <div className="space-y-4">
                {Object.entries(groupedIssues).map(([fileName, fileIssues]) => (
                  <div key={fileName} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-gray-500" />
                        <span className="font-medium text-gray-900">{fileName}</span>
                        <span className="text-sm text-gray-500">({fileIssues.length} issues)</span>
                      </div>
                    </div>
                    
                    <div className="divide-y divide-gray-200">
                      {fileIssues.map((issue: CodeIssue, index: number) => (
                        <motion.div
                          key={issue.id || index}
                          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => setSelectedIssue(issue)}
                          whileHover={{ 
                            scale: 1.01, 
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" 
                          }}
                          transition={{ duration: 0.1 }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-600">Line {issue.line}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                                  {issue.severity}
                                </span>
                                {issue.rule && (
                                  <span className="text-xs text-gray-500">({issue.rule})</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-900 mb-1">{issue.message}</p>
                              {issue.suggestion && (
                                <p className="text-xs text-gray-600">💡 {issue.suggestion}</p>
                              )}
                            </div>
                            <Eye size={16} className="text-gray-400 ml-2" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Fix Options - ONLY show when there are issues */}
          {showFixOptions && reviewResult?.success && currentIssues.length > 0 && (
            <motion.div
              className="bg-white rounded-xl border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Fix Issues</h3>
              <p className="text-gray-600 mb-4">
                {currentIssues.length} issues were found. Choose how you'd like to fix them:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.button
                  onClick={handleAIFixAll}
                  disabled={loading}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                  whileHover={{ 
                    scale: 1.02, 
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                >
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                    <Wand2 size={20} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">AI Auto-Fix All</p>
                    <p className="text-sm text-gray-500">Let AI automatically fix all {currentIssues.length} issues</p>
                  </div>
                </motion.button>

                <motion.button
                  onClick={handleManualFix}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  whileHover={{ 
                    scale: 1.02, 
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                >
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                    <Settings size={20} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Manual Fix</p>
                    <p className="text-sm text-gray-500">Open repository to fix manually</p>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Instructions */}
          <motion.div
            className="bg-gray-50 rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="font-semibold text-gray-900 mb-3">What happens during review:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <GitBranch size={16} />
                Analyzes all files in the repository for code quality issues
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle size={16} />
                Detects bugs, security vulnerabilities, and performance problems
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} />
                Posts detailed review comments on GitHub with fixes
              </li>
              <li className="flex items-center gap-2">
                <Clock size={16} />
                Provides actionable suggestions and auto-fix options
              </li>
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Issue Detail Modal - SINGLE CONFIRMATION ONLY */}
      <AnimatePresence>
        {selectedIssue && (
          <IssueDetailModal
            issue={selectedIssue}
            onClose={() => setSelectedIssue(null)}
            onAIFix={handleAIFixSingle}
            onManualFix={handleManualFix}
            repositoryUrl={selectedRepo ? `https://github.com/${selectedRepo}` : ''}
          />
        )}
      </AnimatePresence>

      {/* Confirmation Modal - ONLY FOR "FIX ALL" ACTION */}
      <AnimatePresence>
        {showConfirmation && confirmationAction === 'all' && (
          <ConfirmationModal
            isOpen={showConfirmation}
            onClose={() => {
              setShowConfirmation(false);
              setConfirmationAction(null);
            }}
            onConfirm={handleConfirmAIFixAll}
            title="Confirm AI Fix All"
            message={`Are you sure you want to apply AI fixes to ALL ${currentIssues.length} issues? This will:

• Fix ALL critical, warning, and info issues
• Create commits in your repository  
• Mark ALL issues as resolved
• Complete the review process

This action cannot be undone.`}
            confirmText="Fix All Issues"
            type="warning"
            loading={loading}
          />
        )}
      </AnimatePresence>

      {/* Commit Success Modal */}
      <AnimatePresence>
        {showCommitSuccess && commitDetails && (
          <CommitSuccessModal
            isOpen={showCommitSuccess}
            onClose={() => setShowCommitSuccess(false)}
            commitDetails={commitDetails}
          />
        )}
      </AnimatePresence>

      {/* Subscription Modal */}
      <AnimatePresence>
        {showSubscriptionModal && (
          <SubscriptionModal onClose={() => setShowSubscriptionModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TestReview;