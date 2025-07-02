import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import EmailNotificationService from './components/EmailNotificationService';
import { useGitHubIntegration } from './hooks/useGitHubIntegration';

function AppContent() {
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const { isConnected } = useGitHubIntegration();
  const location = useLocation();

  // FIXED: Show landing page when on root path, regardless of connection status
  const showLanding = location.pathname === '/' || location.pathname === '';
  
  // Show setup screen if trying to access app routes but not connected
  const isAppRoute = ['/dashboard', '/repositories', '/test', '/settings'].includes(location.pathname);
  const showSetup = !isConnected && isAppRoute;

  if (showLanding) {
    return <LandingPage onGetStarted={() => {}} />;
  }

  if (showSetup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <GitHubSetup />
      </div>
    );
  }

  return (
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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/repositories" element={<Repositories />} />
            <Route path="/review/:id" element={<CodeReview />} />
            <Route path="/test" element={<TestReview />} />
            <Route path="/settings" element={<Settings />} />
            {/* HIDDEN: Admin route - only accessible via direct URL */}
            <Route path="/admin" element={<AdminRoute />} />
          </Routes>
        </motion.div>
      </main>

      <AnimatePresence>
        {subscriptionModalOpen && (
          <SubscriptionModal onClose={() => setSubscriptionModalOpen(false)} />
        )}
      </AnimatePresence>

      {/* Email Notification Service */}
      <EmailNotificationService />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;