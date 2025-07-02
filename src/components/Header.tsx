import React, { useState, useEffect } from 'react';
import { Menu, Wand2, User, LogOut, Settings, ChevronDown, Home, GitBranch, Play, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGitHubIntegration } from '../hooks/useGitHubIntegration';

interface HeaderProps {
  onMenuClick: () => void;
  onSubscriptionClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onSubscriptionClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { disconnect } = useGitHubIntegration();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: 'User',
    email: 'user@example.com',
    avatar: ''
  });

  // Get real user info from GitHub
  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem('github_token');
      if (token) {
        try {
          const response = await fetch('https://api.github.com/user', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUserInfo({
              name: userData.name || userData.login || 'User',
              email: userData.email || `${userData.login}@github.com`,
              avatar: userData.avatar_url || ''
            });
          }
        } catch (error) {
          console.error('Failed to fetch user info:', error);
        }
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = () => {
    disconnect();
    setShowUserMenu(false);
    navigate('/');
    // Reload to reset the app state
    window.location.reload();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Navigation items with proper routing
  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/repositories', label: 'Repositories', icon: GitBranch },
    { path: '/test', label: 'Test Review', icon: Play },
    { path: '/admin', label: 'Admin Panel', icon: BarChart3 },
  ];

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="border-b border-gray-100 bg-white/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden cursor-pointer"
            >
              <Menu size={20} />
            </button>
            
            <motion.button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.1 }}
            >
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <Wand2 size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ReviewAI</h1>
                <p className="text-xs text-gray-500">Automated Code Review</p>
              </div>
            </motion.button>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center gap-1">
              {navigationItems.map((item) => (
                <motion.button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActivePath(item.path)
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                >
                  <item.icon size={16} />
                  <span className="font-medium">{item.label}</span>
                </motion.button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* User Menu */}
            <div className="relative">
              <motion.button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                {userInfo.avatar ? (
                  <img
                    src={userInfo.avatar}
                    alt={userInfo.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {getInitials(userInfo.name)}
                    </span>
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{userInfo.name}</p>
                  <p className="text-xs text-gray-500">{userInfo.email}</p>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </motion.button>

              {/* User Dropdown Menu */}
              <AnimatePresence>
                {showUserMenu && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowUserMenu(false)}
                    />
                    
                    {/* Dropdown */}
                    <motion.div
                      className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* User Info */}
                      <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-3">
                          {userInfo.avatar ? (
                            <img
                              src={userInfo.avatar}
                              alt={userInfo.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {getInitials(userInfo.name)}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{userInfo.name}</p>
                            <p className="text-sm text-gray-500 truncate">{userInfo.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        {/* Quick Navigation */}
                        {navigationItems.map((item) => (
                          <motion.button
                            key={item.path}
                            onClick={() => {
                              navigate(item.path);
                              setShowUserMenu(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                              isActivePath(item.path)
                                ? 'bg-blue-50 text-blue-600'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                            whileHover={{ 
                              scale: 1.02, 
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" 
                            }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.1 }}
                          >
                            <item.icon size={16} />
                            <span>{item.label}</span>
                          </motion.button>
                        ))}

                        <div className="border-t border-gray-200 my-2"></div>

                        <motion.button
                          onClick={() => {
                            navigate('/settings');
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors"
                          whileHover={{ 
                            scale: 1.02, 
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" 
                          }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: 0.1 }}
                        >
                          <Settings size={16} className="text-gray-500" />
                          <span className="text-gray-700">Settings</span>
                        </motion.button>

                        <motion.button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600"
                          whileHover={{ 
                            scale: 1.02, 
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" 
                          }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: 0.1 }}
                        >
                          <LogOut size={16} />
                          <span>Sign Out</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;