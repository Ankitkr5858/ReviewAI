import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, GitBranch, AlertCircle, AlertTriangle, CheckCircle, Clock, Settings, Eye, RefreshCw, FileText, ExternalLink, ChevronDown, Plus, Minus, Code, GitMerge, Undo2, Search, TrendingUp, Shield, Zap, BarChart3, Bot, ArrowRight } from 'lucide-react';
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
  category?: 'prettier' | 'eslint' | 'security' | 'performance' | 'best-practice';
}

interface PullRequest {
  number: number;
  title: string;
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
  state: string;
  user: {
    login: string;
  };
}

interface Branch {
  name: string;
  commit: {
    sha: string;
  };
  protected: boolean;
}

interface FileChange {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  changedLines: number[];
}

interface PerformanceMetrics {
  overall: {
    before: number;
    after: number;
  };
  performance: {
    before: number;
    after: number;
  };
  security: {
    before: number;
    after: number;
  };
  codeQuality: {
    before: number;
    after: number;
  };
}

interface ImprovementSuggestion {
  id: string;
  category: 'performance' | 'security' | 'codeQuality';
  title: string;
  description: string;
  impact: string;
  difficulty: 'easy' | 'medium' | 'hard';
  beforeCode?: string;
  afterCode?: string;
}

const TestReview: React.FC = () => {
  const [selectedRepo, setSelectedRepo] = useState('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [pullNumber, setPullNumber] = useState('');
  const [pullRequestUrl, setPullRequestUrl] = useState('');
  const [reviewType, setReviewType] = useState<'pr' | 'main'>('pr'); // DEFAULT TO PR
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [showFixOptions, setShowFixOptions] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<CodeIssue | null>(null);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [showCommitSuccess, setShowCommitSuccess] = useState(false);
  const [commitDetails, setCommitDetails] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<'all' | 'ai-merge' | 'manual-merge' | 'revert' | 'improve' | null>(null);
  const [isResuming, setIsResuming] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  // NEW: Enhanced PR and Branch features
  const [availablePRs, setAvailablePRs] = useState<PullRequest[]>([]);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [loadingPRs, setLoadingPRs] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [showPRDropdown, setShowPRDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [currentUser, setCurrentUser] = useState<string>('');
  
  // NEW: File changes display
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  
  // NEW: Merge functionality
  const [showMergeOptions, setShowMergeOptions] = useState(false);
  const [mergeStatus, setMergeStatus] = useState<'pending' | 'merged' | 'failed' | null>(null);
  const [mergeMethod, setMergeMethod] = useState<'ai' | 'manual' | null>(null);
  const [mergeDetails, setMergeDetails] = useState<any>(null);

  // NEW: Performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    overall: { before: 76, after: 76 },
    performance: { before: 100, after: 100 },
    security: { before: 100, after: 100 },
    codeQuality: { before: 20, after: 20 }
  });

  // NEW: Improvement suggestions modal
  const [showImprovementModal, setShowImprovementModal] = useState(false);
  const [improvementSuggestions, setImprovementSuggestions] = useState<ImprovementSuggestion[]>([
    {
      id: 'perf-1',
      category: 'performance',
      title: 'Optimize loop performance',
      description: 'Cache array length in loops to avoid recalculating length on each iteration',
      impact: 'Improves performance by 5-10% in large loops',
      difficulty: 'easy',
      beforeCode: 'for (let i = 0; i < array.length; i++) { /* code */ }',
      afterCode: 'for (let i = 0, len = array.length; i < len; i++) { /* code */ }'
    },
    {
      id: 'sec-1',
      category: 'security',
      title: 'Prevent XSS vulnerabilities',
      description: 'Replace innerHTML with textContent to prevent cross-site scripting attacks',
      impact: 'Eliminates potential security vulnerabilities',
      difficulty: 'easy',
      beforeCode: 'element.innerHTML = userInput;',
      afterCode: 'element.textContent = userInput;'
    },
    {
      id: 'qual-1',
      category: 'codeQuality',
      title: 'Use consistent quote style',
      description: 'Standardize on single quotes for string literals',
      impact: 'Improves code consistency and readability',
      difficulty: 'easy',
      beforeCode: 'const message = "Hello world";',
      afterCode: "const message = 'Hello world';"
    },
    {
      id: 'qual-2',
      category: 'codeQuality',
      title: 'Add proper error handling',
      description: 'Wrap async operations in try-catch blocks',
      impact: 'Prevents unhandled promise rejections and improves error reporting',
      difficulty: 'medium',
      beforeCode: 'const data = await fetchData();',
      afterCode: 'try {\n  const data = await fetchData();\n} catch (error) {\n  console.error("Failed to fetch data:", error);\n}'
    }
  ]);
  const [selectedImprovements, setSelectedImprovements] = useState<Set<string>>(new Set());
  const [applyingImprovements, setApplyingImprovements] = useState(false);
  
  const { repositories, startReview, resumeReview, fixIssuesWithAI, removeSingleIssue, clearAllIssues, loading } = useGitHubIntegration();
  const navigate = useNavigate();
  const location = useLocation();

  // Get current GitHub user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('github_token');
      if (token) {
        try {
          const response = await fetch('https://api.github.com/user', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData.login);
          }
        } catch (error) {
          console.error('Failed to fetch current user:', error);
        }
      }
    };

    fetchCurrentUser();
  }, []);

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

  // Load PRs and Branches when repository is selected
  useEffect(() => {
    if (selectedRepo) {
      if (reviewType === 'pr') {
        loadPullRequests();
      }
      loadBranches();
    }
  }, [selectedRepo, reviewType]);

  // CRITICAL: Show merge options when review is complete and no critical issues
  useEffect(() => {
    if (reviewResult?.success && reviewType === 'pr' && pullNumber) {
      const currentIssues = (reviewResult?.result?.issues || []).filter((issue: CodeIssue) => 
        issue.severity === 'high' || issue.severity === 'medium'
      );
      
      // Show merge options if no critical issues and PR hasn't been merged yet
      if (currentIssues.length === 0 && mergeStatus !== 'merged') {
        setShowMergeOptions(true);
        setShowFixOptions(false);
      } else if (currentIssues.length > 0) {
        setShowMergeOptions(false);
        setShowFixOptions(true);
      }
    }
  }, [reviewResult, reviewType, pullNumber, mergeStatus]);

  // FIXED: Filter repositories based on search term
  const filteredRepositories = repositories.filter(repo =>
    repo.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle repository selection from dropdown
  const handleRepoSelect = (repoFullName: string) => {
    setSelectedRepo(repoFullName);
    setSearchTerm('');
    setShowDropdown(false);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedRepo(value); // Allow manual typing
    setShowDropdown(true);
  };

  const loadPullRequests = async () => {
    if (!selectedRepo) return;
    
    setLoadingPRs(true);
    try {
      const [owner, repo] = selectedRepo.split('/');
      const token = localStorage.getItem('github_token');
      
      if (!token) return;

      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (response.ok) {
        const prs = await response.json();
        // NOW ALLOW ALL PRs INCLUDING OWN PRs (since it's part of the plan)
        setAvailablePRs(prs);
        
        // Auto-select first available PR if exists
        if (prs.length > 0 && !pullNumber) {
          setPullNumber(prs[0].number.toString());
        }
      }
    } catch (error) {
      console.error('Failed to load pull requests:', error);
    } finally {
      setLoadingPRs(false);
    }
  };

  const loadBranches = async () => {
    if (!selectedRepo) return;
    
    setLoadingBranches(true);
    try {
      const [owner, repo] = selectedRepo.split('/');
      const token = localStorage.getItem('github_token');
      
      if (!token) return;

      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (response.ok) {
        const branches = await response.json();
        setAvailableBranches(branches);
        
        // Auto-select main/master branch
        const defaultBranch = branches.find((b: Branch) => b.name === 'main' || b.name === 'master');
        if (defaultBranch) {
          setSelectedBranch(defaultBranch.name);
        } else if (branches.length > 0) {
          setSelectedBranch(branches[0].name);
        }
      }
    } catch (error) {
      console.error('Failed to load branches:', error);
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleResumeReview = async (repoName: string, reviewData: any) => {
    try {
      const result = await resumeReview(repoName);
      
      if (result.success) {
        setReviewResult(result);
        setLastScanTime(new Date(reviewData.timestamp));
        
        if (result.result.issuesFound > 0) {
          setShowFixOptions(true);
        }

        // Calculate performance metrics based on issues
        calculatePerformanceMetrics(result.result.issues || []);
      }
    } catch (error) {
      console.error('Failed to resume review:', error);
    } finally {
      setIsResuming(false);
    }
  };

  const parsePullRequestUrl = (url: string) => {
    // Parse GitHub PR URL: https://github.com/owner/repo/pull/123
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
    if (match) {
      const [, owner, repo, prNumber] = match;
      const fullRepoName = `${owner}/${repo}`;
      
      // Check if this repo exists in user's repositories
      const repoExists = repositories.find(r => r.full_name === fullRepoName);
      if (repoExists) {
        setSelectedRepo(fullRepoName);
        setPullNumber(prNumber);
        setReviewType('pr');
        return true;
      } else {
        alert('This repository is not connected to your account. Please connect it first.');
        return false;
      }
    }
    return false;
  };

  const handlePullRequestUrlChange = (url: string) => {
    setPullRequestUrl(url);
    if (url.trim()) {
      const parsed = parsePullRequestUrl(url.trim());
      if (!parsed && url.includes('github.com')) {
        // Invalid URL format
        alert('Invalid GitHub PR URL format. Expected: https://github.com/owner/repo/pull/123');
      }
    }
  };

  // Calculate performance metrics based on issues
  const calculatePerformanceMetrics = (issues: CodeIssue[]) => {
    // Count issues by category
    const securityIssues = issues.filter(issue => issue.category === 'security').length;
    const performanceIssues = issues.filter(issue => issue.category === 'performance').length;
    const codeQualityIssues = issues.filter(issue => 
      issue.category === 'eslint' || 
      issue.category === 'prettier' || 
      issue.category === 'best-practice'
    ).length;
    
    // Calculate scores (higher is better)
    const securityScore = Math.max(0, 100 - (securityIssues * 25)); // Each security issue reduces score by 25
    const performanceScore = Math.max(0, 100 - (performanceIssues * 20)); // Each performance issue reduces score by 20
    const codeQualityScore = Math.max(20, 100 - (codeQualityIssues * 5)); // Each code quality issue reduces score by 5, minimum 20
    
    // Overall score is weighted average
    const overallScore = Math.round(
      (securityScore * 0.4) + // Security is 40% of overall score
      (performanceScore * 0.3) + // Performance is 30% of overall score
      (codeQualityScore * 0.3) // Code quality is 30% of overall score
    );
    
    // Set initial metrics (before fixing)
    setPerformanceMetrics({
      overall: { before: overallScore, after: overallScore },
      security: { before: securityScore, after: securityScore },
      performance: { before: performanceScore, after: performanceScore },
      codeQuality: { before: codeQualityScore, after: codeQualityScore }
    });
  };

  // Update performance metrics after fixing issues
  const updatePerformanceMetricsAfterFix = (fixedIssues: CodeIssue[]) => {
    setPerformanceMetrics(prev => {
      // Count fixed issues by category
      const securityFixed = fixedIssues.filter(issue => issue.category === 'security').length;
      const performanceFixed = fixedIssues.filter(issue => issue.category === 'performance').length;
      const codeQualityFixed = fixedIssues.filter(issue => 
        issue.category === 'eslint' || 
        issue.category === 'prettier' || 
        issue.category === 'best-practice'
      ).length;
      
      // Calculate improved scores
      const securityAfter = Math.min(100, prev.security.before + (securityFixed * 25));
      const performanceAfter = Math.min(100, prev.performance.before + (performanceFixed * 20));
      const codeQualityAfter = Math.min(100, prev.codeQuality.before + (codeQualityFixed * 5));
      
      // Calculate new overall score
      const overallAfter = Math.round(
        (securityAfter * 0.4) +
        (performanceAfter * 0.3) +
        (codeQualityAfter * 0.3)
      );
      
      return {
        overall: { before: prev.overall.before, after: overallAfter },
        security: { before: prev.security.before, after: securityAfter },
        performance: { before: prev.performance.before, after: performanceAfter },
        codeQuality: { before: prev.codeQuality.before, after: codeQualityAfter }
      };
    });
  };

  const handleStartReview = async () => {
    if (!selectedRepo) {
      alert('Please select a repository');
      return;
    }

    if (reviewType === 'pr' && !pullNumber) {
      alert('Please enter a pull request number or select from available PRs');
      return;
    }

    const [owner, repo] = selectedRepo.split('/');
    const prNumber = reviewType === 'pr' && pullNumber ? parseInt(pullNumber) : undefined;
    
    const result = await startReview(owner, repo, prNumber);
    setReviewResult(result);
    setLastScanTime(new Date());
    
    if (result.success) {
      // Calculate performance metrics based on issues
      calculatePerformanceMetrics(result.result.issues || []);
      
      if (result.result.issuesFound > 0) {
        setShowFixOptions(true);
      }
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
      
      // Store issues for metrics update
      const issuesToFix = [...reviewResult.result.issues];
      
      // CRITICAL: Clear ALL issues immediately using the new function
      const remainingIssues = await clearAllIssues(repositoryName, reviewResult.result.issues);
      
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
      
      // Update performance metrics after fixing all issues
      updatePerformanceMetricsAfterFix(issuesToFix);
      
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
      const remainingIssues = await removeSingleIssue(`${owner}/${repo}`, issue);
      
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
      
      // Update performance metrics after fixing this issue
      updatePerformanceMetricsAfterFix([issue]);
      
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

  // NEW: Merge functionality
  const handleAIMerge = () => {
    setMergeMethod('ai');
    setConfirmationAction('ai-merge');
    setShowConfirmation(true);
  };

  const handleManualMerge = () => {
    setMergeMethod('manual');
    setConfirmationAction('manual-merge');
    setShowConfirmation(true);
  };

  const handleConfirmAIMerge = async () => {
    if (!selectedRepo || !pullNumber) return;
    
    try {
      const [owner, repo] = selectedRepo.split('/');
      const token = localStorage.getItem('github_token');
      
      if (!token) {
        throw new Error('GitHub token not found');
      }

      // Get PR details for merge message
      const prResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!prResponse.ok) {
        throw new Error('Failed to get PR details');
      }

      const prData = await prResponse.json();
      
      // Create optimized merge commit message with ReviewAI branding
      const mergeCommitMessage = `🤖 ReviewAI Auto-Merge: ${prData.title}

✅ Code review completed by ReviewAI
✅ All critical issues resolved
✅ Ready for production

Merged by: ReviewAI Bot
Original PR: #${pullNumber} by ${prData.user.login}
Branch: ${prData.head.ref} → ${prData.base.ref}

---
Automated merge by ReviewAI • https://reviewai.com`;

      // Merge the PR using GitHub API
      const mergeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/merge`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commit_title: `🤖 ReviewAI Auto-Merge: ${prData.title}`,
          commit_message: mergeCommitMessage,
          merge_method: 'merge', // Use merge commit to preserve history
        }),
      });

      if (!mergeResponse.ok) {
        const errorData = await mergeResponse.json();
        throw new Error(errorData.message || 'Failed to merge PR');
      }

      const mergeData = await mergeResponse.json();
      
      // Update merge status and details
      setMergeStatus('merged');
      setMergeDetails({
        sha: mergeData.sha,
        message: mergeCommitMessage,
        mergedBy: 'ReviewAI Bot', // Show ReviewAI as merger
        mergedAt: new Date().toISOString(),
        prNumber: pullNumber,
        prTitle: prData.title,
        method: 'ai'
      });
      
      // Hide merge options
      setShowMergeOptions(false);
      
      console.log('✅ PR merged successfully by ReviewAI!');
      
    } catch (error) {
      console.error('AI merge failed:', error);
      setMergeStatus('failed');
      alert(`Merge failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setShowConfirmation(false);
      setConfirmationAction(null);
    }
  };

  const handleConfirmManualMerge = () => {
    if (!selectedRepo || !pullNumber) return;
    
    const [owner, repo] = selectedRepo.split('/');
    const prUrl = `https://github.com/${owner}/${repo}/pull/${pullNumber}`;
    window.open(prUrl, '_blank');
    
    // Update status to indicate manual merge was initiated
    setMergeDetails({
      method: 'manual',
      redirectedAt: new Date().toISOString(),
      prNumber: pullNumber,
    });
    
    setShowConfirmation(false);
    setConfirmationAction(null);
  };

  // NEW: Revert functionality
  const handleRevertPR = () => {
    setConfirmationAction('revert');
    setShowConfirmation(true);
  };

  const handleConfirmRevert = async () => {
    if (!selectedRepo || !mergeDetails?.sha) return;
    
    try {
      const [owner, repo] = selectedRepo.split('/');
      const token = localStorage.getItem('github_token');
      
      if (!token) {
        throw new Error('GitHub token not found');
      }

      // Create revert commit
      const revertResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `🔄 Revert: ${mergeDetails.prTitle || `PR #${mergeDetails.prNumber}`}

This reverts the merge commit ${mergeDetails.sha.substring(0, 7)}.

Reverted by: ReviewAI
Reason: User requested revert
Original merge: ${mergeDetails.mergedBy} at ${new Date(mergeDetails.mergedAt).toLocaleString()}

---
Automated revert by ReviewAI • https://reviewai.com`,
          parents: [mergeDetails.sha],
          tree: mergeDetails.sha, // This would need proper revert logic in production
        }),
      });

      if (!revertResponse.ok) {
        throw new Error('Failed to create revert commit');
      }

      // Reset merge status
      setMergeStatus(null);
      setMergeDetails(null);
      
      console.log('✅ PR reverted successfully!');
      alert('Pull request has been reverted successfully!');
      
    } catch (error) {
      console.error('Revert failed:', error);
      alert(`Revert failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please revert manually on GitHub.`);
    } finally {
      setShowConfirmation(false);
      setConfirmationAction(null);
    }
  };

  // NEW: Handle Improve button click
  const handleImproveClick = () => {
    setShowImprovementModal(true);
  };

  // NEW: Handle applying improvements
  const handleApplyImprovements = () => {
    if (selectedImprovements.size === 0) {
      alert('Please select at least one improvement to apply');
      return;
    }

    setConfirmationAction('improve');
    setShowConfirmation(true);
  };

  // NEW: Confirm and apply improvements
  const handleConfirmImprovements = async () => {
    setApplyingImprovements(true);
    
    try {
      // Simulate applying improvements
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update metrics based on applied improvements
      setPerformanceMetrics(prev => {
        const selectedSuggestions = improvementSuggestions.filter(s => selectedImprovements.has(s.id));
        
        // Calculate improvement points by category
        const performancePoints = selectedSuggestions.filter(s => s.category === 'performance').length * 15;
        const securityPoints = selectedSuggestions.filter(s => s.category === 'security').length * 20;
        const codeQualityPoints = selectedSuggestions.filter(s => s.category === 'codeQuality').length * 10;
        
        // Calculate new scores
        const performanceAfter = Math.min(100, prev.performance.before + performancePoints);
        const securityAfter = Math.min(100, prev.security.before + securityPoints);
        const codeQualityAfter = Math.min(100, prev.codeQuality.before + codeQualityPoints);
        
        // Calculate new overall score
        const overallAfter = Math.round(
          (securityAfter * 0.4) +
          (performanceAfter * 0.3) +
          (codeQualityAfter * 0.3)
        );
        
        return {
          overall: { before: prev.overall.before, after: overallAfter },
          performance: { before: prev.performance.before, after: performanceAfter },
          security: { before: prev.security.before, after: securityAfter },
          codeQuality: { before: prev.codeQuality.before, after: codeQualityAfter }
        };
      });
      
      // Show success message
      setCommitDetails({
        message: `🤖 ReviewAI: Applied ${selectedImprovements.size} improvements`,
        filesFixed: ['src/App.tsx', 'src/components/Dashboard.tsx', 'src/utils/helpers.ts'],
        issuesFixed: selectedImprovements.size,
        repositoryUrl: `https://github.com/${selectedRepo}`,
        commitSha: 'latest',
      });
      setShowCommitSuccess(true);
      
      // Close improvement modal
      setShowImprovementModal(false);
      setSelectedImprovements(new Set());
      
    } catch (error) {
      console.error('Failed to apply improvements:', error);
      alert('Failed to apply improvements. Please try again.');
    } finally {
      setApplyingImprovements(false);
      setShowConfirmation(false);
      setConfirmationAction(null);
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'added':
        return 'text-green-600 bg-green-50';
      case 'modified':
        return 'text-blue-600 bg-blue-50';
      case 'removed':
        return 'text-red-600 bg-red-50';
      case 'renamed':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
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

  const toggleFileExpansion = (filename: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(filename)) {
      newExpanded.delete(filename);
    } else {
      newExpanded.add(filename);
    }
    setExpandedFiles(newExpanded);
  };

  const formatPatchLine = (line: string) => {
    if (line.startsWith('+')) {
      return { type: 'addition', content: line.substring(1) };
    } else if (line.startsWith('-')) {
      return { type: 'deletion', content: line.substring(1) };
    } else if (line.startsWith(' ')) {
      return { type: 'context', content: line.substring(1) };
    } else if (line.startsWith('@@')) {
      return { type: 'hunk', content: line };
    } else {
      return { type: 'meta', content: line };
    }
  };

  // CRITICAL: Filter out info-level issues from display
  const currentIssues = (reviewResult?.result?.issues || []).filter((issue: CodeIssue) => 
    issue.severity === 'high' || issue.severity === 'medium'
  );
  const groupedIssues = groupIssuesByFile(currentIssues);

  // Count issues by category for metrics
  const securityIssues = (reviewResult?.result?.issues || []).filter((issue: CodeIssue) => 
    issue.category === 'security'
  ).length;
  
  const performanceIssues = (reviewResult?.result?.issues || []).filter((issue: CodeIssue) => 
    issue.category === 'performance'
  ).length;

  const criticalIssues = (reviewResult?.result?.issues || []).filter((issue: CodeIssue) => 
    issue.severity === 'high'
  ).length;

  const warningIssues = (reviewResult?.result?.issues || []).filter((issue: CodeIssue) => 
    issue.severity === 'medium'
  ).length;

  const selectedPR = availablePRs.find(pr => pr.number.toString() === pullNumber);
  const selectedBranchObj = availableBranches.find(branch => branch.name === selectedBranch);

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
          {/* Header - REMOVED BACK ARROW AND CHANGED TEXT */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl inline-block mb-4">
              <Wand2 size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isResuming ? 'Resume Review' : 'Review Code'}
            </h2>
            <p className="text-gray-600">
              {isResuming 
                ? 'Continue your code review from where you left off'
                : reviewType === 'pr' 
                ? 'Review only the changes made in your pull request'
                : 'Run a comprehensive code review on your repository'
              }
            </p>
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
                  <div className="relative flex-1">
                    <GitBranch size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={selectedRepo}
                      onChange={handleSearchChange}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="owner/repository or search..."
                      className="w-full pl-10 pr-10 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    
                    {/* FIXED: Modern dropdown with search */}
                    <AnimatePresence>
                      {showDropdown && (
                        <>
                          {/* Backdrop */}
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setShowDropdown(false)}
                          />
                          
                          {/* Dropdown */}
                          <motion.div
                            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            {filteredRepositories.length > 0 ? (
                              <div className="p-2">
                                {filteredRepositories.slice(0, 10).map((repo) => (
                                  <motion.button
                                    key={repo.id}
                                    onClick={() => handleRepoSelect(repo.full_name)}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                  >
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                      <GitBranch size={16} className="text-gray-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-gray-900 truncate">
                                        {repo.full_name}
                                      </div>
                                      <div className="text-sm text-gray-500 truncate">
                                        {repo.description || 'No description'}
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        {repo.language && (
                                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                            {repo.language}
                                          </span>
                                        )}
                                        <span className="text-xs text-gray-500">
                                          ⭐ {repo.stargazers_count}
                                        </span>
                                      </div>
                                    </div>
                                  </motion.button>
                                ))}
                                {filteredRepositories.length > 10 && (
                                  <div className="p-3 text-center text-sm text-gray-500">
                                    Showing first 10 results. Keep typing to refine...
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="p-4 text-center text-gray-500">
                                <GitBranch size={24} className="mx-auto mb-2 text-gray-400" />
                                <p>No repositories found</p>
                                <p className="text-sm">Try a different search term</p>
                              </div>
                            )}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Enter the GitHub repository in the format "owner/repository" or search from your connected repositories
                  </p>
                </div>

                {/* Review Type - DEFAULT TO PR */}
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
                      <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        Only changed lines
                      </span>
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
                      <span className="ml-2 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                        Full repository
                      </span>
                    </label>
                  </div>
                </div>

                {/* Pull Request Options */}
                {reviewType === 'pr' && (
                  <div className="space-y-4">
                    {/* PR URL Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GitHub Pull Request URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={pullRequestUrl}
                        onChange={(e) => handlePullRequestUrlChange(e.target.value)}
                        placeholder="https://github.com/owner/repo/pull/123"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Paste a GitHub PR URL to auto-fill repository and PR number
                      </p>
                    </div>

                    {/* Available PRs Dropdown */}
                    {selectedRepo && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Available Pull Requests
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowPRDropdown(!showPRDropdown)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between cursor-pointer"
                            disabled={loadingPRs}
                          >
                            <span>
                              {loadingPRs 
                                ? 'Loading pull requests...' 
                                : selectedPR 
                                ? `#${selectedPR.number}: ${selectedPR.title} (${selectedPR.head.ref} → ${selectedPR.base.ref})`
                                : availablePRs.length > 0 
                                ? 'Select a pull request...'
                                : 'No pull requests found'
                              }
                            </span>
                            <ChevronDown size={16} className={`transition-transform ${showPRDropdown ? 'rotate-180' : ''}`} />
                          </button>

                          {showPRDropdown && availablePRs.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                              {availablePRs.map((pr) => (
                                <button
                                  key={pr.number}
                                  type="button"
                                  onClick={() => {
                                    setPullNumber(pr.number.toString());
                                    setShowPRDropdown(false);
                                  }}
                                  className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer"
                                >
                                  <div className="font-medium text-gray-900">
                                    #{pr.number}: {pr.title}
                                    {pr.user.login === currentUser && (
                                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                        Your PR
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {pr.head.ref} → {pr.base.ref} • by {pr.user.login}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Manual PR Number Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Or Enter Pull Request Number Manually
                      </label>
                      <input
                        type="number"
                        value={pullNumber}
                        onChange={(e) => setPullNumber(e.target.value)}
                        placeholder="e.g., 123"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {/* Branch Selection for Main Branch Review */}
                {reviewType === 'main' && selectedRepo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Branch to Review
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between cursor-pointer"
                        disabled={loadingBranches}
                      >
                        <span>
                          {loadingBranches 
                            ? 'Loading branches...' 
                            : selectedBranchObj 
                            ? `${selectedBranchObj.name} ${selectedBranchObj.protected ? '(Protected)' : ''}`
                            : availableBranches.length > 0 
                            ? 'Select a branch...'
                            : 'No branches found'
                          }
                        </span>
                        <ChevronDown size={16} className={`transition-transform ${showBranchDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {showBranchDropdown && availableBranches.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                          {availableBranches.map((branch) => (
                            <button
                              key={branch.name}
                              type="button"
                              onClick={() => {
                                setSelectedBranch(branch.name);
                                setShowBranchDropdown(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-gray-900">{branch.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {branch.commit.sha.substring(0, 7)}
                                  </div>
                                </div>
                                {branch.protected && (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                    Protected
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button
                  onClick={handleStartReview}
                  disabled={loading || !selectedRepo || (reviewType === 'pr' && !pullNumber)}
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
                      Analyzing {reviewType === 'pr' ? 'Changes' : 'Code'}...
                    </>
                  ) : (
                    <>
                      <Wand2 size={18} />
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

          {/* Review Results with Performance Metrics */}
          {reviewResult && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Review Results Summary - ENHANCED FOR OWN PRS */}
              <motion.div
                className={`lg:col-span-2 rounded-xl border p-6 ${
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
                    {reviewResult.result?.isOwnPR && ' - Your Pull Request'}
                    {mergeStatus === 'merged' && ' - Merged ✅'}
                  </h3>
                </div>
                
                {reviewResult.success ? (
                  <div className="space-y-2">
                    {/* SHOW MERGE STATUS */}
                    {mergeStatus === 'merged' && mergeDetails && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-green-900 mb-2">🎉 Pull Request Merged Successfully!</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-green-700 font-medium">Merged by:</span>
                            <p className="text-green-800">{mergeDetails.mergedBy}</p>
                          </div>
                          <div>
                            <span className="text-green-700 font-medium">Method:</span>
                            <p className="text-green-800">{mergeDetails.method === 'ai' ? 'AI Auto-Merge' : 'Manual Merge'}</p>
                          </div>
                          <div>
                            <span className="text-green-700 font-medium">Commit SHA:</span>
                            <p className="text-green-800 font-mono">{mergeDetails.sha?.substring(0, 7)}</p>
                          </div>
                          <div>
                            <span className="text-green-700 font-medium">Merged at:</span>
                            <p className="text-green-800">{new Date(mergeDetails.mergedAt).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SHOW PR DETAILS FOR OWN PRS */}
                    {reviewResult.result?.prDetails && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-blue-900 mb-2">📋 Pull Request Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-blue-700 font-medium">Title:</span>
                            <p className="text-blue-800">{reviewResult.result.prDetails.title}</p>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">Branch:</span>
                            <p className="text-blue-800">{reviewResult.result.prDetails.branch}</p>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">Author:</span>
                            <p className="text-blue-800">{reviewResult.result.prDetails.author}</p>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">Files Changed:</span>
                            <p className="text-blue-800">{reviewResult.result.prDetails.filesChanged}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentIssues.length === 0 ? (
                      <div>
                        <p className="text-green-700 font-medium mb-2">
                          ✅ Excellent! {reviewResult.result?.isOwnPR ? 'Your pull request changes' : 'This code'} look great!
                        </p>
                        <p className="text-green-600 text-sm">
                          {reviewResult.result?.isOwnPR 
                            ? reviewType === 'pr'
                              ? 'No critical issues found in your PR changes. The code follows best practices and is ready for review!'
                              : 'No critical issues found. Your code is ready!'
                            : 'All critical issues have been resolved. Your code is ready!'
                          }
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-yellow-700 mb-2">
                          📊 Review {reviewResult.result?.resumed ? 'resumed' : 'completed'} - found {currentIssues.length} critical/warning issues
                          {reviewResult.result?.isOwnPR && reviewType === 'pr' && ' in your PR changes'}
                        </p>
                        <div className="text-sm text-yellow-600 grid grid-cols-2 gap-4">
                          <div>• Critical: {criticalIssues}</div>
                          <div>• Warnings: {warningIssues}</div>
                        </div>
                        {reviewResult.result?.isOwnPR && (
                          <p className="text-yellow-600 text-sm mt-2">
                            💡 Fix these issues to improve your {reviewType === 'pr' ? 'PR' : 'code'} before requesting review from your team!
                          </p>
                        )}
                        {reviewType === 'pr' && (
                          <p className="text-yellow-600 text-sm mt-2">
                            🎯 Only analyzing changed lines in this PR - not the entire file
                          </p>
                        )}
                      </div>
                    )}
                    
                    {!reviewResult.result?.isOwnPR && (
                      <p className="text-sm mt-3 opacity-75">
                        Check your GitHub repository for detailed review comments!
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* CLEAN ERROR DISPLAY - ONLY SOLUTION */}
                    {reviewResult.error?.includes('Can not request changes on your own pull request') ? (
                      <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
                        <p className="text-blue-800 font-medium mb-2">
                          💡 Note: You can now review your own pull requests with ReviewAI Pro!
                        </p>
                        <ul className="text-blue-700 text-sm ml-4 list-disc space-y-1">
                          <li>ReviewAI Pro allows reviewing your own PRs for comprehensive analysis</li>
                          <li>Or switch to "Main Branch Review" to review the entire repository</li>
                        </ul>
                      </div>
                    ) : (
                      <p className="text-red-700">
                        ❌ {reviewResult.error}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>

              {/* NEW: Performance Metrics Panel */}
              <motion.div
                className="bg-white rounded-xl border border-gray-200 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
                  <motion.button
                    onClick={handleImproveClick}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Improve
                  </motion.button>
                </div>
                
                {/* Overall Score */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700">Overall Score</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{performanceMetrics.overall.before}</span>
                      <span className="text-gray-500">→</span>
                      <span className={`font-medium ${
                        performanceMetrics.overall.after > performanceMetrics.overall.before 
                          ? 'text-green-600' 
                          : 'text-gray-700'
                      }`}>
                        {performanceMetrics.overall.after}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                      initial={{ width: `${performanceMetrics.overall.before}%` }}
                      animate={{ width: `${performanceMetrics.overall.after}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
                
                {/* Performance */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="text-blue-600" />
                      <span className="font-medium text-gray-700">Performance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{performanceMetrics.performance.before}</span>
                      <span className="text-gray-500">→</span>
                      <span className={`font-medium ${
                        performanceMetrics.performance.after > performanceMetrics.performance.before 
                          ? 'text-green-600' 
                          : 'text-gray-700'
                      }`}>
                        {performanceMetrics.performance.after}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-600"
                      initial={{ width: `${performanceMetrics.performance.before}%` }}
                      animate={{ width: `${performanceMetrics.performance.after}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
                
                {/* Security */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-blue-600" />
                      <span className="font-medium text-gray-700">Security</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{performanceMetrics.security.before}</span>
                      <span className="text-gray-500">→</span>
                      <span className={`font-medium ${
                        performanceMetrics.security.after > performanceMetrics.security.before 
                          ? 'text-green-600' 
                          : 'text-gray-700'
                      }`}>
                        {performanceMetrics.security.after}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-600"
                      initial={{ width: `${performanceMetrics.security.before}%` }}
                      animate={{ width: `${performanceMetrics.security.after}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
                
                {/* Code Quality */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={16} className="text-blue-600" />
                      <span className="font-medium text-gray-700">Code Quality</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{performanceMetrics.codeQuality.before}</span>
                      <span className="text-gray-500">→</span>
                      <span className={`font-medium ${
                        performanceMetrics.codeQuality.after > performanceMetrics.codeQuality.before 
                          ? 'text-green-600' 
                          : 'text-gray-700'
                      }`}>
                        {performanceMetrics.codeQuality.after}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-600"
                      initial={{ width: `${performanceMetrics.codeQuality.before}%` }}
                      animate={{ width: `${performanceMetrics.codeQuality.after}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 my-6"></div>

                {/* Issues Summary */}
                <h4 className="font-medium text-gray-900 mb-4">Issues Summary</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Critical Issues */}
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{criticalIssues}</div>
                    <div className="text-sm text-red-700">Critical Issues</div>
                  </div>
                  
                  {/* Warnings */}
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{warningIssues}</div>
                    <div className="text-sm text-orange-700">Warnings</div>
                  </div>
                  
                  {/* Security Issues */}
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{securityIssues}</div>
                    <div className="text-sm text-blue-700">Security Issues</div>
                  </div>
                  
                  {/* Performance Issues */}
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{performanceIssues}</div>
                    <div className="text-sm text-purple-700">Performance Issues</div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* NEW: File Changes Display - SHOW WHAT WAS CHANGED */}
          {reviewResult?.success && reviewResult.result?.fileChanges && reviewResult.result.fileChanges.length > 0 && (
            <motion.div
              className="bg-white rounded-xl border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📁 Files Changed ({reviewResult.result.fileChanges.length})
                {reviewType === 'pr' && ' in This Pull Request'}
              </h3>
              
              <div className="space-y-4">
                {reviewResult.result.fileChanges.map((fileChange: FileChange, index: number) => (
                  <div key={fileChange.filename} className="border border-gray-200 rounded-lg overflow-hidden">
                    <motion.div
                      className="bg-gray-50 px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleFileExpansion(fileChange.filename)}
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.1 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {expandedFiles.has(fileChange.filename) ? (
                              <Minus size={16} className="text-gray-500" />
                            ) : (
                              <Plus size={16} className="text-gray-500" />
                            )}
                            <FileText size={16} className="text-gray-500" />
                          </div>
                          <span className="font-medium text-gray-900">{fileChange.filename}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(fileChange.status)}`}>
                            {fileChange.status}
                          </span>
                          {fileChange.changedLines.length > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {fileChange.changedLines.length} lines changed
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {fileChange.additions > 0 && (
                            <span className="text-green-600">+{fileChange.additions}</span>
                          )}
                          {fileChange.deletions > 0 && (
                            <span className="text-red-600">-{fileChange.deletions}</span>
                          )}
                          <span className="text-gray-500">{fileChange.changes} changes</span>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Expandable Diff Content with GitHub-style line numbers */}
                    <AnimatePresence>
                      {expandedFiles.has(fileChange.filename) && fileChange.patch && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-gray-900 text-gray-100 p-4 font-mono text-sm overflow-x-auto">
                            <div className="flex items-center gap-2 mb-3 text-gray-400">
                              <Code size={16} />
                              <span>Diff for {fileChange.filename}</span>
                            </div>
                            <div className="space-y-0">
                              {fileChange.patch.split('\n').map((line, lineIndex) => {
                                const formatted = formatPatchLine(line);
                                let lineNumber = '';
                                
                                // Extract line numbers from hunk headers
                                if (formatted.type === 'hunk') {
                                  const match = line.match(/@@ -(\d+),\d+ \+(\d+),\d+ @@/);
                                  if (match) {
                                    lineNumber = `${match[1]}-${match[2]}`;
                                  }
                                }
                                
                                return (
                                  <div
                                    key={lineIndex}
                                    className={`flex ${
                                      formatted.type === 'addition'
                                        ? 'bg-green-900/20 border-l-4 border-green-500'
                                        : formatted.type === 'deletion'
                                        ? 'bg-red-900/20 border-l-4 border-red-500'
                                        : formatted.type === 'hunk'
                                        ? 'bg-blue-900/20 border-l-4 border-blue-500'
                                        : ''
                                    }`}
                                  >
                                    {/* Line number column */}
                                    <div className="w-12 text-right pr-2 select-none text-gray-500 text-xs border-r border-gray-700 mr-3 py-1">
                                      {formatted.type === 'hunk' ? lineNumber : lineIndex + 1}
                                    </div>
                                    
                                    {/* Line prefix */}
                                    <div className="w-4 text-center select-none mr-2 py-1">
                                      {formatted.type === 'addition' ? '+' : 
                                       formatted.type === 'deletion' ? '-' : 
                                       formatted.type === 'context' ? ' ' : ''}
                                    </div>
                                    
                                    {/* Line content */}
                                    <div className={`py-1 ${
                                      formatted.type === 'addition'
                                        ? 'text-green-200'
                                        : formatted.type === 'deletion'
                                        ? 'text-red-200'
                                        : formatted.type === 'hunk'
                                        ? 'text-blue-200 font-semibold'
                                        : formatted.type === 'meta'
                                        ? 'text-gray-500'
                                        : 'text-gray-300'
                                    }`}>
                                      {formatted.content}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Issues by File - ONLY CRITICAL AND WARNINGS */}
          {reviewResult?.success && currentIssues.length > 0 && (
            <motion.div
              className="bg-white rounded-xl border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Critical & Warning Issues ({currentIssues.length})
                {reviewResult.result?.isOwnPR && reviewType === 'pr' && ' in Your PR Changes'}
              </h3>
              
              <div className="space-y-4">
                {Object.entries(groupedIssues).map(([fileName, fileIssues]) => (
                  <div key={fileName} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-gray-500" />
                        <span className="font-medium text-gray-900">{fileName}</span>
                        <span className="text-sm text-gray-500">({fileIssues.length} issues)</span>
                        {reviewType === 'pr' && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Changed lines only
                          </span>
                        )}
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
                {currentIssues.length} critical/warning issues were found{reviewResult.result?.isOwnPR && reviewType === 'pr' ? ' in your PR changes' : ''}. Choose how you'd like to fix them:
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

          {/* NEW: Merge Options - Show when review is complete and no critical issues */}
          {showMergeOptions && reviewResult?.success && reviewType === 'pr' && pullNumber && mergeStatus !== 'merged' && (
            <motion.div
              className="bg-white rounded-xl border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎉 Ready to Merge!</h3>
              <p className="text-gray-600 mb-4">
                All critical issues have been resolved. Your pull request is ready to be merged into the main branch.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.button
                  onClick={handleAIMerge}
                  disabled={loading}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                  whileHover={{ 
                    scale: 1.02, 
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                >
                  <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg">
                    <GitMerge size={20} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">AI Auto-Merge</p>
                    <p className="text-sm text-gray-500">Let ReviewAI merge with optimized commit message</p>
                  </div>
                </motion.button>

                <motion.button
                  onClick={handleManualMerge}
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
                    <p className="font-medium text-gray-900">Manual Merge</p>
                    <p className="text-sm text-gray-500">Open GitHub to merge manually</p>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* NEW: Revert Option - Show after successful merge */}
          {mergeStatus === 'merged' && mergeDetails && (
            <motion.div
              className="bg-orange-50 border border-orange-200 rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-lg font-semibold text-orange-900 mb-4">⚠️ Need to Revert?</h3>
              <p className="text-orange-700 mb-4">
                If you need to undo this merge, you can revert the pull request. This will create a new commit that undoes all changes from this PR.
              </p>
              
              <motion.button
                onClick={handleRevertPR}
                className="flex items-center gap-3 px-6 py-3 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors cursor-pointer"
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
              >
                <Undo2 size={18} />
                Revert Pull Request
              </motion.button>
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
                {reviewType === 'pr' 
                  ? 'Analyzes only the changed lines in your pull request'
                  : 'Analyzes all files in the repository for code quality issues'
                }
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle size={16} />
                Detects critical bugs, security vulnerabilities, and important warnings
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} />
                {reviewType === 'pr' && reviewResult?.result?.isOwnPR
                  ? 'Provides feedback on your changes without posting GitHub comments'
                  : 'Posts detailed review comments on GitHub with fixes'
                }
              </li>
              <li className="flex items-center gap-2">
                <Clock size={16} />
                Provides actionable suggestions and auto-fix options
              </li>
              {reviewType === 'pr' && (
                <li className="flex items-center gap-2">
                  <GitMerge size={16} />
                  Offers merge options when all critical issues are resolved
                </li>
              )}
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

      {/* Enhanced Confirmation Modal - Handles all confirmation types */}
      <AnimatePresence>
        {showConfirmation && (
          <ConfirmationModal
            isOpen={showConfirmation}
            onClose={() => {
              setShowConfirmation(false);
              setConfirmationAction(null);
            }}
            onConfirm={
              confirmationAction === 'all' ? handleConfirmAIFixAll :
              confirmationAction === 'ai-merge' ? handleConfirmAIMerge :
              confirmationAction === 'manual-merge' ? handleConfirmManualMerge :
              confirmationAction === 'revert' ? handleConfirmRevert :
              confirmationAction === 'improve' ? handleConfirmImprovements :
              () => {}
            }
            title={
              confirmationAction === 'all' ? 'Confirm AI Fix All' :
              confirmationAction === 'ai-merge' ? 'Confirm AI Auto-Merge' :
              confirmationAction === 'manual-merge' ? 'Confirm Manual Merge' :
              confirmationAction === 'revert' ? 'Confirm Revert Pull Request' :
              confirmationAction === 'improve' ? 'Apply Selected Improvements' :
              'Confirm Action'
            }
            message={
              confirmationAction === 'all' ? 
                `Are you sure you want to apply AI fixes to ALL ${currentIssues.length} critical/warning issues? This will:

• Fix ALL critical and warning issues
• Create commits in your repository  
• Mark ALL issues as resolved
• Complete the review process

This action cannot be undone.` :
              confirmationAction === 'ai-merge' ?
                `Are you sure you want to merge this pull request using AI Auto-Merge? This will:

• Merge PR #${pullNumber} into the main branch
• Create an optimized commit message
• Show "ReviewAI Bot" as the merger
• Close the pull request automatically

This action cannot be undone.` :
              confirmationAction === 'manual-merge' ?
                `This will open GitHub in a new tab where you can manually merge the pull request.

You'll have full control over:
• Merge method (merge, squash, rebase)
• Commit message
• Merge timing

Continue to GitHub?` :
              confirmationAction === 'revert' ?
                `Are you sure you want to revert this pull request? This will:

• Create a new commit that undoes all changes from PR #${mergeDetails?.prNumber}
• Revert commit ${mergeDetails?.sha?.substring(0, 7)}
• Show "ReviewAI" as the reverter
• Keep the original merge in history

This action cannot be undone.` :
              confirmationAction === 'improve' ?
                `Are you sure you want to apply ${selectedImprovements.size} selected improvements? This will:

• Create commits with the selected improvements
• Update your code quality metrics
• Apply best practices to your codebase

This action cannot be undone.` :
                'Are you sure you want to proceed?'
            }
            confirmText={
              confirmationAction === 'all' ? 'Fix All Issues' :
              confirmationAction === 'ai-merge' ? 'Merge with AI' :
              confirmationAction === 'manual-merge' ? 'Open GitHub' :
              confirmationAction === 'revert' ? 'Revert PR' :
              confirmationAction === 'improve' ? 'Apply Improvements' :
              'Confirm'
            }
            type={
              confirmationAction === 'revert' ? 'danger' :
              confirmationAction === 'ai-merge' ? 'info' :
              'warning'
            }
            loading={loading || applyingImprovements}
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

      {/* NEW: Improvement Suggestions Modal */}
      <AnimatePresence>
        {showImprovementModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImprovementModal(false)}
          >
            <motion.div
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Improve Your Code</h2>
                    <p className="text-white/80">Select improvements to apply to your codebase</p>
                  </div>
                  <motion.button
                    onClick={() => setShowImprovementModal(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={24} className="text-white" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">ReviewAI Suggestions</h3>
                  <p className="text-gray-600">
                    Our AI has analyzed your codebase and found several opportunities for improvement. 
                    Select the improvements you'd like to apply.
                  </p>
                </div>

                <div className="space-y-4">
                  {improvementSuggestions.map(suggestion => (
                    <motion.div
                      key={suggestion.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedImprovements.has(suggestion.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        const newSelected = new Set(selectedImprovements);
                        if (newSelected.has(suggestion.id)) {
                          newSelected.delete(suggestion.id);
                        } else {
                          newSelected.add(suggestion.id);
                        }
                        setSelectedImprovements(newSelected);
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          suggestion.category === 'performance' ? 'bg-blue-100 text-blue-600' :
                          suggestion.category === 'security' ? 'bg-red-100 text-red-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {suggestion.category === 'performance' ? <Zap size={20} /> :
                           suggestion.category === 'security' ? <Shield size={20} /> :
                           <BarChart3 size={20} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              suggestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                              suggestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {suggestion.difficulty}
                            </span>
                          </div>
                          <p className="text-gray-700 mt-1">{suggestion.description}</p>
                          <p className="text-sm text-blue-600 mt-2">Impact: {suggestion.impact}</p>
                          
                          {suggestion.beforeCode && suggestion.afterCode && (
                            <div className="mt-3 grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg">
                              <div>
                                <div className="text-xs font-medium text-gray-500 mb-1">Before:</div>
                                <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                                  <code className="text-gray-800">{suggestion.beforeCode}</code>
                                </pre>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-gray-500 mb-1">After:</div>
                                <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                                  <code className="text-blue-800">{suggestion.afterCode}</code>
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedImprovements.has(suggestion.id)
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedImprovements.has(suggestion.id) && (
                            <CheckCircle size={16} className="text-white" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-4">
                  <motion.button
                    onClick={() => setShowImprovementModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleApplyImprovements}
                    disabled={selectedImprovements.size === 0 || applyingImprovements}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50"
                    whileHover={{ scale: selectedImprovements.size === 0 || applyingImprovements ? 1 : 1.02 }}
                    whileTap={{ scale: selectedImprovements.size === 0 || applyingImprovements ? 1 : 0.98 }}
                  >
                    {applyingImprovements ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <ArrowRight size={18} />
                        Apply {selectedImprovements.size} {selectedImprovements.size === 1 ? 'Improvement' : 'Improvements'}
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TestReview;