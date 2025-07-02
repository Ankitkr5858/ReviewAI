import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, AlertTriangle, X } from 'lucide-react';

interface EmailNotificationServiceProps {
  // No props needed
}

interface EmailLog {
  id: string;
  timestamp: string;
  to: string;
  subject: string;
  status: 'sent' | 'failed';
  feedbackId?: string;
}

const EmailNotificationService: React.FC<EmailNotificationServiceProps> = () => {
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<EmailLog | null>(null);

  // Load email logs from localStorage
  useEffect(() => {
    const loadEmailLogs = () => {
      const savedLogs = localStorage.getItem('email_logs');
      if (savedLogs) {
        try {
          const logs = JSON.parse(savedLogs);
          setEmailLogs(logs);
          
          // Show notification for the most recent email
          if (logs.length > 0) {
            const latestLog = logs[logs.length - 1];
            const logTime = new Date(latestLog.timestamp).getTime();
            const now = new Date().getTime();
            
            // Only show notification if the email was sent in the last 5 seconds
            if (now - logTime < 5000) {
              setCurrentNotification(latestLog);
              setShowNotification(true);
              
              // Hide notification after 5 seconds
              setTimeout(() => {
                setShowNotification(false);
              }, 5000);
            }
          }
        } catch (error) {
          console.error('Failed to load email logs:', error);
        }
      }
    };

    loadEmailLogs();

    // Listen for storage changes (when new emails are sent)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'email_logs') {
        loadEmailLogs();
      }
    };

    // Listen for custom event when feedback is submitted
    const handleFeedbackSubmitted = () => {
      // Wait a moment for the email log to be updated
      setTimeout(loadEmailLogs, 500);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('feedbackSubmitted', handleFeedbackSubmitted);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('feedbackSubmitted', handleFeedbackSubmitted);
    };
  }, []);

  // Listen for new email logs
  useEffect(() => {
    const checkForNewEmails = () => {
      const savedLogs = localStorage.getItem('email_logs');
      if (savedLogs) {
        try {
          const logs = JSON.parse(savedLogs);
          
          // Check if there are new logs
          if (logs.length > emailLogs.length) {
            setEmailLogs(logs);
            
            // Show notification for the most recent email
            const latestLog = logs[logs.length - 1];
            setCurrentNotification(latestLog);
            setShowNotification(true);
            
            // Hide notification after 5 seconds
            setTimeout(() => {
              setShowNotification(false);
            }, 5000);
          }
        } catch (error) {
          console.error('Failed to check for new emails:', error);
        }
      }
    };

    // Check for new emails every 2 seconds
    const interval = setInterval(checkForNewEmails, 2000);
    
    return () => clearInterval(interval);
  }, [emailLogs.length]);

  if (!showNotification || !currentNotification) {
    return null;
  }

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-50"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-80 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Mail size={16} />
            <span className="font-medium">Email Notification</span>
          </div>
          <button
            onClick={() => setShowNotification(false)}
            className="text-white hover:bg-white/20 rounded p-1 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              {currentNotification.status === 'sent' ? (
                <CheckCircle size={20} className="text-blue-600" />
              ) : (
                <AlertTriangle size={20} className="text-orange-600" />
              )}
            </div>
            
            <div>
              <p className="font-medium text-gray-900 mb-1">
                {currentNotification.status === 'sent' ? 'Email Sent Successfully' : 'Email Delivery Issue'}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                To: {currentNotification.to}
              </p>
              <p className="text-sm text-gray-700">
                {currentNotification.subject}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(currentNotification.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EmailNotificationService;