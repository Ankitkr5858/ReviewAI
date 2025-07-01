import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Bell, Shield, Zap, Github, Gitlab, PaintBucket as BitBucket, Key, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useGitHubIntegration } from '../hooks/useGitHubIntegration';
import SubscriptionModal from './SubscriptionModal';
import Header from './Header';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const { isConnected, disconnect } = useGitHubIntegration();
  
  const [settings, setSettings] = useState({
    general: {
      organizationName: localStorage.getItem('org_name') || 'My Organization',
      defaultBranch: localStorage.getItem('default_branch') || 'main',
    },
    notifications: {
      email: localStorage.getItem('notify_email') === 'true',
      push: localStorage.getItem('notify_push') === 'true',
      slack: localStorage.getItem('notify_slack') === 'true'
    },
    review: {
      autoMerge: localStorage.getItem('auto_merge') === 'true',
      dailyReview: localStorage.getItem('daily_review') !== 'false', // default true
      strictMode: localStorage.getItem('strict_mode') !== 'false', // default true
      autoFix: localStorage.getItem('auto_fix') !== 'false' // default true
    },
    integrations: {
      github: { 
        connected: isConnected, 
        token: isConnected ? '***********' : '' 
      },
      gitlab: { connected: false, token: '' },
      bitbucket: { connected: false, token: '' }
    }
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'review', label: 'Review Settings', icon: Zap },
    { id: 'integrations', label: 'Integrations', icon: Key }
  ];

  const handleSettingChange = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const handleGeneralChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      general: {
        ...prev.general,
        [key]: value
      }
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    
    try {
      // Save to localStorage
      localStorage.setItem('org_name', settings.general.organizationName);
      localStorage.setItem('default_branch', settings.general.defaultBranch);
      
      localStorage.setItem('notify_email', settings.notifications.email.toString());
      localStorage.setItem('notify_push', settings.notifications.push.toString());
      localStorage.setItem('notify_slack', settings.notifications.slack.toString());
      
      localStorage.setItem('auto_merge', settings.review.autoMerge.toString());
      localStorage.setItem('daily_review', settings.review.dailyReview.toString());
      localStorage.setItem('strict_mode', settings.review.strictMode.toString());
      localStorage.setItem('auto_fix', settings.review.autoFix.toString());
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnectGitHub = () => {
    if (confirm('Are you sure you want to disconnect GitHub? This will remove all your data.')) {
      disconnect();
      setSettings(prev => ({
        ...prev,
        integrations: {
          ...prev.integrations,
          github: { connected: false, token: '' }
        }
      }));
    }
  };

  // Update GitHub connection status
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      integrations: {
        ...prev.integrations,
        github: { 
          connected: isConnected, 
          token: isConnected ? '***********' : '' 
        }
      }
    }));
  }, [isConnected]);

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
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">Configure your ReviewAI preferences</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Tabs */}
            <motion.div
              className="lg:col-span-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left cursor-pointer ${
                        activeTab === tab.id
                          ? 'bg-black text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <tab.icon size={18} />
                      <span className="font-medium">{tab.label}</span>
                    </motion.button>
                  ))}
                </nav>
              </div>
            </motion.div>

            {/* Content */}
            <motion.div
              className="lg:col-span-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                {/* General Settings */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Organization Name
                        </label>
                        <input
                          type="text"
                          value={settings.general.organizationName}
                          onChange={(e) => handleGeneralChange('organizationName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Default Branch
                        </label>
                        <select 
                          value={settings.general.defaultBranch}
                          onChange={(e) => handleGeneralChange('defaultBranch', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent cursor-pointer"
                        >
                          <option value="main">main</option>
                          <option value="master">master</option>
                          <option value="develop">develop</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
                    
                    <div className="space-y-4">
                      {Object.entries(settings.notifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 capitalize">{key} Notifications</p>
                            <p className="text-sm text-gray-600">
                              Get notified via {key} when reviews complete
                            </p>
                          </div>
                          <motion.button
                            onClick={() => handleSettingChange('notifications', key, !value)}
                            className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                              value ? 'bg-black' : 'bg-gray-300'
                            }`}
                            whileTap={{ scale: 0.95 }}
                          >
                            <motion.div
                              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform"
                              animate={{ x: value ? 24 : 4 }}
                            />
                          </motion.button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Settings */}
                {activeTab === 'review' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Review Configuration</h3>
                    
                    <div className="space-y-4">
                      {Object.entries(settings.review).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </p>
                            <p className="text-sm text-gray-600">
                              {key === 'autoMerge' && 'Automatically merge PRs when no issues found'}
                              {key === 'dailyReview' && 'Run daily reviews on main branch'}
                              {key === 'strictMode' && 'Enable strict review mode with enhanced checks'}
                              {key === 'autoFix' && 'Automatically fix linting and formatting issues'}
                            </p>
                          </div>
                          <motion.button
                            onClick={() => handleSettingChange('review', key, !value)}
                            className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                              value ? 'bg-black' : 'bg-gray-300'
                            }`}
                            whileTap={{ scale: 0.95 }}
                          >
                            <motion.div
                              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform"
                              animate={{ x: value ? 24 : 4 }}
                            />
                          </motion.button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Integrations */}
                {activeTab === 'integrations' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Platform Integrations</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Github size={24} />
                          <div>
                            <p className="font-medium text-gray-900">GitHub</p>
                            <p className="text-sm text-gray-600">
                              {settings.integrations.github.connected ? 'Connected' : 'Not connected'}
                            </p>
                          </div>
                        </div>
                        <motion.button
                          onClick={settings.integrations.github.connected ? handleDisconnectGitHub : undefined}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                            settings.integrations.github.connected
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-black text-white hover:bg-gray-800'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {settings.integrations.github.connected ? 'Disconnect' : 'Connect'}
                        </motion.button>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg opacity-50">
                        <div className="flex items-center gap-3">
                          <Gitlab size={24} />
                          <div>
                            <p className="font-medium text-gray-900">GitLab</p>
                            <p className="text-sm text-gray-600">Coming soon</p>
                          </div>
                        </div>
                        <button
                          disabled
                          className="px-4 py-2 bg-gray-200 text-gray-400 rounded-lg font-medium cursor-not-allowed"
                        >
                          Connect
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg opacity-50">
                        <div className="flex items-center gap-3">
                          <BitBucket size={24} />
                          <div>
                            <p className="font-medium text-gray-900">Bitbucket</p>
                            <p className="text-sm text-gray-600">Coming soon</p>
                          </div>
                        </div>
                        <button
                          disabled
                          className="px-4 py-2 bg-gray-200 text-gray-400 rounded-lg font-medium cursor-not-allowed"
                        >
                          Connect
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end pt-6 border-t border-gray-200">
                  {saved && (
                    <motion.div
                      className="flex items-center gap-2 text-green-600 mr-4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <CheckCircle size={18} />
                      <span className="text-sm">Settings saved!</span>
                    </motion.div>
                  )}
                  <motion.button
                    onClick={saveSettings}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
                    whileHover={{ scale: saving ? 1 : 1.05 }}
                    whileTap={{ scale: saving ? 1 : 0.95 }}
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Changes
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <SubscriptionModal onClose={() => setShowSubscriptionModal(false)} />
      )}
    </div>
  );
};

export default Settings;