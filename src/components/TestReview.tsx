import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  GitBranch,
  Search,
  CheckCircle,
  AlertTriangle,
  FileText,
  Wand2,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  Zap,
  Shield,
  TrendingUp,
  BarChart3,
  Play
} from 'lucide-react';
import { useGitHubIntegration } from '../hooks/useGitHubIntegration';
import CodeDiffViewer from './CodeDiffViewer';
import IssueDetailModal from './IssueDetailModal';
import ConfirmationModal from './ConfirmationModal';
import CommitSuccessModal from './CommitSuccessModal';
import UpgradePrompt from './UpgradePrompt';
import SubscriptionModal from './SubscriptionModal';
import Header from './Header';
import OverlaySpinner from './OverlaySpinner';

const TestReview: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { startReview, resumeReview, fixIssuesWithAI, removeSingleIssue, clearAllIssues, loading } = useGitHubIntegration();
  
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [reviewInProgress, setReviewInProgress] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showCommitSuccess, setShowCommitSuccess] = useState(false);
  const [commitDetails, setCommitDetails] = useState<any>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    security: true,
    critical: true,
    performance: true,
    warning: true,
    prettier: false,
    eslint: false
  });
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [fixingInProgress, setFixingInProgress] = useState(false);
  const [performanceScore, setPerformanceScore] = useState<number | null>(null);
  const [performanceIssues, setPerformanceIssues] = useState<any[]>([]);
  const [securityIssues, setSecurityIssues] = useState<any[]>([]);
  const [hasConflicts, setHasConflicts] = useState(false);
  const [conflictDetails, setConflictDetails] = useState<any>(null);

  // Get repository from location state
  useEffect(() => {
    if (location.state?.selectedRepo) {
      setSelectedRepo(location.state.selectedRepo);
      
      // If resuming a review, load the existing data
      if (location.state.resumeReview && location.state.reviewData) {
        setReviewResult(location.state.reviewData);
      }
    }
  }, [location.state]);

  // Handle repository selection
  const handleRepoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedRepo(e.target.value);
  };

  // Start or resume review
  const handleStartReview = async () => {
    if (!selectedRepo) {
      alert('Please enter a repository name');
      return;
    }

    setReviewInProgress(true);
    
    try {
      // Parse owner and repo from the input
      const [owner, repo] = selectedRepo.split('/');
      
      if (!owner || !repo) {
        throw new Error('Invalid repository format. Please use owner/repo format.');
      }
      
      // Check if we're resuming an existing review
      if (location.state?.resumeReview) {
        const result = await resumeReview(selectedRepo);
        if (result.success) {
          setReviewResult(result.result);
          
          // Categorize issues
          categorizeIssues(result.result.issues || []);
        }
      } else {
        // Start a new review
        const result = await startReview(owner, repo);
        if (result.success) {
          setReviewResult(result.result);
          
          // Check for conflicts
          if (result.hasConflicts) {
            setHasConflicts(true);
            setConflictDetails(result.conflictDetails);
          }
          
          // Categorize issues
          categorizeIssues(result.result.issues || []);
          
          // Set performance score if available
          if (result.result.metrics?.performanceScore) {
            setPerformanceScore(result.result.metrics.performanceScore);
          }
        }
      }
    } catch (error) {
      console.error('Review failed:', error);
      alert(`Review failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setReviewInProgress(false);
    }
  };

  // Categorize issues by type
  const categorizeIssues = (issues: any[]) => {
    const performance = issues.filter(issue => issue.category === 'performance');
    const security = issues.filter(issue => issue.category === 'security');
    
    setPerformanceIssues(performance);
    setSecurityIssues(security);
    
    // Calculate performance score if not provided
    if (performance.length > 0 && !performanceScore) {
      const highCount = performance.filter(i => i.severity === 'high').length;
      const mediumCount = performance.filter(i => i.severity === 'medium').length;
      
      const calculatedScore = Math.max(0, 100 - (highCount * 20) - (mediumCount * 10));
      setPerformanceScore(calculatedScore);
    }
  };

  // Handle issue click
  const handleIssueClick = (issue: any) => {
    setSelectedIssue(issue);
    setShowIssueModal(true);
  };

  // Apply AI fix to a single issue
  const handleApplyFix = async (issue: any) => {
    if (!selectedRepo) return;
    
    const [owner, repo] = selectedRepo.split('/');
    
    try {
      // Remove the issue from the list
      const updatedIssues = reviewResult.issues.filter((i: any) => 
        i.id !== issue.id && i.hash !== issue.hash
      );
      
      // Update the UI immediately
      setReviewResult({
        ...reviewResult,
        issues: updatedIssues,
        issuesFound: updatedIssues.length
      });
      
      // Close the modal
      setShowIssueModal(false);
      
      // Show commit success modal
      setCommitDetails({
        message: `Fixed ${issue.message} in ${issue.file}`,
        filesFixed: [issue.file],
        issuesFixed: 1,
        repositoryUrl: `https://github.com/${selectedRepo}`
      });
      setShowCommitSuccess(true);
      
      // Actually apply the fix in the background
      await removeSingleIssue(selectedRepo, issue);
      
      // Re-categorize issues
      categorizeIssues(updatedIssues);
      
    } catch (error) {
      console.error('Fix failed:', error);
      alert(`Fix failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle manual fix (redirect to GitHub)
  const handleManualFix = (issue: any) => {
    if (!selectedRepo) return;
    
    const repoUrl = `https://github.com/${selectedRepo}`;
    const fileUrl = `${repoUrl}/blob/main/${issue.file}#L${issue.line}`;
    
    window.open(fileUrl, '_blank');
  };

  // Fix all issues with AI
  const handleFixAllIssues = async () => {
    if (!selectedRepo || !reviewResult?.issues) return;
    
    setShowConfirmation(false);
    setFixingInProgress(true);
    
    try {
      const [owner, repo] = selectedRepo.split('/');
      
      const result = await fixIssuesWithAI(owner, repo, reviewResult.issues);
      
      if (result.success) {
        // Update commit details for success modal
        setCommitDetails({
          message: result.commitMessage,
          filesFixed: result.fixedFiles,
          issuesFixed: result.fixedIssues,
          repositoryUrl: `https://github.com/${selectedRepo}`,
          commitSha: result.commitSha
        });
        
        // Clear all issues from the UI
        setReviewResult({
          ...reviewResult,
          issues: [],
          issuesFound: 0
        });
        
        // Reset performance and security issues
        setPerformanceIssues([]);
        setSecurityIssues([]);
        
        // Show success modal
        setShowCommitSuccess(true);
      }
    } catch (error) {
      console.error('Fix all failed:', error);
      alert(`Fix all failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setFixingInProgress(false);
    }
  };

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Group issues by category
  const getIssuesByCategory = () => {
    if (!reviewResult?.issues) return {};
    
    return reviewResult.issues.reduce((acc: any, issue: any) => {
      const category = issue.category || 
                      (issue.severity === 'high' ? 'critical' : 
                       issue.severity === 'medium' ? 'warning' : 'info');
      
      if (!acc[category]) {
        acc[category] = [];
      }
      
      acc[category].push(issue);
      return acc;
    }, {});
  };

  const issuesByCategory = getIssuesByCategory();

  // Get category display name
  const getCategoryName = (category: string) => {
    switch (category) {
      case 'security': return 'Security Issues';
      case 'critical': return 'Critical Issues';
      case 'performance': return 'Performance Issues';
      case 'warning': return 'Warnings';
      case 'prettier': return 'Formatting Issues';
      case 'eslint': return 'ESLint Issues';
      case 'best-practice': return 'Best Practices';
      default: return `${category.charAt(0).toUpperCase() + category.slice(1)} Issues`;
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return Shield;
      case 'critical': return AlertTriangle;
      case 'performance': return Zap;
      case 'warning': return Clock;
      case 'prettier': return FileText;
      case 'eslint': return FileText;
      case 'best-practice': return CheckCircle;
      default: return FileText;
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'security': return 'text-red-600 bg-red-50';
      case 'critical': return 'text-red-600 bg-red-50';
      case 'performance': return 'text-orange-600 bg-orange-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'prettier': return 'text-pink-600 bg-pink-50';
      case 'eslint': return 'text-blue-600 bg-blue-50';
      case 'best-practice': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Handle conflict resolution
  const handleResolveConflicts = () => {
    if (!selectedRepo) return;
    
    // Redirect to GitHub repository
    window.open(`https://github.com/${selectedRepo}/pulls`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        onMenuClick={() => {}} 
        onSubscriptionClick={() => setShowSubscriptionModal(true)}
      />

      {/* Loading Overlay */}
      <OverlaySpinner 
        isVisible={reviewInProgress || fixingInProgress} 
        text={fixingInProgress ? "Applying AI fixes..." : "Analyzing code..."}
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <motion.button
            onClick={() => navigate('/repositories')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft size={16} />
            <span>Back to Repositories</span>
          </motion.button>
        </div>

        {/* Repository Selection */}
        {!reviewResult && (
          <motion.div
            className="bg-white rounded-xl border border-gray-200 p-8 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Start Code Review</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub Repository
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <GitBranch size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={selectedRepo}
                      onChange={handleRepoChange}
                      placeholder="owner/repository"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <motion.button
                    onClick={handleStartReview}
                    disabled={!selectedRepo || reviewInProgress}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: reviewInProgress ? 1 : 1.05 }}
                    whileTap={{ scale: reviewInProgress ? 1 : 0.95 }}
                  >
                    {reviewInProgress ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Play size={16} />
                        Start Review
                      </>
                    )}
                  </motion.button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Enter the GitHub repository in the format "owner/repository" (e.g., "facebook/react")
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <Zap size={16} className="text-blue-600" />
                  What ReviewAI will do:
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-blue-600 mt-1 flex-shrink-0" />
                    <span>Analyze code for bugs, security vulnerabilities, and quality issues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-blue-600 mt-1 flex-shrink-0" />
                    <span>Detect performance bottlenecks and optimization opportunities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-blue-600 mt-1 flex-shrink-0" />
                    <span>Identify security vulnerabilities and potential exploits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-blue-600 mt-1 flex-shrink-0" />
                    <span>Provide one-click fixes for common issues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-blue-600 mt-1 flex-shrink-0" />
                    <span>Suggest code improvements and best practices</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Review Results */}
        {reviewResult && (
          <div className="space-y-6">
            {/* Repository Info */}
            <motion.div
              className="bg-white rounded-xl border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                    <GitBranch size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedRepo}</h2>
                    <p className="text-sm text-gray-600">
                      {reviewResult.isOwnPR 
                        ? `Pull Request: ${reviewResult.prDetails?.title || 'Unknown'}`
                        : 'Main Branch Review'
                      }
                    </p>
                  </div>
                </div>
                <motion.a
                  href={`https://github.com/${selectedRepo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ExternalLink size={16} />
                  View on GitHub
                </motion.a>
              </div>
            </motion.div>

            {/* Merge Conflicts Warning */}
            {hasConflicts && (
              <motion.div
                className="bg-red-50 border border-red-200 rounded-xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <AlertTriangle size={24} className="text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-800 mb-2">Merge Conflicts Detected</h3>
                    <p className="text-red-700 mb-4">
                      This repository has merge conflicts that need to be resolved before proceeding with the review.
                    </p>
                    <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-red-800 mb-2">Conflict Details:</h4>
                      <ul className="space-y-1 text-sm text-red-700">
                        <li>• {conflictDetails?.conflictMarkers || 0} conflict markers found</li>
                        <li>• Affected files: {conflictDetails?.conflictFiles?.join(', ') || 'Unknown'}</li>
                        <li>• {conflictDetails?.canAutoResolve ? 'Can be auto-resolved' : 'Manual resolution required'}</li>
                      </ul>
                    </div>
                    <div className="flex gap-3">
                      <motion.button
                        onClick={handleResolveConflicts}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <GitMerge size={16} />
                        Resolve on GitHub
                      </motion.button>
                      {conflictDetails?.canAutoResolve && (
                        <motion.button
                          onClick={handleStartReview}
                          className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Wand2 size={16} />
                          Auto-Resolve & Continue
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Review Summary */}
            {!hasConflicts && (
              <motion.div
                className="bg-white rounded-xl border border-gray-200 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Summary</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className={`p-4 rounded-lg ${reviewResult.issuesFound > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {reviewResult.issuesFound > 0 ? (
                        <AlertTriangle size={20} className="text-red-600" />
                      ) : (
                        <CheckCircle size={20} className="text-green-600" />
                      )}
                      <h4 className="font-medium text-gray-900">Issues Found</h4>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{reviewResult.issuesFound}</p>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={20} className="text-orange-600" />
                      <h4 className="font-medium text-gray-900">Critical Issues</h4>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{reviewResult.criticalIssues || 0}</p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield size={20} className="text-blue-600" />
                      <h4 className="font-medium text-gray-900">Security Issues</h4>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{securityIssues.length}</p>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={20} className="text-yellow-600" />
                      <h4 className="font-medium text-gray-900">Performance</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-gray-900">{performanceScore || 100}</p>
                      <span className="text-sm text-gray-600">/100</span>
                    </div>
                  </div>
                </div>

                {/* Performance Score Visualization */}
                {performanceScore !== null && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Performance Score</h4>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          performanceScore >= 90 ? 'text-green-600' :
                          performanceScore >= 70 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {performanceScore >= 90 ? 'Excellent' :
                           performanceScore >= 70 ? 'Good' :
                           performanceScore >= 50 ? 'Needs Improvement' :
                           'Poor'}
                        </span>
                        <span className="text-sm text-gray-600">{performanceScore}/100</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <motion.div
                        className={`h-2.5 rounded-full ${
                          performanceScore >= 90 ? 'bg-green-600' :
                          performanceScore >= 70 ? 'bg-yellow-500' :
                          performanceScore >= 50 ? 'bg-orange-500' :
                          'bg-red-600'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${performanceScore}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                    
                    {/* Performance Improvement Section */}
                    {performanceIssues.length > 0 && performanceScore < 90 && (
                      <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <TrendingUp size={20} className="text-orange-600 mt-0.5" />
                          <div>
                            <h5 className="font-medium text-orange-900 mb-2">Performance Improvement Opportunity</h5>
                            <p className="text-sm text-orange-800 mb-3">
                              Fixing the {performanceIssues.length} performance issues could improve your score by up to {Math.min(100 - performanceScore, performanceIssues.length * 10)} points.
                            </p>
                            <motion.button
                              onClick={() => {
                                const performanceCategory = document.getElementById('category-performance');
                                if (performanceCategory) {
                                  performanceCategory.scrollIntoView({ behavior: 'smooth' });
                                }
                                toggleCategory('performance');
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Zap size={14} />
                              View Performance Issues
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {reviewResult.issuesFound > 0 ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <motion.button
                      onClick={() => setShowConfirmation(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Wand2 size={18} />
                      Fix All Issues with AI
                    </motion.button>
                    <motion.a
                      href={`https://github.com/${selectedRepo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ExternalLink size={18} />
                      View Repository
                    </motion.a>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <CheckCircle size={48} className="text-green-600 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-green-900 mb-2">All Clear!</h3>
                    <p className="text-green-800 mb-4">No issues found in this repository. Great job!</p>
                    <motion.a
                      href={`https://github.com/${selectedRepo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ExternalLink size={18} />
                      View Repository
                    </motion.a>
                  </div>
                )}
              </motion.div>
            )}

            {/* Issues List */}
            {!hasConflicts && reviewResult && reviewResult.issuesFound > 0 && (
              <motion.div
                className="bg-white rounded-xl border border-gray-200 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Issues Found</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {reviewResult.issuesFound} {reviewResult.issuesFound === 1 ? 'issue' : 'issues'} found
                    </span>
                  </div>
                </div>

                {/* Issues by Category */}
                <div className="space-y-6">
                  {Object.entries(issuesByCategory).map(([category, issues]: [string, any]) => {
                    if (!issues || issues.length === 0) return null;
                    
                    const CategoryIcon = getCategoryIcon(category);
                    const isExpanded = expandedCategories[category];
                    
                    return (
                      <div key={category} id={`category-${category}`}>
                        <motion.button
                          onClick={() => toggleCategory(category)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg mb-3 ${getCategoryColor(category)}`}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="flex items-center gap-3">
                            <CategoryIcon size={20} />
                            <span className="font-medium">{getCategoryName(category)}</span>
                            <span className="px-2 py-1 bg-white bg-opacity-30 rounded-full text-xs">
                              {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
                            </span>
                          </div>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </motion.button>
                        
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-4 mb-6">
                                {issues.map((issue: any, index: number) => (
                                  <motion.div
                                    key={issue.id || `${issue.file}-${issue.line}-${index}`}
                                    className="border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer"
                                    whileHover={{ scale: 1.01, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => handleIssueClick(issue)}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                  >
                                    <div className="p-4">
                                      <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${getCategoryColor(issue.category || (issue.severity === 'high' ? 'critical' : 'warning'))}`}>
                                          <CategoryIcon size={16} />
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-gray-900">{issue.file}:{issue.line}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                                              issue.severity === 'high' 
                                                ? 'bg-red-100 text-red-800' 
                                                : issue.severity === 'medium'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-blue-100 text-blue-800'
                                            }`}>
                                              {issue.severity}
                                            </span>
                                          </div>
                                          <p className="text-sm text-gray-700 mb-2">{issue.message}</p>
                                          {issue.suggestion && (
                                            <div className="bg-gray-50 rounded p-2 text-xs text-gray-600">
                                              <span className="font-medium">Suggestion:</span> {issue.suggestion}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {issue.fixable && (
                                            <motion.button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleIssueClick(issue);
                                              }}
                                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                              whileHover={{ scale: 1.1 }}
                                              whileTap={{ scale: 0.9 }}
                                            >
                                              <Wand2 size={16} className="text-blue-600" />
                                            </motion.button>
                                          )}
                                          <motion.button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleManualFix(issue);
                                            }}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                          >
                                            <ExternalLink size={16} className="text-gray-600" />
                                          </motion.button>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Performance Analysis */}
            {!hasConflicts && performanceScore !== null && (
              <motion.div
                className="bg-white rounded-xl border border-gray-200 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Analysis</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BarChart3 size={20} className="text-blue-600" />
                      </div>
                      <h4 className="font-medium text-gray-900">Performance Score</h4>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl font-bold ${
                        performanceScore >= 90 ? 'text-green-600' :
                        performanceScore >= 70 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {performanceScore}
                      </span>
                      <span className="text-gray-600">/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <motion.div
                        className={`h-2 rounded-full ${
                          performanceScore >= 90 ? 'bg-green-600' :
                          performanceScore >= 70 ? 'bg-yellow-500' :
                          'bg-red-600'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${performanceScore}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-6 border border-green-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Zap size={20} className="text-green-600" />
                      </div>
                      <h4 className="font-medium text-gray-900">Optimization Potential</h4>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-green-600">
                        {Math.min(100 - performanceScore, performanceIssues.length * 10)}%
                      </span>
                      <span className="text-gray-600">faster</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                      Fixing performance issues could improve speed by up to {Math.min(100 - performanceScore, performanceIssues.length * 10)}%
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Clock size={20} className="text-purple-600" />
                      </div>
                      <h4 className="font-medium text-gray-900">Time Savings</h4>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-purple-600">
                        {Math.round((performanceIssues.length * 2.5) * 10) / 10}h
                      </span>
                      <span className="text-gray-600">saved</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                      Estimated development time saved by fixing these issues
                    </p>
                  </div>
                </div>
                
                {/* Performance Recommendations */}
                {performanceIssues.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-medium text-orange-900 mb-3 flex items-center gap-2">
                      <Zap size={16} className="text-orange-600" />
                      Top Performance Recommendations:
                    </h4>
                    <ul className="space-y-2">
                      {performanceIssues.slice(0, 3).map((issue, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <TrendingUp size={16} className="text-orange-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-orange-800">{issue.message}</p>
                            <p className="text-xs text-orange-700">{issue.file}:{issue.line}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {performanceIssues.length > 3 && (
                      <p className="text-xs text-orange-700 mt-2">
                        + {performanceIssues.length - 3} more performance issues
                      </p>
                    )}
                    <div className="mt-3">
                      <motion.button
                        onClick={() => {
                          const performanceCategory = document.getElementById('category-performance');
                          if (performanceCategory) {
                            performanceCategory.scrollIntoView({ behavior: 'smooth' });
                          }
                          toggleCategory('performance');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Wand2 size={14} />
                        Fix Performance Issues
                      </motion.button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Security Analysis */}
            {!hasConflicts && securityIssues.length > 0 && (
              <motion.div
                className="bg-white rounded-xl border border-gray-200 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Analysis</h3>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <Shield size={24} className="text-red-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-red-800 mb-2">
                        {securityIssues.length} Security {securityIssues.length === 1 ? 'Vulnerability' : 'Vulnerabilities'} Detected
                      </h4>
                      <p className="text-red-700 mb-4">
                        These security issues should be addressed immediately to protect your application and users.
                      </p>
                      
                      <div className="space-y-3 mb-4">
                        {securityIssues.slice(0, 3).map((issue, index) => (
                          <div key={index} className="bg-white bg-opacity-50 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <AlertTriangle size={16} className="text-red-600 mt-1 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-red-800">{issue.message}</p>
                                <p className="text-sm text-red-700">{issue.file}:{issue.line}</p>
                                {issue.suggestion && (
                                  <p className="text-xs text-red-600 mt-1">
                                    <span className="font-medium">Fix:</span> {issue.suggestion}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <motion.button
                        onClick={() => {
                          const securityCategory = document.getElementById('category-security');
                          if (securityCategory) {
                            securityCategory.scrollIntoView({ behavior: 'smooth' });
                          }
                          toggleCategory('security');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Wand2 size={16} />
                        Fix Security Issues
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Issue Detail Modal */}
      <AnimatePresence>
        {showIssueModal && selectedIssue && (
          <IssueDetailModal
            issue={selectedIssue}
            onClose={() => setShowIssueModal(false)}
            onAIFix={handleApplyFix}
            onManualFix={handleManualFix}
            repositoryUrl={`https://github.com/${selectedRepo}`}
          />
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleFixAllIssues}
        title="Apply AI Fix All"
        message={`Are you sure you want to apply AI fixes to ALL ${reviewResult?.issuesFound || 0} critical/warning issues? This will: • Fix ALL critical and warning issues • Create commits in your repository • Mark ALL issues as resolved • Complete the review process`}
        confirmText="Fix All Issues"
        type="warning"
        loading={fixingInProgress}
      />

      {/* Commit Success Modal */}
      <CommitSuccessModal
        isOpen={showCommitSuccess}
        onClose={() => setShowCommitSuccess(false)}
        commitDetails={commitDetails}
        loading={fixingInProgress}
      />

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