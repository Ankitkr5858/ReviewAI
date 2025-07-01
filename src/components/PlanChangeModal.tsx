import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, ChevronDown, AlertTriangle, CheckCircle, MessageSquare } from 'lucide-react';
import { useSubscription, UserPlan } from '../hooks/useSubscription';
import PlanBadge from './PlanBadge';

interface PlanChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: UserPlan;
}

const PlanChangeModal: React.FC<PlanChangeModalProps> = ({ isOpen, onClose, currentPlan }) => {
  const [showDowngradeForm, setShowDowngradeForm] = useState(false);
  const [downgradeReason, setDowngradeReason] = useState('');
  const [downgradeComments, setDowngradeComments] = useState('');
  const [processing, setProcessing] = useState(false);
  const { upgradePlan, cancelSubscription, PLAN_CONFIGS } = useSubscription();

  const downgradeReasons = [
    'Too expensive',
    'Not using enough features',
    'Found a better alternative',
    'Budget constraints',
    'Switching to different workflow',
    'Other'
  ];

  const handleUpgrade = async (planType: 'pro' | 'team') => {
    setProcessing(true);
    try {
      const result = await upgradePlan(planType, 'annual');
      if (result.success) {
        alert('Plan upgraded successfully!');
        onClose();
      } else {
        alert(result.error || 'Upgrade failed');
      }
    } catch (error) {
      alert('Upgrade failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDowngrade = async () => {
    if (!downgradeReason) {
      alert('Please select a reason for downgrading');
      return;
    }

    setProcessing(true);
    try {
      // Store feedback for analytics
      const feedback = {
        type: 'downgrade',
        reason: downgradeReason,
        comments: downgradeComments,
        fromPlan: currentPlan.type,
        timestamp: new Date().toISOString()
      };
      
      const existingFeedback = JSON.parse(localStorage.getItem('downgrade_feedback') || '[]');
      existingFeedback.push(feedback);
      localStorage.setItem('downgrade_feedback', JSON.stringify(existingFeedback));

      // Simulate downgrade (in real app, this would call your API)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo, just show success message
      alert('Thank you for your feedback. Your plan will be downgraded at the end of your billing cycle.');
      onClose();
    } catch (error) {
      alert('Failed to process downgrade. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {showDowngradeForm ? (
          // Downgrade Form
          <>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertTriangle size={24} className="text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Downgrade Plan</h2>
                    <p className="text-gray-600">Help us understand why you're leaving</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => setShowDowngradeForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} />
                </motion.button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Current Plan Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Current Plan</h3>
                  <div className="flex items-center gap-3">
                    <PlanBadge planType={currentPlan.type} />
                    <span className="text-blue-800">
                      ${currentPlan.price}/{currentPlan.billingCycle === 'annual' ? 'year' : 'month'}
                    </span>
                  </div>
                </div>

                {/* Reason Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Why are you downgrading? *
                  </label>
                  <div className="space-y-2">
                    {downgradeReasons.map((reason) => (
                      <motion.button
                        key={reason}
                        onClick={() => setDowngradeReason(reason)}
                        className={`w-full p-3 border-2 rounded-lg text-left transition-all ${
                          downgradeReason === reason
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            downgradeReason === reason
                              ? 'border-orange-500 bg-orange-500'
                              : 'border-gray-300'
                          }`}>
                            {downgradeReason === reason && (
                              <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                            )}
                          </div>
                          <span className="text-gray-900">{reason}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Additional Comments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Comments (Optional)
                  </label>
                  <textarea
                    value={downgradeComments}
                    onChange={(e) => setDowngradeComments(e.target.value)}
                    placeholder="Help us improve by sharing more details..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    maxLength={500}
                  />
                  <div className="text-xs text-gray-500 mt-1">{downgradeComments.length}/500 characters</div>
                </div>

                {/* Warning */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900 mb-1">Before you go...</h4>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        <li>• Your plan will remain active until the end of your billing cycle</li>
                        <li>• You'll lose access to premium features after downgrade</li>
                        <li>• You can upgrade again anytime</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8">
                <motion.button
                  onClick={() => setShowDowngradeForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Keep Current Plan
                </motion.button>
                <motion.button
                  onClick={handleDowngrade}
                  disabled={!downgradeReason || processing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                  whileHover={{ scale: processing ? 1 : 1.02 }}
                  whileTap={{ scale: processing ? 1 : 0.98 }}
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <MessageSquare size={16} />
                      Submit Feedback & Downgrade
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          // Plan Options
          <>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Crown size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Manage Your Plan</h2>
                    <p className="text-gray-600">Upgrade, downgrade, or modify your subscription</p>
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

            <div className="p-6">
              {/* Current Plan */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-3">Current Plan</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <PlanBadge planType={currentPlan.type} />
                    <div>
                      <div className="font-medium text-blue-900">{currentPlan.name}</div>
                      <div className="text-sm text-blue-700">
                        ${currentPlan.price}/{currentPlan.billingCycle === 'annual' ? 'year' : 'month'}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-blue-600">
                    {currentPlan.status === 'active' ? '✅ Active' : currentPlan.status}
                  </div>
                </div>
              </div>

              {/* Available Plans */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Available Plans</h3>
                
                {/* Free Plan */}
                {currentPlan.type !== 'free' && (
                  <motion.div
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <PlanBadge planType="free" />
                        <div>
                          <div className="font-medium text-gray-900">Free Plan</div>
                          <div className="text-sm text-gray-600">$0/month • Up to 3 repositories</div>
                        </div>
                      </div>
                      <motion.button
                        onClick={() => setShowDowngradeForm(true)}
                        className="px-4 py-2 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Downgrade
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Pro Plan */}
                {currentPlan.type !== 'pro' && (
                  <motion.div
                    className="border-2 border-indigo-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <PlanBadge planType="pro" />
                        <div>
                          <div className="font-medium text-gray-900">Pro Plan</div>
                          <div className="text-sm text-gray-600">$12/year • Unlimited repositories</div>
                        </div>
                      </div>
                      <motion.button
                        onClick={() => handleUpgrade('pro')}
                        disabled={processing}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        whileHover={{ scale: processing ? 1 : 1.05 }}
                        whileTap={{ scale: processing ? 1 : 0.95 }}
                      >
                        {currentPlan.type === 'free' ? 'Upgrade' : 'Downgrade'}
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Team Plan */}
                {currentPlan.type !== 'team' && (
                  <motion.div
                    className="border-2 border-blue-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <PlanBadge planType="team" />
                        <div>
                          <div className="font-medium text-gray-900">Team Plan</div>
                          <div className="text-sm text-gray-600">$20/year • Team collaboration</div>
                        </div>
                      </div>
                      <motion.button
                        onClick={() => handleUpgrade('team')}
                        disabled={processing}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        whileHover={{ scale: processing ? 1 : 1.05 }}
                        whileTap={{ scale: processing ? 1 : 0.95 }}
                      >
                        Upgrade
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Billing Info */}
              {currentPlan.nextBillingDate && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Billing Information</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Next billing date: {new Date(currentPlan.nextBillingDate).toLocaleDateString()}</div>
                    <div>Billing cycle: {currentPlan.billingCycle}</div>
                    <div>Status: {currentPlan.status}</div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default PlanChangeModal;