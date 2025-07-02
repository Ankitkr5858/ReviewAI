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
    const savedFeedbacks = localStorage.getItem('user_feedbacks');
    if (savedFeedbacks) {
      try {
        setFeedbacks(JSON.parse(savedFeedbacks));
      } catch (error) {
        console.error('Failed to load feedbacks:', error);
      }
    }
  }, []);

  // Save feedbacks to localStorage
  const saveFeedbacks = (newFeedbacks: Feedback[]) => {
    localStorage.setItem('user_feedbacks', JSON.stringify(newFeedbacks));
    setFeedbacks(newFeedbacks);
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
        status: 'reviewed', // FIXED: Default to 'reviewed' instead of 'pending'
        timestamp: new Date().toISOString(),
        helpful: 0,
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // FIXED: Update state immediately for real-time display
      const updatedFeedbacks = [newFeedback, ...feedbacks];
      saveFeedbacks(updatedFeedbacks);

      // Simulate admin response for demo purposes (30% chance)
      if (Math.random() < 0.3) {
        setTimeout(() => {
          const responseMessages = [
            "Thank you for your feedback! We're looking into this.",
            "Great suggestion! We've added this to our roadmap.",
            "Thanks for reporting this. We'll fix it in the next update.",
            "We appreciate your input and will consider this for future releases.",
            "Excellent feedback! This aligns with our development goals.",
          ];

          const updatedFeedback = {
            ...newFeedback,
            status: 'implemented' as const, // Some get implemented status
            response: {
              message: responseMessages[Math.floor(Math.random() * responseMessages.length)],
              timestamp: new Date().toISOString(),
              responder: 'ReviewAI Team',
            },
          };

          const feedbacksWithResponse = updatedFeedbacks.map(f => 
            f.id === newFeedback.id ? updatedFeedback : f
          );
          saveFeedbacks(feedbacksWithResponse);
        }, 2000); // Faster response for demo
      }

      return { success: true, feedback: newFeedback };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
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

  // Get recent feedbacks with pagination support
  const getRecentFeedbacks = (limit = 5) => {
    return feedbacks
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  };

  // FIXED: Get paginated feedbacks
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
    markHelpful,
    getFeedbackStats,
    getRecentFeedbacks,
    getPaginatedFeedbacks, // ADDED: Pagination support
  };
};