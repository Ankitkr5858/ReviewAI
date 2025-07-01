import { useState, useEffect } from 'react';

export type PlanType = 'free' | 'pro' | 'team';

export interface UserPlan {
  type: PlanType;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'annual';
  features: {
    repositories: number | 'unlimited';
    aiReviews: 'basic' | 'advanced';
    autoFix: boolean;
    prioritySupport: boolean;
    teamCollaboration: boolean;
    analytics: boolean;
    customRules: boolean;
  };
  limits: {
    maxRepositories: number;
    maxReviewsPerMonth: number;
    maxTeamMembers: number;
  };
  subscriptionDate?: string;
  nextBillingDate?: string;
  status: 'active' | 'cancelled' | 'expired';
}

const PLAN_CONFIGS: Record<PlanType, UserPlan> = {
  free: {
    type: 'free',
    name: 'Free',
    price: 0,
    billingCycle: 'monthly',
    features: {
      repositories: 3,
      aiReviews: 'basic',
      autoFix: false,
      prioritySupport: false,
      teamCollaboration: false,
      analytics: false,
      customRules: false,
    },
    limits: {
      maxRepositories: 3,
      maxReviewsPerMonth: 10,
      maxTeamMembers: 1,
    },
    status: 'active',
  },
  pro: {
    type: 'pro',
    name: 'Pro',
    price: 12,
    billingCycle: 'annual',
    features: {
      repositories: 'unlimited',
      aiReviews: 'advanced',
      autoFix: true,
      prioritySupport: true,
      teamCollaboration: false,
      analytics: true,
      customRules: true,
    },
    limits: {
      maxRepositories: 999,
      maxReviewsPerMonth: 999,
      maxTeamMembers: 5,
    },
    status: 'active',
  },
  team: {
    type: 'team',
    name: 'Team',
    price: 20,
    billingCycle: 'annual',
    features: {
      repositories: 'unlimited',
      aiReviews: 'advanced',
      autoFix: true,
      prioritySupport: true,
      teamCollaboration: true,
      analytics: true,
      customRules: true,
    },
    limits: {
      maxRepositories: 999,
      maxReviewsPerMonth: 999,
      maxTeamMembers: 999,
    },
    status: 'active',
  },
};

export const useSubscription = () => {
  const [currentPlan, setCurrentPlan] = useState<UserPlan>(PLAN_CONFIGS.free);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's current plan from localStorage
  useEffect(() => {
    const savedPlan = localStorage.getItem('user_plan');
    if (savedPlan) {
      try {
        const planData = JSON.parse(savedPlan);
        setCurrentPlan(planData);
      } catch (error) {
        console.error('Failed to load saved plan:', error);
        setCurrentPlan(PLAN_CONFIGS.free);
      }
    }
  }, []);

  // Save plan to localStorage whenever it changes
  const savePlan = (plan: UserPlan) => {
    localStorage.setItem('user_plan', JSON.stringify(plan));
    setCurrentPlan(plan);
  };

  // Simulate payment processing
  const upgradePlan = async (planType: PlanType, billingCycle: 'monthly' | 'annual') => {
    setLoading(true);
    setError(null);

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate payment success (90% success rate)
      if (Math.random() > 0.1) {
        const newPlan = {
          ...PLAN_CONFIGS[planType],
          billingCycle,
          price: billingCycle === 'annual' ? PLAN_CONFIGS[planType].price : Math.round(PLAN_CONFIGS[planType].price * 1.25),
          subscriptionDate: new Date().toISOString(),
          nextBillingDate: new Date(Date.now() + (billingCycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active' as const,
        };

        savePlan(newPlan);

        // Store upgrade event for analytics
        const upgradeHistory = JSON.parse(localStorage.getItem('upgrade_history') || '[]');
        upgradeHistory.push({
          fromPlan: currentPlan.type,
          toPlan: planType,
          billingCycle,
          timestamp: new Date().toISOString(),
          amount: newPlan.price,
        });
        localStorage.setItem('upgrade_history', JSON.stringify(upgradeHistory));

        return { success: true, plan: newPlan };
      } else {
        throw new Error('Payment failed. Please try again.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upgrade failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Cancel subscription
  const cancelSubscription = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const cancelledPlan = {
        ...currentPlan,
        status: 'cancelled' as const,
      };

      savePlan(cancelledPlan);
      return { success: true };
    } catch (error) {
      setError('Failed to cancel subscription');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Check if user can access a feature
  const canAccessFeature = (feature: keyof UserPlan['features']) => {
    return currentPlan.features[feature];
  };

  // Check if user has reached limits
  const checkLimits = () => {
    const reviewHistory = JSON.parse(localStorage.getItem('review_history') || '[]');
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthReviews = reviewHistory.filter((review: any) => {
      const reviewDate = new Date(review.timestamp);
      return reviewDate.getMonth() === currentMonth && reviewDate.getFullYear() === currentYear;
    });

    return {
      repositories: {
        current: JSON.parse(localStorage.getItem('connected_repositories') || '[]').length,
        max: currentPlan.limits.maxRepositories,
        exceeded: JSON.parse(localStorage.getItem('connected_repositories') || '[]').length >= currentPlan.limits.maxRepositories,
      },
      reviews: {
        current: thisMonthReviews.length,
        max: currentPlan.limits.maxReviewsPerMonth,
        exceeded: thisMonthReviews.length >= currentPlan.limits.maxReviewsPerMonth,
      },
      teamMembers: {
        current: 1, // For now, just current user
        max: currentPlan.limits.maxTeamMembers,
        exceeded: false,
      },
    };
  };

  // Get upgrade suggestions
  const getUpgradeSuggestions = () => {
    const limits = checkLimits();
    const suggestions = [];

    if (limits.repositories.exceeded && currentPlan.type === 'free') {
      suggestions.push({
        reason: 'Repository limit reached',
        suggestion: 'Upgrade to Pro for unlimited repositories',
        targetPlan: 'pro' as PlanType,
      });
    }

    if (limits.reviews.exceeded) {
      suggestions.push({
        reason: 'Monthly review limit reached',
        suggestion: 'Upgrade for unlimited reviews',
        targetPlan: currentPlan.type === 'free' ? 'pro' as PlanType : 'team' as PlanType,
      });
    }

    if (!currentPlan.features.autoFix) {
      suggestions.push({
        reason: 'Manual fixes taking too long?',
        suggestion: 'Upgrade to Pro for AI auto-fix',
        targetPlan: 'pro' as PlanType,
      });
    }

    return suggestions;
  };

  return {
    currentPlan,
    loading,
    error,
    upgradePlan,
    cancelSubscription,
    canAccessFeature,
    checkLimits,
    getUpgradeSuggestions,
    PLAN_CONFIGS,
  };
};