import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './components/Dashboard';
import Repositories from './components/Repositories';
import CodeReview from './components/CodeReview';
import Settings from './components/Settings';
import SubscriptionModal from './components/SubscriptionModal';
import GitHubSetup from './components/GitHubSetup';
import TestReview from './components/TestReview';
import LandingPage from './components/LandingPage';
import AdminRoute from './components/AdminRoute';
import { useGitHubIntegration } from './hooks/useGitHubIntegration';

function App() {
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const { isConnected } = useGitHubIntegration();

  // Show landing page first
  if (showLanding) {
    return (
      <LandingPage onGetStarted={() => setShowLanding(false)} />
    );
  }

  // Show setup screen if not connected to GitHub
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <GitHubSetup />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans">
        {/* NO SIDEBAR - Full width layout */}
        <main className="min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="h-full"
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/repositories" element={<Repositories />} />
              <Route path="/review/:id" element={<CodeReview />} />
              <Route path="/test" element={<TestReview />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<AdminRoute />} />
            </Routes>
          </motion.div>
        </main>

        <AnimatePresence>
          {subscriptionModalOpen && (
            <SubscriptionModal onClose={() => setSubscriptionModalOpen(false)} />
          )}
        </AnimatePresence>
      </div>
    </Router>
  );
}

export default App;