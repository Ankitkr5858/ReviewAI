import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { GitHubService } from '../services/github';
import {
  Play,
  Wand2,
  AlertTriangle,
  CheckCircle,
  Clock,
  GitBranch,
  FileText,
  Settings,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Search,
  Filter,
  X,
  Info,
  Zap,
  Shield,
  Target,
  Code,
  Bug,
  Sparkles,
  GitPullRequest,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { useGitHubIntegration } from '../hooks/useGitHubIntegration';
import CodeDiffViewer from './CodeDiffViewer';
import IssueDetailModal from './IssueDetailModal';
import ConfirmationModal from './ConfirmationModal';
import CommitSuccessModal from './CommitSuccessModal';
import OverlaySpinner from './OverlaySpinner';
import Header from './Header';
import SearchableDropdown from './SearchableDropdown';

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
  category?: 'prettier' | 'eslint' | 'security' | 'performance' | 'best-practice';
}

interface PullRequest {
  number: number;
  title: string;
  head: { ref: string };
  base: { ref: string };
  created_at: string;
  user: { login: string };
}

const TestReview: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { repositories, startReview, resumeReview, fixIssuesWithAI, removeSingleIssue, clearAllIssues } = useGitHubIntegration();
  
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [reviewing, setReviewing] = useState(false);
  const [loadingPRs, setLoadingPRs] = useState(false);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [selectedPR, setSelectedPR] = useState<number | null>(null);
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [issues, setIssues] = useState<CodeIssue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<CodeIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<CodeIssue | null>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [commitDetails, setCommitDetails] = useState<any>(null);
  const [fixing, setFixing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [fileContents, setFileContents] = useState<Record<string, { before: string; after: string; loading: boolean }>>({});

  // Get selected repo from navigation state
  useEffect(() => {
    if (location.state?.selectedRepo) {
      setSelectedRepo(location.state.selectedRepo);
    }
    if (location.state?.resumeReview && location.state?.reviewData) {
      setReviewResult(location.state.reviewData);
      setIssues(location.state.reviewData.issues || []);
    }
  }, [location.state]);

  // Filter issues based on search and filters
  useEffect(() => {
    let filtered = issues;

    if (searchTerm) {
      filtered = filtered.filter(issue =>
        issue.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.file.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (issue.rule && issue.rule.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(issue => issue.severity === severityFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(issue => issue.category === categoryFilter);
    }

    setFilteredIssues(filtered);
  }, [issues, searchTerm, severityFilter, categoryFilter]);

  // Fetch pull requests when repository is selected
  const fetchPullRequests = async (repoFullName: string) => {
    if (!repoFullName) {
      setPullRequests([]);
      setSelectedPR(null);
      return;
    }

    setLoadingPRs(true);
    try {
      const token = localStorage.getItem('github_token');
      if (!token) {
        alert('GitHub token not found. Please reconnect your account.');
        return;
      }

      const github = new GitHubService(token);
      const [owner, repo] = repoFullName.split('/');
      const prs = await github.getPullRequests(owner, repo, 'open');
      
      setPullRequests(prs);
      // Auto-select the first PR if available
      if (prs.length > 0) {
        setSelectedPR(prs[0].number);
      }
    } catch (error) {
      console.error('Failed to fetch pull requests:', error);
      setPullRequests([]);
    } finally {
      setLoadingPRs(false);
    }
  };

  // Handle repository selection
  const handleRepoChange = (repoFullName: string) => {
    setSelectedRepo(repoFullName);
    setReviewResult(null);
    setIssues([]);
    setSelectedPR(null);
    setExpandedFiles(new Set());
    setFileContents({});
    fetchPullRequests(repoFullName);
  };

  // Toggle file expansion and fetch content if needed
  const toggleFileExpansion = async (filename: string) => {
    const newExpandedFiles = new Set(expandedFiles);
    
    if (expandedFiles.has(filename)) {
      newExpandedFiles.delete(filename);
    } else {
      newExpandedFiles.add(filename);
      
      // Fetch file content if not already loaded
      if (!fileContents[filename] && selectedRepo && selectedPR) {
        setFileContents(prev => ({
          ...prev,
          [filename]: { before: '', after: '', loading: true }
        }));
        
        try {
          const token = localStorage.getItem('github_token');
          if (token) {
            const github = new GitHubService(token);
            const [owner, repo] = selectedRepo.split('/');
            
            // Get PR details to get the head and base SHA
            const prDetails = await github.request(`/repos/${owner}/${repo}/pulls/${selectedPR}`);
            
            // Get file content from both base and head
            const [beforeContent, afterContent] = await Promise.all([
              github.getFileContent(owner, repo, filename, prDetails.base.sha),
              github.getFileContent(owner, repo, filename, prDetails.head.sha)
            ]);
            
            setFileContents(prev => ({
              ...prev,
              [filename]: {
                before: beforeContent || '',
                after: afterContent || '',
                loading: false
              }
            }));
          }
        } catch (error) {
          console.error('Failed to fetch file content:', error);
          setFileContents(prev => ({
            ...prev,
            [filename]: { before: '', after: '', loading: false }
          }));
        }
      }
    }
    
    setExpandedFiles(newExpandedFiles);
  };

  // Render diff view for a file
  const renderFileDiff = (filename: string, patch: string) => {
    const content = fileContents[filename];
    
    if (content?.loading) {
      return (
        <div className="p-8 text-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Loading file changes...</p>
        </div>
      );
    }
    
    // Parse the patch to show diff
    const lines = patch.split('\n');
    const diffLines: Array<{ type: 'add' | 'remove' | 'context'; content: string; lineNumber?: number }> = [];
    let currentLine = 0;
    
    for (const line of lines) {
      if (line.startsWith('@@')) {
        const match = line.match(/@@ -\d+,?\d* \+(\d+),?\d* @@/);
        if (match) {
          currentLine = parseInt(match[1]) - 1;
        }
        continue;
      }
      
      if (line.startsWith('+') && !line.startsWith('+++')) {
        currentLine++;
        diffLines.push({ type: 'add', content: line.substring(1), lineNumber: currentLine });
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        diffLines.push({ type: 'remove', content: line.substring(1) });
      } else if (line.startsWith(' ')) {
        currentLine++;
        diffLines.push({ type: 'context', content: line.substring(1), lineNumber: currentLine });
      }
    }
    
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-gray-700">{filename}</span>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="text-green-600">+{diffLines.filter(l => l.type === 'add').length}</span>
              <span className="text-red-600">-{diffLines.filter(l => l.type === 'remove').length}</span>
            </div>
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full font-mono text-sm">
            <tbody>
              {diffLines.map((line, index) => (
                <tr key={index} className={`
                  ${line.type === 'add' ? 'bg-green-50' : ''}
                  ${line.type === 'remove' ? 'bg-red-50' : ''}
                  ${line.type === 'context' ? 'bg-white' : ''}
                `}>
                  <td className="w-12 px-2 py-1 text-gray-500 text-right border-r border-gray-200 select-none">
                    {line.lineNumber || ''}
                  </td>
                  <td className="w-8 px-2 py-1 text-center border-r border-gray-200 select-none">
                    {line.type === 'add' ? (
                      <span className="text-green-600">+</span>
                    ) : line.type === 'remove' ? (
                      <span className="text-red-600">-</span>
                    ) : (
                      <span className="text-gray-400"> </span>
                    )}
                  </td>
                  <td className="px-2 py-1 whitespace-pre-wrap">
                    {line.content}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handleStartReview = async () => {
    if (!selectedRepo) {
      alert('Please select a repository first');
      return;
    }

    setReviewing(true);
    setReviewResult(null);
    setIssues([]);

    try {
      const [owner, repo] = selectedRepo.split('/');
      let result;
      
      if (selectedPR) {
        result = await startReview(owner, repo, selectedPR);
      } else {
        result = await startReview(owner, repo);
      }

      if (result.success) {
        setReviewResult(result.result);
        setIssues(result.result.issues || []);
      } else {
        alert(result.error || 'Review failed');
      }
    } catch (error) {
      console.error('Review failed:', error);
      alert('Review failed. Please try again.');
    } finally {
      setReviewing(false);
    }
  };

  const handleResumeReview = async () => {
    if (!selectedRepo) return;

    setReviewing(true);
    try {
      const result = await resumeReview(selectedRepo);
      if (result.success) {
        setReviewResult(result.result);
        setIssues(result.result.issues || []);
      }
    } catch (error) {
      console.error('Resume failed:', error);
    } finally {
      setReviewing(false);
    }
  };

  const handleFixAllIssues = () => {
    if (issues.length === 0) return;
    setShowConfirmModal(true);
  };

  const confirmFixAll = async () => {
    setShowConfirmModal(false);
    setFixing(true);

    try {
      const [owner, repo] = selectedRepo.split('/');
      const result = await fixIssuesWithAI(owner, repo, issues);
      
      if (result.success) {
        setCommitDetails({
          message: result.result.commitMessage || 'AI fixes applied',
          filesFixed: result.result.fixedFiles || [],
          issuesFixed: result.result.fixedIssues || issues.length,
          repositoryUrl: `https://github.com/${selectedRepo}`,
          commitSha: result.result.commitSha || 'latest'
        });
        setShowCommitModal(true);
        setIssues([]);
        setReviewResult(prev => ({ ...prev, issuesFound: 0 }));
      } else {
        alert(result.error || 'Fix failed');
      }
    } catch (error) {
      console.error('Fix failed:', error);
      alert('Fix failed. Please try again.');
    } finally {
      setFixing(false);
    }
  };

  const handleSingleIssueFix = async (issue: CodeIssue) => {
    try {
      const [owner, repo] = selectedRepo.split('/');
      const result = await fixIssuesWithAI(owner, repo, [issue]);
      
      if (result.success) {
        // Remove the fixed issue from the list
        const updatedIssues = issues.filter(i => i.id !== issue.id);
        setIssues(updatedIssues);
        
        // Update review result
        setReviewResult(prev => ({
          ...prev,
          issuesFound: updatedIssues.length,
          criticalIssues: updatedIssues.filter(i => i.severity === 'high').length
        }));
        
        setShowIssueModal(false);
      }
    } catch (error) {
      console.error('Single fix failed:', error);
      throw error;
    }
  };

  const handleManualFix = (issue: CodeIssue) => {
    const repoUrl = `https://github.com/${selectedRepo}`;
    const fileUrl = `${repoUrl}/blob/main/${issue.file}#L${issue.line}`;
    window.open(fileUrl, '_blank');
    setShowIssueModal(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return AlertTriangle;
      case 'medium': return AlertTriangle;
      case 'low': return Info;
      default: return Info;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return Shield;
      case 'performance': return Zap;
      case 'prettier': return Sparkles;
      case 'eslint': return Target;
      case 'best-practice': return CheckCircle;
      default: return Code;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'security': return 'text-red-600 bg-red-50';
      case 'performance': return 'text-purple-600 bg-purple-50';
      case 'prettier': return 'text-pink-600 bg-pink-50';
      case 'eslint': return 'text-blue-600 bg-blue-50';
      case 'best-practice': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getIssueStats = () => {
    const total = issues.length;
    const critical = issues.filter(i => i.severity === 'high').length;
    const warnings = issues.filter(i => i.severity === 'medium').length;
    const info = issues.filter(i => i.severity === 'low').length;
    const fixable = issues.filter(i => i.fixable).length;

    return { total, critical, warnings, info, fixable };
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    return diffInHours < 24 ? `${diffInHours}h ago` : `${Math.floor(diffInHours / 24)}d ago`;
  };

  const stats = getIssueStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onMenuClick={() => {}} 
        onSubscriptionClick={() => {}}
      />

      <OverlaySpinner 
        isVisible={reviewing || fixing} 
        text={reviewing ? "Analyzing your code..." : "Applying AI fixes..."} 
      />

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Code Review</h1>
            <p className="text-gray-600">
              Run AI-powered code reviews on your repositories
            </p>
          </motion.div>

          {/* Repository Selection */}
          <motion.div
            className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Repository</h3>
            <SearchableDropdown
              repositories={repositories}
              selectedRepo={selectedRepo}
              onRepoChange={handleRepoChange}
              placeholder="Choose a repository..."
            />
          </motion.div>

          {/* Pull Request Selection */}
          {selectedRepo && (
            <motion.div
              className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Review Target</h3>
              
              {loadingPRs ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3" />
                  <span className="text-gray-600">Loading pull requests...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Main Branch Option */}
                  <motion.div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedPR === null
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPR(null)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center gap-3">
                      <GitBranch size={20} className="text-gray-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">Review Main Branch</h4>
                        <p className="text-sm text-gray-600">Comprehensive review of the entire repository</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Pull Requests */}
                  {pullRequests.map((pr) => (
                    <motion.div
                      key={pr.number}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPR === pr.number
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPR(pr.number)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-start gap-3">
                        <GitPullRequest size={20} className="text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">#{pr.number}: {pr.title}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span>{pr.head.ref} → {pr.base.ref}</span>
                            <span>by {pr.user.login}</span>
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {getTimeAgo(pr.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {pullRequests.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <GitPullRequest size={48} className="mx-auto mb-4 text-gray-400" />
                      <p>No open pull requests found</p>
                      <p className="text-sm">You can still review the main branch</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Start Review Button */}
              <div className="mt-6 flex justify-end">
                <motion.button
                  onClick={handleStartReview}
                  disabled={!selectedRepo || reviewing || loadingPRs}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50"
                  whileHover={{ scale: reviewing ? 1 : 1.05 }}
                  whileTap={{ scale: reviewing ? 1 : 0.95 }}
                >
                  {reviewing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Reviewing...
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      {selectedPR ? `Review PR #${selectedPR}` : 'Review Main Branch'}
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Review Results */}
          {reviewResult && (
            <>
              {/* Stats Overview */}
              <motion.div
                className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-sm text-gray-600">Critical & Warnings</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
                  <div className="text-sm text-gray-600">Critical</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.warnings}</div>
                  <div className="text-sm text-gray-600">Warnings</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.fixable}</div>
                  <div className="text-sm text-gray-600">Auto-Fixable</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-purple-600">{selectedPR ? 'Changed Lines' : 'Full Repo'}</div>
                  <div className="text-sm text-gray-600">Review Scope</div>
                </div>
              </motion.div>

              {/* Actions */}
              {issues.length > 0 && (
                <motion.div
                  className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                      <p className="text-gray-600">Fix all issues automatically or review them individually</p>
                    </div>
                    <div className="flex gap-3">
                      <motion.button
                        onClick={handleFixAllIssues}
                        disabled={fixing || stats.fixable === 0}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50"
                        whileHover={{ scale: fixing ? 1 : 1.05 }}
                        whileTap={{ scale: fixing ? 1 : 0.95 }}
                      >
                        <Wand2 size={18} />
                        Fix All Issues ({stats.fixable})
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

            {/* Files Changed Section - Only for PR reviews */}
            {reviewResult && selectedPR && reviewResult.fileChanges && reviewResult.fileChanges.length > 0 && (
              <motion.div
                className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Files Changed</h3>
                    <p className="text-gray-600">{reviewResult.fileChanges.length} files modified in this PR</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {reviewResult.fileChanges.map((fileChange: any, index: number) => {
                    const fileIssues = issues.filter(issue => issue.file === fileChange.filename);
                    const criticalIssues = fileIssues.filter(issue => issue.severity === 'high').length;
                    const warningIssues = fileIssues.filter(issue => issue.severity === 'medium').length;
                    const isExpanded = expandedFiles.has(fileChange.filename);
                    
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case 'added': return 'text-green-600 bg-green-50';
                        case 'modified': return 'text-blue-600 bg-blue-50';
                        case 'removed': return 'text-red-600 bg-red-50';
                        case 'renamed': return 'text-purple-600 bg-purple-50';
                        default: return 'text-gray-600 bg-gray-50';
                      }
                    };

                    const getStatusIcon = (status: string) => {
                      switch (status) {
                        case 'added': return '+';
                        case 'modified': return '~';
                        case 'removed': return '-';
                        case 'renamed': return '→';
                        default: return '~';
                      }
                    };

                    return (
                      <motion.div
                        key={fileChange.filename}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <motion.div
                          className="p-4 hover:bg-gray-50 transition-all cursor-pointer"
                          onClick={() => toggleFileExpansion(fileChange.filename)}
                          whileHover={{ scale: 1.005 }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <motion.div
                                animate={{ rotate: isExpanded ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronRight size={16} className="text-gray-400" />
                              </motion.div>
                              
                              <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(fileChange.status)}`}>
                                {getStatusIcon(fileChange.status)}
                              </div>
                              
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileText size={16} className="text-gray-500 flex-shrink-0" />
                                <span className="font-medium text-gray-900 truncate">{fileChange.filename}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 flex-shrink-0">
                              {/* File Stats */}
                              <div className="flex items-center gap-3 text-sm">
                                {fileChange.additions > 0 && (
                                  <span className="text-green-600">+{fileChange.additions}</span>
                                )}
                                {fileChange.deletions > 0 && (
                                  <span className="text-red-600">-{fileChange.deletions}</span>
                                )}
                              </div>
                              
                              {/* Issue Badges */}
                              {fileIssues.length > 0 ? (
                                <div className="flex items-center gap-2">
                                  {criticalIssues > 0 && (
                                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                      {criticalIssues} critical
                                    </span>
                                  )}
                                  {warningIssues > 0 && (
                                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                                      {warningIssues} warnings
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                  ✓ Clean
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* File Description */}
                          <div className="mt-2 text-sm text-gray-600 ml-8">
                            {isExpanded 
                              ? 'Click to collapse file changes'
                              : fileIssues.length > 0 
                                ? `${fileIssues.length} issue${fileIssues.length > 1 ? 's' : ''} found - Click to view changes`
                                : 'Click to view file changes'
                            }
                          </div>
                        </motion.div>
                        
                        {/* Collapsible Diff Content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="border-t border-gray-200"
                            >
                              <div className="p-4">
                                {renderFileDiff(fileChange.filename, fileChange.patch || '')}
                                
                                {/* Show issues for this file */}
                                {fileIssues.length > 0 && (
                                  <div className="mt-4">
                                    <h4 className="font-medium text-gray-900 mb-3">Issues in this file:</h4>
                                    <div className="space-y-2">
                                      {fileIssues.map((issue, issueIndex) => (
                                        <div
                                          key={issueIndex}
                                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                                          onClick={() => {
                                            setSelectedIssue(issue);
                                            setShowIssueModal(true);
                                          }}
                                        >
                                          <AlertTriangle size={16} className={issue.severity === 'high' ? 'text-red-600' : 'text-orange-600'} />
                                          <div className="flex-1">
                                            <div className="font-medium text-gray-900">Line {issue.line}: {issue.message}</div>
                                            {issue.suggestion && (
                                              <div className="text-sm text-gray-600">💡 {issue.suggestion}</div>
                                            )}
                                          </div>
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                                            {issue.severity}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

              {/* Filters */}
              {issues.length > 0 && (
                <motion.div
                  className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search issues..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Severities</option>
                      <option value="high">Critical</option>
                      <option value="medium">Warning</option>
                      <option value="low">Info</option>
                    </select>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Categories</option>
                      <option value="security">Security</option>
                      <option value="performance">Performance</option>
                      <option value="prettier">Prettier</option>
                      <option value="eslint">ESLint</option>
                      <option value="best-practice">Best Practice</option>
                    </select>
                  </div>
                </motion.div>
              )}

              {/* Issues List */}
              {filteredIssues.length > 0 ? (
                <motion.div
                  data-issues-section
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  {filteredIssues.map((issue, index) => {
                    const SeverityIcon = getSeverityIcon(issue.severity);
                    const CategoryIcon = getCategoryIcon(issue.category || 'best-practice');
                    
                    return (
                      <motion.div
                        key={issue.id || index}
                        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => {
                          setSelectedIssue(issue);
                          setShowIssueModal(true);
                        }}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${getSeverityColor(issue.severity)}`}>
                            <SeverityIcon size={20} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-gray-900">{issue.file}:{issue.line}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                                {issue.severity}
                              </span>
                              {issue.category && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(issue.category)}`}>
                                  {issue.category}
                                </span>
                              )}
                              {issue.fixable && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                  Auto-fixable
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700 mb-2">{issue.message}</p>
                            {issue.suggestion && (
                              <p className="text-sm text-blue-600">💡 {issue.suggestion}</p>
                            )}
                          </div>
                          <ExternalLink size={16} className="text-gray-400" />
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : issues.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <Search size={48} className="text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No issues match your filters</h3>
                  <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                </div>
              ) : (
                <motion.div
                  className="bg-white rounded-xl border border-gray-200 p-12 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No issues found!</h3>
                  <p className="text-gray-600">Your code looks great. Keep up the good work!</p>
                </motion.div>
              )}
            </>
          )}

          {/* Empty State */}
          {!reviewResult && !reviewing && (
            <motion.div
              className="bg-white rounded-xl border border-gray-200 p-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Play size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to review your code?</h3>
              <p className="text-gray-600">Select a repository above and click "Start Review" to begin</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Issue Detail Modal */}
      <AnimatePresence>
        {showIssueModal && selectedIssue && (
          <IssueDetailModal
            issue={selectedIssue}
            onClose={() => setShowIssueModal(false)}
            onAIFix={handleSingleIssueFix}
            onManualFix={handleManualFix}
            repositoryUrl={`https://github.com/${selectedRepo}`}
          />
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <ConfirmationModal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            onConfirm={confirmFixAll}
            title="Fix All Issues"
            message={`Are you sure you want to apply AI fixes to all ${stats.fixable} fixable issues? This will create commits in your repository.`}
            confirmText="Fix All Issues"
            type="warning"
            loading={fixing}
          />
        )}
      </AnimatePresence>

      {/* Commit Success Modal */}
      <AnimatePresence>
        {showCommitModal && commitDetails && (
          <CommitSuccessModal
            isOpen={showCommitModal}
            onClose={() => setShowCommitModal(false)}
            commitDetails={commitDetails}
            loading={fixing}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TestReview;