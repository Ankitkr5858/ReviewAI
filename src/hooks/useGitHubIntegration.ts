import { useState, useEffect } from 'react';
import { GitHubService } from '../services/github';
import { ReviewBot } from '../services/reviewBot';

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  language: string;
  updated_at: string;
  html_url: string;
  open_issues_count: number;
  stargazers_count: number;
  forks_count: number;
  private: boolean;
}

export interface DashboardStats {
  reviewsCompleted: number;
  activeRepositories: number;
  issuesResolved: number;
  timeSaved: string;
  connectedUsers: number;
}

export interface ActiveReview {
  id: string;
  repository: string;
  branch: string;
  status: 'in-progress' | 'completed' | 'review-required';
  issues: number;
  timeAgo: string;
  progress: number;
  lastReviewDate?: string;
  repositoryUrl?: string;
  reviewData?: any;
}

export interface RecentActivity {
  id: string;
  type: 'merge' | 'review' | 'issue' | 'pr' | 'branch' | 'schedule' | 'fix';
  message: string;
  time: string;
  repository?: string;
  repositoryUrl?: string;
  clickable?: boolean;
  details?: any;
}

export const useGitHubIntegration = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    reviewsCompleted: 0,
    activeRepositories: 0,
    issuesResolved: 0,
    timeSaved: '0h',
    connectedUsers: 1
  });
  const [activeReviews, setActiveReviews] = useState<ActiveReview[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectGitHub = async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const github = new GitHubService(token);
      
      // Get all repositories (including private ones)
      const publicRepos = await github.getRepositories();
      
      // Try to get private repositories as well
      let privateRepos: any[] = [];
      try {
        privateRepos = await github.request('/user/repos?visibility=private&per_page=100');
      } catch (error) {
        console.log('Could not fetch private repos, continuing with public only');
      }
      
      // Combine and deduplicate repositories
      const allRepos = [...publicRepos, ...privateRepos];
      const uniqueRepos = allRepos.filter((repo, index, self) => 
        index === self.findIndex(r => r.id === repo.id)
      );
      
      setRepositories(uniqueRepos);
      setIsConnected(true);
      
      // Store token securely (in production, use proper encryption)
      localStorage.setItem('github_token', token);
      
      // Load dashboard data
      await loadDashboardData(github, uniqueRepos);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to GitHub';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async (github: GitHubService, repos: GitHubRepository[]) => {
    try {
      // Get stored review history from localStorage
      const reviewHistory = JSON.parse(localStorage.getItem('review_history') || '[]');
      const fixHistory = JSON.parse(localStorage.getItem('fix_history') || '[]');
      const completedReviews = reviewHistory.length;
      
      // Calculate actual time saved based on review complexity
      const actualTimeSaved = reviewHistory.reduce((total: number, review: any) => {
        const issueCount = review.result?.issuesFound || 0;
        const baseTime = 0.5; // 30 minutes base time per review
        const issueTime = issueCount * 0.1; // 6 minutes per issue
        return total + baseTime + issueTime;
      }, 0);

      // Calculate actual issues resolved from fix history
      const actualIssuesResolved = fixHistory.reduce((total: number, fix: any) => {
        return total + (fix.issuesFixed || 0);
      }, 0);
      
      setDashboardStats({
        reviewsCompleted: completedReviews,
        activeRepositories: repos.length, // REAL repository count
        issuesResolved: actualIssuesResolved, // REAL issues resolved count
        timeSaved: `${Math.round(actualTimeSaved)}h`, // REAL time saved calculation
        connectedUsers: 1 // Current user
      });

      // Generate active reviews based on review history and repositories
      const activeReviewsData: ActiveReview[] = [];
      
      // Add reviews from history (most recent first)
      const recentReviews = reviewHistory
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 8); // Get up to 8 recent reviews

      recentReviews.forEach((review: any, index: number) => {
        const reviewDate = new Date(review.timestamp);
        const repo = repos.find(r => r.full_name === review.repository);
        
        // Determine status based on review result and time
        let status: 'in-progress' | 'completed' | 'review-required' = 'completed';
        let progress = 100;
        let remainingIssues = 0;
        
        if (review.result?.issuesFound > 0) {
          // Check if there are unresolved issues stored
          const unresolvedIssues = getUnresolvedIssues(review.repository);
          remainingIssues = unresolvedIssues.length;
          
          if (remainingIssues > 0) {
            const hoursSinceReview = (Date.now() - reviewDate.getTime()) / (1000 * 60 * 60);
            if (hoursSinceReview < 2) {
              status = 'in-progress';
            } else {
              status = 'review-required';
            }
            // Calculate REAL progress: (total - remaining) / total * 100
            progress = Math.round(((review.result.issuesFound - remainingIssues) / review.result.issuesFound) * 100);
          } else {
            // All issues resolved - mark as completed
            status = 'completed';
            progress = 100;
            
            // Update the review history to reflect completion
            updateReviewCompletion(review.repository);
          }
        }

        activeReviewsData.push({
          id: `review-${index}`,
          repository: review.repository?.split('/')[1] || 'unknown',
          branch: 'main',
          status,
          issues: remainingIssues,
          timeAgo: getTimeAgo(reviewDate),
          progress,
          lastReviewDate: review.timestamp,
          repositoryUrl: repo?.html_url,
          reviewData: review // Store full review data for resuming
        });
      });

      // Add some repositories that haven't been reviewed recently
      const unreviewedRepos = repos
        .filter(repo => !reviewHistory.some((r: any) => r.repository === repo.full_name))
        .slice(0, 3);

      unreviewedRepos.forEach((repo, index) => {
        const hasIssues = repo.open_issues_count > 0;
        activeReviewsData.push({
          id: `pending-${index}`,
          repository: repo.name,
          branch: 'main',
          status: hasIssues ? 'review-required' : 'completed',
          issues: Math.min(repo.open_issues_count, 10),
          timeAgo: getTimeAgo(new Date(repo.updated_at)),
          progress: hasIssues ? 0 : 100,
          repositoryUrl: repo.html_url
        });
      });

      // Sort by most recent activity and status priority
      activeReviewsData.sort((a, b) => {
        // Prioritize in-progress, then review-required, then completed
        const statusPriority = { 'in-progress': 3, 'review-required': 2, 'completed': 1 };
        const aPriority = statusPriority[a.status];
        const bPriority = statusPriority[b.status];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        // Then sort by most recent
        const aTime = a.lastReviewDate ? new Date(a.lastReviewDate).getTime() : 0;
        const bTime = b.lastReviewDate ? new Date(b.lastReviewDate).getTime() : 0;
        return bTime - aTime;
      });

      setActiveReviews(activeReviewsData);

      // Generate REAL recent activity from review history and fix history
      const activities: RecentActivity[] = [];
      
      // Add review activities from history with REAL data
      reviewHistory.slice(-5).forEach((review: any, index: number) => {
        const unresolvedIssues = getUnresolvedIssues(review.repository);
        const totalIssues = review.result?.issuesFound || 0;
        const resolvedIssues = Math.max(0, totalIssues - unresolvedIssues.length);
        const isCompleted = totalIssues === 0 || unresolvedIssues.length === 0;
        const repo = repos.find(r => r.full_name === review.repository);
        
        activities.push({
          id: `review-${review.timestamp}-${index}`,
          type: 'review' as const,
          message: isCompleted 
            ? `Code review completed for ${review.repository?.split('/')[1] || 'repository'}`
            : `Code review in progress for ${review.repository?.split('/')[1] || 'repository'}`,
          time: getTimeAgo(new Date(review.timestamp || Date.now())),
          repository: review.repository?.split('/')[1],
          repositoryUrl: repo?.html_url,
          clickable: true,
          details: {
            type: 'review',
            repository: review.repository,
            issuesFound: totalIssues,
            issuesResolved: resolvedIssues,
            status: isCompleted ? 'completed' : 'in-progress',
            timestamp: review.timestamp
          }
        });
      });

      // Add fix activities from localStorage with REAL data
      fixHistory.slice(-3).forEach((fix: any, index: number) => {
        const repo = repos.find(r => r.full_name === fix.repository);
        activities.push({
          id: `fix-${fix.timestamp}-${index}`,
          type: 'fix' as const,
          message: `AI fixed ${fix.issuesFixed || 0} issues in ${fix.repository?.split('/')[1] || 'repository'}`,
          time: getTimeAgo(new Date(fix.timestamp)),
          repository: fix.repository?.split('/')[1],
          repositoryUrl: repo?.html_url,
          clickable: true,
          details: {
            type: 'fix',
            repository: fix.repository,
            issuesFixed: fix.issuesFixed || 0,
            filesFixed: fix.filesFixed || [],
            timestamp: fix.timestamp
          }
        });
      });
      
      // Add repository update activities (most recent repos)
      repos
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 4)
        .forEach((repo, index) => {
          activities.push({
            id: `repo-${repo.id}-${index}`,
            type: 'branch' as const,
            message: `Repository ${repo.name} updated`,
            time: getTimeAgo(new Date(repo.updated_at)),
            repository: repo.name,
            repositoryUrl: repo.html_url,
            clickable: true,
            details: {
              type: 'repository_update',
              repository: repo.full_name,
              language: repo.language,
              openIssues: repo.open_issues_count,
              stars: repo.stargazers_count,
              timestamp: repo.updated_at
            }
          });
        });

      // Sort activities by timestamp (most recent first) and limit to 8
      activities.sort((a, b) => {
        const aTime = a.details?.timestamp ? new Date(a.details.timestamp).getTime() : 0;
        const bTime = b.details?.timestamp ? new Date(b.details.timestamp).getTime() : 0;
        return bTime - aTime;
      });
      
      setRecentActivity(activities.slice(0, 8));

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  // Helper function to get unresolved issues for a repository
  const getUnresolvedIssues = (repositoryName: string) => {
    const unresolvedKey = `unresolved_issues_${repositoryName}`;
    return JSON.parse(localStorage.getItem(unresolvedKey) || '[]');
  };

  // Helper function to store unresolved issues
  const storeUnresolvedIssues = (repositoryName: string, issues: any[]) => {
    const unresolvedKey = `unresolved_issues_${repositoryName}`;
    // Add unique IDs to issues if they don't have them
    const issuesWithIds = issues.map((issue, index) => ({
      ...issue,
      id: issue.id || `${issue.file}:${issue.line}:${issue.rule || issue.type}:${index}`,
      hash: issue.hash || generateIssueHash(issue)
    }));
    localStorage.setItem(unresolvedKey, JSON.stringify(issuesWithIds));
    console.log(`Stored ${issuesWithIds.length} unresolved issues for ${repositoryName}`);
  };

  // Helper function to generate issue hash for tracking
  const generateIssueHash = (issue: any): string => {
    const key = `${issue.file}:${issue.line}:${issue.rule || issue.type}:${issue.message}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  };

  // Helper function to remove resolved issues
  const removeResolvedIssues = (repositoryName: string, resolvedIssueIds: string[]) => {
    const unresolvedKey = `unresolved_issues_${repositoryName}`;
    const currentIssues = JSON.parse(localStorage.getItem(unresolvedKey) || '[]');
    const remainingIssues = currentIssues.filter((issue: any) => 
      !resolvedIssueIds.includes(issue.id) && !resolvedIssueIds.includes(issue.hash)
    );
    localStorage.setItem(unresolvedKey, JSON.stringify(remainingIssues));
    console.log(`Removed ${resolvedIssueIds.length} resolved issues. ${remainingIssues.length} remaining for ${repositoryName}`);
    return remainingIssues;
  };

  // Helper function to mark review as completed
  const updateReviewCompletion = (repositoryName: string) => {
    const reviewHistory = JSON.parse(localStorage.getItem('review_history') || '[]');
    const updatedHistory = reviewHistory.map((review: any) => {
      if (review.repository === repositoryName) {
        return {
          ...review,
          completedAt: new Date().toISOString(),
          result: {
            ...review.result,
            issuesFound: 0,
            status: 'completed'
          }
        };
      }
      return review;
    });
    localStorage.setItem('review_history', JSON.stringify(updatedHistory));
  };

  // Helper function to store fix history
  const storeFix = (repositoryName: string, fixDetails: any) => {
    const fixHistory = JSON.parse(localStorage.getItem('fix_history') || '[]');
    const newFix = {
      repository: repositoryName,
      timestamp: new Date().toISOString(),
      ...fixDetails
    };
    fixHistory.push(newFix);
    localStorage.setItem('fix_history', JSON.stringify(fixHistory));
    
    console.log(`Stored fix history for ${repositoryName}:`, newFix);
  };

  // CRITICAL: Function to remove a single issue when fixed individually
  const removeSingleIssue = (repositoryName: string, issueToRemove: any) => {
    const unresolvedKey = `unresolved_issues_${repositoryName}`;
    const currentIssues = JSON.parse(localStorage.getItem(unresolvedKey) || '[]');
    
    // Remove the specific issue by ID or hash
    const remainingIssues = currentIssues.filter((issue: any) => 
      issue.id !== issueToRemove.id && 
      issue.hash !== issueToRemove.hash &&
      !(issue.file === issueToRemove.file && issue.line === issueToRemove.line && issue.message === issueToRemove.message)
    );
    
    localStorage.setItem(unresolvedKey, JSON.stringify(remainingIssues));
    console.log(`Removed single issue. ${remainingIssues.length} remaining for ${repositoryName}`);
    
    // Store the fix in history
    storeFix(repositoryName, {
      issuesFixed: 1,
      filesFixed: [issueToRemove.file],
      singleFix: true,
      fixedIssue: issueToRemove
    });
    
    // If no issues remain, mark as completed
    if (remainingIssues.length === 0) {
      updateReviewCompletion(repositoryName);
    }
    
    return remainingIssues;
  };

  // CRITICAL: Function to clear ALL issues when "Fix All" is used
  const clearAllIssues = (repositoryName: string, allIssues: any[]) => {
    const unresolvedKey = `unresolved_issues_${repositoryName}`;
    
    // Clear ALL unresolved issues
    localStorage.setItem(unresolvedKey, JSON.stringify([]));
    console.log(`Cleared ALL ${allIssues.length} issues for ${repositoryName}`);
    
    // Store the fix in history
    storeFix(repositoryName, {
      issuesFixed: allIssues.length,
      filesFixed: [...new Set(allIssues.map(issue => issue.file))], // Unique files
      allFixed: true,
      fixedIssues: allIssues
    });
    
    // Mark as completed
    updateReviewCompletion(repositoryName);
    
    return [];
  };

  // CRITICAL: Update existing review instead of creating new one
  const updateExistingReview = (repositoryName: string, newResult: any) => {
    const reviewHistory = JSON.parse(localStorage.getItem('review_history') || '[]');
    
    // Find existing review for this repository
    const existingIndex = reviewHistory.findIndex((review: any) => review.repository === repositoryName);
    
    if (existingIndex !== -1) {
      // Update existing review
      reviewHistory[existingIndex] = {
        ...reviewHistory[existingIndex],
        timestamp: new Date().toISOString(),
        result: newResult,
        status: newResult.issues?.length === 0 ? 'completed' : 'in-progress'
      };
      console.log(`Updated existing review for ${repositoryName}`);
    } else {
      // Create new review
      reviewHistory.push({
        repository: repositoryName,
        timestamp: new Date().toISOString(),
        result: newResult,
        status: newResult.issues?.length === 0 ? 'completed' : 'in-progress'
      });
      console.log(`Created new review for ${repositoryName}`);
    }
    
    localStorage.setItem('review_history', JSON.stringify(reviewHistory));
    return reviewHistory[existingIndex !== -1 ? existingIndex : reviewHistory.length - 1];
  };

  const startReview = async (owner: string, repo: string, pullNumber?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('github_token');
      const openaiKey = localStorage.getItem('openai_api_key');
      
      if (!token || !openaiKey) {
        throw new Error('Missing GitHub token or OpenAI API key');
      }

      // Get settings from localStorage
      const autoMerge = localStorage.getItem('auto_merge') === 'true';
      const autoFix = localStorage.getItem('auto_fix') !== 'false';
      const strictMode = localStorage.getItem('strict_mode') !== 'false';
      const dailyReview = localStorage.getItem('daily_review') !== 'false';

      const reviewBot = new ReviewBot(token, openaiKey, {
        autoMerge,
        autoFix,
        strictMode,
        dailyReview,
      });

      let result;
      if (pullNumber) {
        result = await reviewBot.reviewPullRequest(owner, repo, pullNumber);
      } else {
        result = await reviewBot.reviewMainBranch(owner, repo);
      }

      // Store unresolved issues for resuming later
      if (result.success && result.issues) {
        storeUnresolvedIssues(`${owner}/${repo}`, result.issues);
      }

      // CRITICAL: Update existing review instead of creating new one
      const repositoryName = `${owner}/${repo}`;
      updateExistingReview(repositoryName, result);

      // Refresh dashboard data
      const github = new GitHubService(token);
      await loadDashboardData(github, repositories);

      return { success: true, result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Review failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // New function to resume a review
  const resumeReview = async (repositoryName: string) => {
    try {
      const unresolvedIssues = getUnresolvedIssues(repositoryName);
      
      if (unresolvedIssues.length === 0) {
        // Mark as completed if no issues remain
        updateReviewCompletion(repositoryName);
        
        return {
          success: true,
          result: {
            issuesFound: 0,
            criticalIssues: 0,
            issues: [],
            message: 'All issues have been resolved!',
            status: 'completed'
          }
        };
      }

      return {
        success: true,
        result: {
          issuesFound: unresolvedIssues.length,
          criticalIssues: unresolvedIssues.filter((i: any) => i.severity === 'high').length,
          issues: unresolvedIssues,
          resumed: true,
          status: 'in-progress'
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resume review';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const fixIssuesWithAI = async (owner: string, repo: string, issues: any[]) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('github_token');
      const openaiKey = localStorage.getItem('openai_api_key');
      
      if (!token || !openaiKey) {
        throw new Error('Missing GitHub token or OpenAI API key');
      }

      const reviewBot = new ReviewBot(token, openaiKey, {
        autoMerge: false,
        autoFix: true,
        strictMode: true,
        dailyReview: true,
      });

      const result = await reviewBot.fixIssuesWithAI(owner, repo, issues);
      
      // Update unresolved issues after fixing
      if (result.success) {
        const repositoryName = `${owner}/${repo}`;
        
        // CRITICAL: Clear ALL issues when "Fix All" is used
        const remainingIssues = clearAllIssues(repositoryName, issues);
        
        // Update review history to reflect completion
        const reviewHistory = JSON.parse(localStorage.getItem('review_history') || '[]');
        const updatedHistory = reviewHistory.map((review: any) => {
          if (review.repository === repositoryName) {
            return {
              ...review,
              timestamp: new Date().toISOString(),
              result: {
                ...review.result,
                issuesFound: 0, // ALL issues fixed
                status: 'completed'
              },
              completedAt: new Date().toISOString()
            };
          }
          return review;
        });
        localStorage.setItem('review_history', JSON.stringify(updatedHistory));
        
        // Refresh dashboard data to update status
        const github = new GitHubService(token);
        await loadDashboardData(github, repositories);
      }
      
      return { success: true, result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'AI fix failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    localStorage.removeItem('github_token');
    localStorage.removeItem('openai_api_key');
    localStorage.removeItem('review_history');
    localStorage.removeItem('fix_history');
    
    // Clear all unresolved issues
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('unresolved_issues_')) {
        localStorage.removeItem(key);
      }
    });
    
    setIsConnected(false);
    setRepositories([]);
    setDashboardStats({
      reviewsCompleted: 0,
      activeRepositories: 0,
      issuesResolved: 0,
      timeSaved: '0h',
      connectedUsers: 0
    });
    setActiveReviews([]);
    setRecentActivity([]);
  };

  // FIXED: Proper refresh function that actually fetches new data
  const refreshData = async () => {
    const token = localStorage.getItem('github_token');
    if (token && isConnected) {
      try {
        setLoading(true);
        const github = new GitHubService(token);
        
        console.log('🔄 Refreshing GitHub data...');
        
        // Get all repositories (including private ones) - FRESH DATA
        const publicRepos = await github.getRepositories();
        
        // Try to get private repositories as well
        let privateRepos: any[] = [];
        try {
          privateRepos = await github.request('/user/repos?visibility=private&per_page=100');
        } catch (error) {
          console.log('Could not fetch private repos, continuing with public only');
        }
        
        // Combine and deduplicate repositories
        const allRepos = [...publicRepos, ...privateRepos];
        const uniqueRepos = allRepos.filter((repo, index, self) => 
          index === self.findIndex(r => r.id === repo.id)
        );
        
        console.log(`✅ Fetched ${uniqueRepos.length} repositories`);
        
        setRepositories(uniqueRepos);
        await loadDashboardData(github, uniqueRepos);
        
        console.log('✅ Dashboard data refreshed successfully');
      } catch (error) {
        console.error('❌ Failed to refresh data:', error);
        setError('Failed to refresh data');
      } finally {
        setLoading(false);
      }
    }
  };

  // Check for existing connection on mount
  useEffect(() => {
    const token = localStorage.getItem('github_token');
    if (token) {
      setIsConnected(true);
      // Load repositories and dashboard data
      const github = new GitHubService(token);
      
      // Get all repositories (including private ones)
      Promise.all([
        github.getRepositories(),
        github.request('/user/repos?visibility=private&per_page=100').catch(() => [])
      ])
        .then(([publicRepos, privateRepos]) => {
          // Combine and deduplicate repositories
          const allRepos = [...publicRepos, ...privateRepos];
          const uniqueRepos = allRepos.filter((repo, index, self) => 
            index === self.findIndex(r => r.id === repo.id)
          );
          
          setRepositories(uniqueRepos);
          return loadDashboardData(github, uniqueRepos);
        })
        .catch(error => {
          console.error('Failed to load initial data:', error);
          setError('Failed to load GitHub data');
        });
    }
  }, []);

  return {
    isConnected,
    repositories,
    dashboardStats,
    activeReviews,
    recentActivity,
    loading,
    error,
    connectGitHub,
    startReview,
    resumeReview,
    fixIssuesWithAI,
    removeSingleIssue, // Function to remove single issues
    clearAllIssues, // NEW: Function to clear all issues
    disconnect,
    refreshData, // FIXED: Now actually refreshes data
  };
};

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}