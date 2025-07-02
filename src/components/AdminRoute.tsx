import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Key } from 'lucide-react';
import AdminFeedbackPanel from './AdminFeedbackPanel';

interface AdminRouteProps {
  isAuthenticated?: boolean;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ isAuthenticated = false }) => {
  const [adminPassword, setAdminPassword] = React.useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = React.useState(false);
  const [error, setError] = React.useState('');

  // Simple admin authentication (in production, use proper auth)
  const ADMIN_PASSWORD = 'admin123'; // Simplified password

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      setError('');
      // Store admin session (expires on page refresh for security)
      sessionStorage.setItem('admin_authenticated', 'true');
    } else {
      setError('Invalid admin password');
    }
  };

  // Check if already authenticated in this session
  React.useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_authenticated') === 'true';
    setIsAdminAuthenticated(isAuthenticated);
  }, []);

  if (isAdminAuthenticated) {
    return <AdminFeedbackPanel />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <motion.div
        className="bg-white rounded-lg border border-gray-200 p-8 max-w-md w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-6">
          <div className="p-3 bg-blue-100 rounded-lg inline-block mb-4">
            <Shield size={32} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access</h2>
          <p className="text-gray-600">Enter admin password to manage feedback</p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Password
            </label>
            <div className="relative">
              <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          <motion.button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Key size={16} />
            Access Admin Panel
          </motion.button>
        </form>

        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>🔑 Admin Password:</strong> <code className="bg-green-100 px-2 py-1 rounded">admin123</code>
          </p>
          <p className="text-xs text-green-600 mt-1">
            Use this password to access the feedback management panel
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminRoute;