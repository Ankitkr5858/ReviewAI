import React, { useState, useEffect } from 'react';
import { Menu, Wand2, User, LogOut, Settings, ChevronDown, Home, GitBranch, Calendar, MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGitHubIntegration } from '../hooks/useGitHubIntegration';
import CalendlyIntegration from './CalendlyIntegration';

interface HeaderProps {
  onMenuClick: () => void;
  onSubscriptionClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onSubscriptionClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { disconnect } = useGitHubIntegration();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: 'User',
    email: 'user@example.com',
    avatar: '',
    loading: true
  });

  // Get real user info from GitHub - ONLY ONCE on mount
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
              avatar: userData.avatar_url || '',
              loading: false
            });
          } else {
            setUserInfo(prev => ({ ...prev, loading: false }));
          }
        } catch (error) {
          console.error('Failed to fetch user info:', error);
          setUserInfo(prev => ({ ...prev, loading: false }));
        }
      } else {
        setUserInfo(prev => ({ ...prev, loading: false }));
      }
    };

    fetchUserInfo();
  }, []); // FIXED: Only run once on mount

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

  // Check if we're on the landing page
  const isLandingPage = location.pathname === '/';

  // Landing page navigation items (simple links)
  const landingNavItems = [
    { label: 'Features', href: '#features' },
    { label: 'Compare', href: '#compare' },
    { label: 'Reviews', href: '#reviews' },
    { label: 'Feedback', href: '#feedback' },
    { label: 'Book a Call', href: '#book-call', action: () => setShowBookingModal(true) }
  ];

  // App navigation items (for authenticated users)
  const appNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/repositories', label: 'Repositories', icon: GitBranch },
    { path: '/test', label: 'Review Code', icon: Wand2 },
    { path: '/feedback', label: 'Feedback', icon: MessageSquare },
    { path: '#book-call', label: 'Book a Call', icon: Calendar, action: () => setShowBookingModal(true) }
  ];

  const isActivePath = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    if (location.pathname === path) return; // Don't navigate if already on the page
    if (path === '#book-call') return; // Don't navigate for book call
    navigate(path);
  };

  const handleLandingNavClick = (item: any) => {
    if (item.action) {
      item.action();
    } else {
      // Smooth scroll to section
      const element = document.querySelector(item.href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="border-b border-gray-100 bg-white/95 backdrop-blur-md sticky top-0 z-50">
      {/* FIXED: Proper container with balanced spacing */}
      <div className="w-full px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left side - Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden cursor-pointer"
            >
              <Menu size={20} />
            </button>
            
            {/* FIXED: Logo now goes to landing page */}
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
          </div>

          {/* Center navigation */}
          <nav className="hidden md:flex items-center gap-1 relative">
            {isLandingPage ? (
              // Landing page navigation
              landingNavItems.map((item) => (
                <motion.button
                  key={item.label}
                  onClick={() => handleLandingNavClick(item)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300 font-medium cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <span>{item.label}</span>
                </motion.button>
              ))
            ) : (
              // App navigation with active states
              appNavItems.map((item) => (
                <motion.div
                  key={item.path}
                  onClick={() => item.action ? item.action() : handleNavigation(item.path)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 cursor-pointer ${
                    isActivePath(item.path)
                      ? 'text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  layout
                >
                  {/* FIXED: SLOWER background animation with layout ID */}
                  {isActivePath(item.path) && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"
                      layoutId="activeTab"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                        duration: 0.4
                      }}
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-2">
                    {item.icon && <item.icon size={16} />}
                    <span className="font-medium">{item.label}</span>
                  </div>
                </motion.div>
              ))
            )}
          </nav>

          {/* Right side - Get Started or User menu */}
          <div className="flex items-center gap-4">
            {isLandingPage ? (
              <motion.button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
              </motion.button>
            ) : (
              // User Menu for app pages
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
                  {/* FIXED: Show loading state for avatar */}
                  {userInfo.loading ? (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : userInfo.avatar ? (
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
                            {userInfo.loading ? (
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                              </div>
                            ) : userInfo.avatar ? (
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
                          {/* FIXED: Quick Navigation */}
                          {appNavItems.map((item) => (
                            <motion.button
                              key={item.path}
                              onClick={() => {
                                if (item.action) {
                                  item.action();
                                } else {
                                  handleNavigation(item.path);
                                }
                                setShowUserMenu(false);
                              }}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left cursor-pointer ${
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
                              {item.icon && <item.icon size={16} />}
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
            )}
          </div>
        </div>
      </div>
      
      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowBookingModal(false)}
          >
            <motion.div
              className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Book a Demo Call</h2>
                <motion.button
                  onClick={() => setShowBookingModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} />
                </motion.button>
              </div>
              <CalendlyIntegration 
                url="https://calendly.com/ankitkr5858/30min" 
                prefill={{
                  name: userInfo.name,
                  email: userInfo.email
                }}
                styles={{ height: '700px' }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;