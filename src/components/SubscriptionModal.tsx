import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  Wand2,
  Zap,
  Shield,
  Clock,
  Users,
  Sparkles,
  CreditCard,
  CheckCircle
} from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

interface SubscriptionModalProps {
  onClose: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onClose }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'team'>('pro');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { currentPlan, upgradePlan, loading } = useSubscription();

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'USD/user/month',
      description: 'Perfect for personal projects',
      features: [
        'Up to 3 repositories',
        'Basic AI reviews',
        'Community support'
      ],
      current: currentPlan.type === 'free'
    },
    {
      name: 'Pro',
      monthlyPrice: '$15',
      annualPrice: '$12',
      originalPrice: '$15',
      period: 'USD/user/month',
      description: 'For professional developers',
      features: [
        'Unlimited repositories',
        'Advanced AI reviews',
        'Auto-fix & merge',
        'Priority support'
      ],
      popular: true,
      savings: billingCycle === 'annual' ? 'Save $36/year' : null,
      current: currentPlan.type === 'pro'
    },
    {
      name: 'Team',
      monthlyPrice: '$25',
      annualPrice: '$20',
      originalPrice: '$25',
      period: 'USD/user/month',
      description: 'For development teams',
      features: [
        'Everything in Pro',
        'Team collaboration',
        'Advanced analytics',
        'Dedicated support'
      ],
      savings: billingCycle === 'annual' ? 'Save $60/year' : null,
      current: currentPlan.type === 'team'
    }
  ];

  const getCurrentPrice = (plan: any) => {
    if (plan.name === 'Free') return plan.price;
    return billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
  };

  const handleUpgrade = async (planType: 'pro' | 'team') => {
    setProcessing(true);
    
    try {
      const result = await upgradePlan(planType, billingCycle);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setProcessing(false);
        }, 2000);
      } else {
        alert(result.error || 'Upgrade failed. Please try again.');
        setProcessing(false);
      }
    } catch (error) {
      alert('Upgrade failed. Please try again.');
      setProcessing(false);
    }
  };

  const getButtonText = (plan: any) => {
    if (plan.current) {
      return 'Current Plan';
    }
    
    // If current plan is higher tier, show downgrade
    if (currentPlan.type === 'pro' && plan.name === 'Free') {
      return 'Downgrade Plan';
    }
    if (currentPlan.type === 'team' && (plan.name === 'Free' || plan.name === 'Pro')) {
      return 'Downgrade Plan';
    }
    
    // Otherwise show upgrade
    return plan.name === 'Free' ? 'Get Started Free' : `Upgrade to ${plan.name}`;
  };

  const getButtonAction = (plan: any) => {
    if (plan.current) return () => {};
    
    if (plan.name === 'Free') {
      // Handle downgrade logic here
      return () => alert('Downgrade functionality would be implemented here');
    }
    
    return () => {
      if (plan.name === 'Pro') handleUpgrade('pro');
      if (plan.name === 'Team') handleUpgrade('team');
    };
  };

  if (!onClose) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          // Success State
          <div className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle size={32} className="text-green-600" />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to {selectedPlan === 'pro' ? 'Pro' : 'Team'}!</h3>
            <p className="text-gray-600 mb-4">
              Your subscription has been activated successfully. You now have access to all {selectedPlan} features!
            </p>
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-green-900 mb-2">What's unlocked:</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>✅ Unlimited repositories</li>
                <li>✅ Advanced AI reviews</li>
                <li>✅ Auto-fix & merge capabilities</li>
                {selectedPlan === 'team' && <li>✅ Team collaboration features</li>}
              </ul>
            </div>
          </div>
        ) : (
          <>
            {/* Header - FIXED LOGO */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                    <Wand2 size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Upgrade to Pro</h2>
                    <p className="text-gray-600">Unlock the full power of ReviewAI</p>
                  </div>
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

            {/* Features Banner */}
            <div className="p-6 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Zap size={20} className="text-black" />
                  <span className="text-sm font-medium">AI-Powered Reviews</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield size={20} className="text-black" />
                  <span className="text-sm font-medium">Security Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={20} className="text-black" />
                  <span className="text-sm font-medium">24/7 Monitoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-black" />
                  <span className="text-sm font-medium">Team Collaboration</span>
                </div>
              </div>
            </div>

            {/* EXACT DASHBOARD PRICING DESIGN */}
            <div className="p-6 text-center">
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Simple, transparent pricing</h3>
              <p className="text-lg text-gray-600 mb-6">Start free, scale as you grow</p>
              
              {/* BILLING TOGGLE */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
                  Monthly
                </span>
                <motion.button
                  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                  className="relative w-12 h-6 bg-gray-300 rounded-full transition-colors"
                  animate={{ backgroundColor: billingCycle === 'annual' ? '#6366f1' : '#d1d5db' }}
                >
                  <motion.div
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    animate={{ x: billingCycle === 'annual' ? 24 : 4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                </motion.button>
                <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}>
                  Annual
                </span>
                {billingCycle === 'annual' && (
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                    Save 20%
                  </span>
                )}
              </div>

              {/* PRICING CARDS - EXACT DASHBOARD STYLE */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {plans.map((plan, index) => (
                  <motion.div
                    key={plan.name}
                    className={`relative p-6 border-2 rounded-2xl bg-white transition-all ${
                      plan.current 
                        ? 'border-blue-500 shadow-lg' 
                        : plan.popular && !plan.current
                        ? 'border-indigo-500 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    {/* CURRENT PLAN BADGE - FIXED POSITIONING */}
                    {plan.current && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1 whitespace-nowrap shadow-lg">
                          <CheckCircle size={14} />
                          Current Plan
                        </div>
                      </div>
                    )}

                    {/* POPULAR BADGE */}
                    {plan.popular && !plan.current && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1 whitespace-nowrap shadow-lg">
                          <Sparkles size={14} />
                          Popular
                        </div>
                      </div>
                    )}

                    {/* CARD CONTENT - ADDED PADDING TOP TO PREVENT OVERLAP */}
                    <div className={plan.current || plan.popular ? 'pt-4' : ''}>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <p className="text-gray-600 text-sm mb-4">{plan.description}</p>

                      <div className="mb-6">
                        <div className="flex items-baseline justify-center gap-2 mb-1">
                          <span className="text-3xl font-bold text-gray-900">
                            {getCurrentPrice(plan)}
                          </span>
                          {plan.name !== 'Free' && billingCycle === 'annual' && (
                            <span className="text-lg line-through text-gray-400">
                              {plan.originalPrice}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">{plan.period}</div>
                        {plan.name !== 'Free' && billingCycle === 'annual' && plan.savings && (
                          <p className="text-sm text-green-600 mt-1 font-medium">{plan.savings}</p>
                        )}
                      </div>

                      <ul className="space-y-3 mb-8 text-left">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center gap-2">
                            <Check size={16} className="text-green-600 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <motion.button
                        onClick={getButtonAction(plan)}
                        disabled={plan.current || processing}
                        className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                          plan.current
                            ? 'border-2 border-gray-300 text-gray-500 cursor-not-allowed bg-gray-50'
                            : plan.popular && !plan.current
                            ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                            : 'border-2 border-gray-300 hover:bg-gray-50 text-gray-900'
                        }`}
                        whileHover={!plan.current && !processing ? { scale: 1.05 } : {}}
                        whileTap={!plan.current && !processing ? { scale: 0.95 } : {}}
                      >
                        {processing && (plan.name === 'Pro' ? selectedPlan === 'pro' : selectedPlan === 'team') ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            {!plan.current && <CreditCard size={16} />}
                            {getButtonText(plan)}
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* FOOTER */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  All plans include 30-day money-back guarantee
                </p>
                <p className="text-xs text-gray-500">
                  Questions? Contact us at <span className="font-medium">support@reviewai.com</span>
                </p>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SubscriptionModal;