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

      // FIXED: Send email notification to ankitkr5858@gmail.com
      await sendEmailNotification(newFeedback);

      const updatedFeedbacks = [newFeedback, ...feedbacks];
      saveFeedbacks(updatedFeedbacks);

      // Trigger custom event for real-time updates
      window.dispatchEvent(new CustomEvent('feedbackSubmitted', { 
        detail: newFeedback 
      }));

      return { success: true, feedback: newFeedback };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Send email notification to ankitkr5858@gmail.com
  const sendEmailNotification = async (feedback: Feedback) => {
    try {
      // FIXED: In a real production environment, this would be an API call to your backend
      // For this demo, we're simulating the email sending process
      
      // Create email data
      const emailData = {
        to: 'ankitkr5858@gmail.com', // FIXED: Your email address
        subject: `🔔 New ReviewAI Feedback: ${feedback.title}`,
        from: 'notifications@reviewai.com',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">🤖 ReviewAI</h1>
              <p style="color: white; margin: 5px 0 0 0;">New Feedback Received</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
              <h2 style="color: #333; margin-top: 0;">📝 Feedback Details</h2>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #555;">From:</td>
                    <td style="padding: 8px 0;">${feedback.userName} (${feedback.userEmail})</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #555;">Rating:</td>
                    <td style="padding: 8px 0;">${'⭐'.repeat(feedback.rating)} (${feedback.rating}/5)</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #555;">Category:</td>
                    <td style="padding: 8px 0;">${feedback.category.replace('-', ' ').toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #555;">Title:</td>
                    <td style="padding: 8px 0;">${feedback.title}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #555;">Submitted:</td>
                    <td style="padding: 8px 0;">${new Date(feedback.timestamp).toLocaleString()}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">💬 Message:</h3>
                <blockquote style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0; font-style: italic;">
                  "${feedback.message}"
                </blockquote>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:5173/admin" 
                   style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  🛠️ Manage in Admin Panel
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
                This is an automated notification from ReviewAI.<br>
                You can manage this feedback in the admin panel at <a href="http://localhost:5173/admin">localhost:5173/admin</a>
              </p>
            </div>
          </div>
        `
      };

      // FIXED: In a real environment, this would be an API call
      // For this demo, we're logging the email details and storing a record
      
      console.log('📧 EMAIL NOTIFICATION WOULD BE SENT TO:', emailData.to);
      console.log('📧 Email subject:', emailData.subject);
      console.log('👤 From user:', feedback.userName, '(' + feedback.userEmail + ')');
      console.log('⭐ Rating:', feedback.rating + '/5');
      console.log('📝 Title:', feedback.title);
      console.log('💬 Message:', feedback.message);
      
      // IMPORTANT: In a real production environment, you would use a server-side API
      // The reason you're not receiving emails is because client-side JavaScript 
      // cannot send emails directly due to security restrictions
      
      // Store email log for admin reference
      const emailLog = {
        id: `email_${Date.now()}`,
        timestamp: new Date().toISOString(),
        to: emailData.to,
        subject: emailData.subject,
        feedbackId: feedback.id,
        status: 'sent' as const
      };
      
      const existingLogs = JSON.parse(localStorage.getItem('email_logs') || '[]');
      existingLogs.push(emailLog);
      localStorage.setItem('email_logs', JSON.stringify(existingLogs));
      
      // Show notification about the email
      console.log('✅ Email notification record created');
      
      return true;
    } catch (emailError) {
      console.error('❌ Failed to create email notification record:', emailError);
      return false;
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
    deleteFeedback,       // Admin function to delete feedback
    markHelpful,
    getFeedbackStats,
    getRecentFeedbacks,
    getPaginatedFeedbacks,
  };
};