import { useState, useEffect } from 'react';

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  rating: number; // 1-5 stars
  title: string;
  message: string;
  category: 'feature-request' | 'bug-report' | 'general' | 'improvement';
  status: 'pending' | 'reviewed' | 'implemented' | 'rejected';
  timestamp: string;
  helpful: number; // Number of users who found this helpful
  response?: {
    message: string;
    timestamp: string;
    responder: string;
  };
}

export const useFeedback = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load feedbacks from localStorage
  useEffect(() => {
    const loadFeedbacks = () => {
      const savedFeedbacks = localStorage.getItem('user_feedbacks');
      if (savedFeedbacks) {
        try {
          const parsed = JSON.parse(savedFeedbacks);
          setFeedbacks(parsed);
        } catch (error) {
          console.error('Failed to load feedbacks:', error);
        }
      }
    };

    loadFeedbacks();

    // Listen for storage changes (when feedback is added from another tab/component)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_feedbacks') {
        loadFeedbacks();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save feedbacks to localStorage
  const saveFeedbacks = (newFeedbacks: Feedback[]) => {
    localStorage.setItem('user_feedbacks', JSON.stringify(newFeedbacks));
    setFeedbacks(newFeedbacks);
    
    // Trigger storage event for real-time updates across components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'user_feedbacks',
      newValue: JSON.stringify(newFeedbacks)
    }));
  };

  // Submit new feedback
  const submitFeedback = async (feedbackData: {
    rating: number;
    title: string;
    message: string;
    category: Feedback['category'];
  }) => {
    setLoading(true);
    setError(null);

    try {
      // Get user info from GitHub integration
      const githubToken = localStorage.getItem('github_token');
      let userInfo = {
        name: 'Anonymous User',
        email: 'user@example.com',
        avatar: '',
      };

      if (githubToken) {
        try {
          const response = await fetch('https://api.github.com/user', {
            headers: {
              'Authorization': `Bearer ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            userInfo = {
              name: userData.name || userData.login || 'GitHub User',
              email: userData.email || `${userData.login}@github.com`,
              avatar: userData.avatar_url || '',
            };
          }
        } catch (error) {
          console.error('Failed to fetch user info:', error);
        }
      }

      const newFeedback: Feedback = {
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: `user_${Date.now()}`,
        userName: userInfo.name,
        userEmail: userInfo.email,
        userAvatar: userInfo.avatar,
        rating: feedbackData.rating,
        title: feedbackData.title,
        message: feedbackData.message,
        category: feedbackData.category,
        status: 'pending', // Always start as pending for admin review
        timestamp: new Date().toISOString(),
        helpful: 0,
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedFeedbacks = [newFeedback, ...feedbacks];
      saveFeedbacks(updatedFeedbacks);

      return { success: true, feedback: newFeedback };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update feedback status (Admin function)
  const updateFeedbackStatus = async (feedbackId: string, newStatus: Feedback['status']) => {
    const updatedFeedbacks = feedbacks.map(feedback => 
      feedback.id === feedbackId 
        ? { ...feedback, status: newStatus }
        : feedback
    );
    saveFeedbacks(updatedFeedbacks);
  };

  // Respond to feedback (Admin function)
  const respondToFeedback = async (feedbackId: string, responseMessage: string) => {
    const updatedFeedbacks = feedbacks.map(feedback => 
      feedback.id === feedbackId 
        ? { 
            ...feedback, 
            status: 'reviewed' as const,
            response: {
              message: responseMessage,
              timestamp: new Date().toISOString(),
              responder: 'ReviewAI Team',
            }
          }
        : feedback
    );
    saveFeedbacks(updatedFeedbacks);
  };

  // Delete feedback (Admin function)
  const deleteFeedback = async (feedbackId: string) => {
    const updatedFeedbacks = feedbacks.filter(feedback => feedback.id !== feedbackId);
    saveFeedbacks(updatedFeedbacks);
  };

  // Mark feedback as helpful
  const markHelpful = (feedbackId: string) => {
    const updatedFeedbacks = feedbacks.map(feedback => 
      feedback.id === feedbackId 
        ? { ...feedback, helpful: feedback.helpful + 1 }
        : feedback
    );
    saveFeedbacks(updatedFeedbacks);
  };

  // Get feedback statistics
  const getFeedbackStats = () => {
    const totalFeedbacks = feedbacks.length;
    const averageRating = feedbacks.length > 0 
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length 
      : 0;
    
    const categoryStats = feedbacks.reduce((acc, feedback) => {
      acc[feedback.category] = (acc[feedback.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusStats = feedbacks.reduce((acc, feedback) => {
      acc[feedback.status] = (acc[feedback.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalFeedbacks,
      averageRating: Math.round(averageRating * 10) / 10,
      categoryStats,
      statusStats,
    };
  };

  // Get recent feedbacks
  const getRecentFeedbacks = (limit = 5) => {
    return feedbacks
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  };

  // Get paginated feedbacks
  const getPaginatedFeedbacks = (page = 1, limit = 5) => {
    const sortedFeedbacks = feedbacks
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFeedbacks = sortedFeedbacks.slice(startIndex, endIndex);
    
    return {
      feedbacks: paginatedFeedbacks,
      totalPages: Math.ceil(sortedFeedbacks.length / limit),
      currentPage: page,
      totalFeedbacks: sortedFeedbacks.length,
      hasMore: endIndex < sortedFeedbacks.length
    };
  };

  return {
    feedbacks,
    loading,
    error,
    submitFeedback,
    updateFeedbackStatus, // Admin function
    respondToFeedback,    // Admin function
    deleteFeedback,       // NEW: Admin function to delete feedback
    markHelpful,
    getFeedbackStats,
    getRecentFeedbacks,
    getPaginatedFeedbacks,
  };
};