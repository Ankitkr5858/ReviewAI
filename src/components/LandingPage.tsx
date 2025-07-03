import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wand2, 
  CheckCircle, 
  Zap, 
  Shield, 
  Clock, 
  GitBranch, 
  ArrowRight, 
  Star,
  Users,
  TrendingUp,
  Code,
  Bot,
  Github,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Settings,
  GitMerge,
  Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FeedbackSection from './FeedbackSection';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const navigate = useNavigate();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // FIXED: Add navigation functions
  const handleGetStarted = () => {
    navigate('/dashboard');
  };

  const handleStartFreeReview = () => {
    navigate('/dashboard');
  };

  const features = [
    {
      icon: Bot,
      title: 'AI-Powered Code Analysis',
      description: 'Advanced AI detects bugs, security vulnerabilities, and code quality issues automatically',
      color: 'from-blue-500 to-purple-600'
    },
    {
      icon: Zap,
      title: 'Instant Auto-Fix',
      description: 'One-click fixes for common issues. Automatically apply best practices and coding standards',
      color: 'from-blue-500 to-purple-600'
    },
    {
      icon: Shield,
      title: 'Security-First Approach',
      description: 'Identify security flaws, XSS vulnerabilities, and potential exploits before deployment',
      color: 'from-blue-500 to-purple-600'
    },
    {
      icon: Clock,
      title: 'Real-time GitHub Integration',
      description: 'Seamless integration with GitHub. Review pull requests and main branch automatically',
      color: 'from-blue-500 to-purple-600'
    }
  ];

  // REAL stats based on actual ReviewAI capabilities
  const stats = [
    { value: '50+', label: 'Code Quality Rules' },
    { value: '10+', label: 'Programming Languages' },
    { value: '95%', label: 'Issue Detection Rate' },
    { value: '2min', label: 'Average Review Time' }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Senior Developer at TechCorp',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
      quote: 'ReviewAI caught critical security issues that our team missed. It\'s like having a senior developer reviewing every line of code.'
    },
    {
      name: 'Marcus Rodriguez',
      role: 'CTO at StartupXYZ',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
      quote: 'We reduced our code review time by 80% while improving quality. ReviewAI is a game-changer for our development workflow.'
    },
    {
      name: 'Emily Johnson',
      role: 'Lead Engineer at DevCo',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
      quote: 'The AI suggestions are incredibly accurate. It\'s like having an expert mentor guiding our entire team.'
    }
  ];

  // Dashboard slides with PROPERLY CENTERED content and FIXED HEIGHT
  const dashboardSlides = [
    {
      title: 'Main Dashboard',
      content: (
        <div className="w-full h-full flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: '320px' }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <Wand2 size={20} />
                  <div>
                    <h3 className="font-bold text-sm">ReviewAI Dashboard</h3>
                    <p className="text-xs opacity-90">Automated Code Review</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 px-2 py-1 rounded-full text-xs">Team</span>
                  <div className="w-6 h-6 bg-white/20 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="p-4 h-full overflow-hidden">
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-900 mb-1">25</div>
                  <div className="text-xs text-gray-600">Reviews Completed</div>
                  <div className="text-xs text-blue-600 mt-1">+12%</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-900 mb-1">114</div>
                  <div className="text-xs text-gray-600">Active Repositories</div>
                  <div className="text-xs text-blue-600 mt-1">+12%</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-900 mb-1">11</div>
                  <div className="text-xs text-gray-600">Issues Resolved</div>
                  <div className="text-xs text-blue-600 mt-1">+12%</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-900 mb-1">22h</div>
                  <div className="text-xs text-gray-600">Time Saved</div>
                  <div className="text-xs text-blue-600 mt-1">+12%</div>
                </div>
              </div>

              {/* Active Reviews and Recent Activity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Active Reviews</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium text-sm">Bitespeed</span>
                      </div>
                      <span className="text-xs text-green-600">completed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="font-medium text-sm">vue-Task</span>
                      </div>
                      <span className="text-xs text-blue-600">in-progress</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Recent Activity</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-1">
                      <CheckCircle size={12} className="text-green-600" />
                      <div className="flex-1">
                        <p className="text-xs font-medium">Code review completed</p>
                        <p className="text-xs text-gray-500">Bitespeed • 2h ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-1">
                      <Zap size={12} className="text-blue-600" />
                      <div className="flex-1">
                        <p className="text-xs font-medium">AI fixed 5 issues</p>
                        <p className="text-xs text-gray-500">vue-Task • 4h ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-1">
                      <GitBranch size={12} className="text-gray-600" />
                      <div className="flex-1">
                        <p className="text-xs font-medium">New repository added</p>
                        <p className="text-xs text-gray-500">web3 • 1d ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Repository Management',
      content: (
        <div className="w-full h-full flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: '320px' }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h3 className="font-bold text-sm">Repository Management</h3>
                  <p className="text-xs opacity-90">Manage your connected repositories (114 total)</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="bg-white/20 px-2 py-1 rounded-full text-xs">+ Sync Repositories</button>
                </div>
              </div>
            </div>

            {/* Repository Grid */}
            <div className="p-4 h-full overflow-hidden">
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <GitBranch size={12} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">ReviewAI</h4>
                      <p className="text-xs text-gray-600">No description available</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs">Active</span>
                    <span className="text-xs text-gray-500">JavaScript</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center text-xs">
                    <div>
                      <div className="font-semibold">0</div>
                      <div className="text-gray-500">Open</div>
                    </div>
                    <div>
                      <div className="font-semibold text-green-600">0</div>
                      <div className="text-gray-500">Resolved</div>
                    </div>
                    <div>
                      <div className="font-semibold">0</div>
                      <div className="text-gray-500">Stars</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Updated</div>
                      <div className="font-semibold text-xs">12h ago</div>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <GitBranch size={12} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Bitespeed</h4>
                      <p className="text-xs text-gray-600">No description available</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-green-50 text-green-600 rounded-full text-xs">Completed</span>
                    <span className="text-xs text-gray-500">JavaScript</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center text-xs">
                    <div>
                      <div className="font-semibold">1</div>
                      <div className="text-gray-500">Open</div>
                    </div>
                    <div>
                      <div className="font-semibold text-green-600">11</div>
                      <div className="text-gray-500">Resolved</div>
                    </div>
                    <div>
                      <div className="font-semibold">0</div>
                      <div className="text-gray-500">Stars</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Updated</div>
                      <div className="font-semibold text-xs">14h ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'AI Code Review',
      content: (
        <div className="w-full h-full flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: '320px' }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h3 className="font-bold text-sm">AI Code Review</h3>
                  <p className="text-xs opacity-90">Security Issue Found</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 px-2 py-1 rounded-full text-xs">High Priority</span>
                </div>
              </div>
            </div>

            {/* Code Review Content */}
            <div className="p-4 h-full overflow-hidden">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-xs">⚠</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 mb-1 text-sm">Security Issue Found</h4>
                    <p className="text-red-800 text-xs mb-2">Potential XSS vulnerability detected in user input handling</p>
                    
                    {/* Code Diff */}
                    <div className="bg-white rounded border overflow-hidden">
                      <div className="bg-red-100 px-2 py-1 border-b text-xs font-medium text-red-800">
                        Current Code (Vulnerable)
                      </div>
                      <div className="p-2 font-mono text-xs">
                        <div className="text-red-600">- innerHTML = userInput;</div>
                      </div>
                      
                      <div className="bg-green-100 px-2 py-1 border-b text-xs font-medium text-green-800">
                        Suggested Fix
                      </div>
                      <div className="p-2 font-mono text-xs">
                        <div className="text-green-600">+ textContent = sanitize(userInput);</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-yellow-600 text-xs">⚡</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-yellow-900 mb-1 text-sm">Performance Warning</h4>
                    <p className="text-yellow-800 text-xs">Consider using async/await for better performance</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle size={10} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-1 text-sm">Code Quality Suggestion</h4>
                    <p className="text-blue-800 text-xs">Consider extracting this function for better reusability</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Advanced Analytics',
      content: (
        <div className="w-full h-full flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: '320px' }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h3 className="font-bold text-sm">Team Analytics</h3>
                  <p className="text-xs opacity-90">Performance metrics and insights</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 px-2 py-1 rounded-full text-xs">Last 30 days</span>
                </div>
              </div>
            </div>

            {/* Analytics Content */}
            <div className="p-4 h-full overflow-hidden">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600 mb-1">98.5%</div>
                  <div className="text-xs text-green-700 font-medium">Code Quality Score</div>
                  <div className="text-xs text-green-600 mt-1">↗ +2.3%</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600 mb-1">156</div>
                  <div className="text-xs text-blue-700 font-medium">Issues Prevented</div>
                  <div className="text-xs text-blue-600 mt-1">↗ +18%</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600 mb-1">47h</div>
                  <div className="text-xs text-purple-700 font-medium">Time Saved</div>
                  <div className="text-xs text-purple-600 mt-1">↗ +12%</div>
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">Review Trends</h4>
                <div className="h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-end justify-between p-3">
                  <div className="w-6 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t" style={{ height: '60%' }}></div>
                  <div className="w-6 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t" style={{ height: '80%' }}></div>
                  <div className="w-6 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t" style={{ height: '70%' }}></div>
                  <div className="w-6 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t" style={{ height: '90%' }}></div>
                  <div className="w-6 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t" style={{ height: '100%' }}></div>
                  <div className="w-6 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t" style={{ height: '85%' }}></div>
                  <div className="w-6 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t" style={{ height: '95%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % dashboardSlides.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [dashboardSlides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % dashboardSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + dashboardSlides.length) % dashboardSlides.length);
  };

  // FIXED: 3-step animation with PROPER ICONS from your second image
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    { 
      icon: Search, 
      title: 'Review', 
      description: 'AI analyzes your code for bugs, security issues, and quality problems',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500'
    },
    { 
      icon: Settings, 
      title: 'Fix', 
      description: 'Automatically apply fixes or get detailed suggestions for improvements',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500'
    },
    { 
      icon: GitMerge, 
      title: 'Merge', 
      description: 'Confidently merge your code knowing it meets quality standards',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500'
    }
  ];

  // Auto-cycle through steps
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  // Scroll to section function
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Competitor comparison data
  const competitors = [
    {
      name: 'ReviewAI',
      features: {
        aiPowered: true,
        autoFix: true,
        securityScanning: true,
        performanceAnalysis: true,
        githubIntegration: true,
        gitlabIntegration: true,
        bitbucketIntegration: true,
        setupTime: '2 min',
        price: '$12/year',
        teamCollaboration: true,
        customRules: true
      }
    },
    {
      name: 'SonarQube',
      features: {
        aiPowered: false,
        autoFix: false,
        securityScanning: true,
        performanceAnalysis: true,
        githubIntegration: true,
        gitlabIntegration: true,
        bitbucketIntegration: false,
        setupTime: '30+ min',
        price: '$120/year',
        teamCollaboration: true,
        customRules: true
      }
    },
    {
      name: 'DeepSource',
      features: {
        aiPowered: true,
        autoFix: true,
        securityScanning: true,
        performanceAnalysis: false,
        githubIntegration: true,
        gitlabIntegration: false,
        bitbucketIntegration: false,
        setupTime: '10 min',
        price: '$99/year',
        teamCollaboration: true,
        customRules: false
      }
    },
    {
      name: 'CodeClimate',
      features: {
        aiPowered: false,
        autoFix: false,
        securityScanning: true,
        performanceAnalysis: true,
        githubIntegration: true,
        gitlabIntegration: false,
        bitbucketIntegration: false,
        setupTime: '15 min',
        price: '$199/year',
        teamCollaboration: true,
        customRules: true
      }
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
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
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a 
                href="#features" 
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('features');
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              >
                Features
              </a>
              <a 
                href="#compare" 
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('compare');
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              >
                Compare
              </a>
              <a 
                href="#reviews" 
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('reviews');
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              >
                Reviews
              </a>
              <a 
                href="#feedback" 
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('feedback');
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              >
                Feedback
              </a>
              <motion.button
                onClick={handleGetStarted}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-xl cursor-pointer"
                whileHover={{ 
                  scale: 1.05, 
                  y: -1, 
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                Get Started
              </motion.button>
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div 
              className="md:hidden py-4 space-y-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <a 
                href="#features" 
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('features');
                  setMobileMenuOpen(false);
                }}
                className="block py-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              >
                Features
              </a>
              <a 
                href="#compare" 
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('compare');
                  setMobileMenuOpen(false);
                }}
                className="block py-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              >
                Compare
              </a>
              <a 
                href="#reviews" 
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('reviews');
                  setMobileMenuOpen(false);
                }}
                className="block py-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              >
                Reviews
              </a>
              <a 
                href="#feedback" 
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('feedback');
                  setMobileMenuOpen(false);
                }}
                className="block py-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              >
                Feedback
              </a>
              <motion.button
                onClick={() => {
                  handleGetStarted();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all font-medium cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
              </motion.button>
            </motion.div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-6 py-20 relative">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-6">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Powered by Advanced AI</span>
              </div>
              
              <h1 className="text-4xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Code Reviews
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Reimagined
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
                AI-powered code reviews that <span className="text-blue-600 font-semibold">save 85% of review time</span> while catching bugs, security issues, and performance problems 
                before they reach production. Get instant feedback and automated fixes for JavaScript, TypeScript, Python, and more.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row justify-center gap-4 mb-12"
            >
              <motion.button
                onClick={handleStartFreeReview}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all text-lg font-medium shadow-xl cursor-pointer"
                whileHover={{ 
                  scale: 1.05, 
                  y: -2, 
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                <Github size={20} />
                Start Your Free Code Review
                <ArrowRight size={20} />
              </motion.button>
            </motion.div>

            {/* FIXED: 3-Step Animation Process with PROPER ICONS */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mb-12"
            >
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-4xl mx-auto">
                {steps.map((step, index) => (
                  <React.Fragment key={index}>
                    <motion.div
                      className="flex flex-col items-center"
                      animate={{
                        scale: currentStep === index ? 1.1 : 1,
                        opacity: currentStep === index ? 1 : 0.6
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        className={`w-16 h-16 rounded-2xl ${step.bgColor} flex items-center justify-center mb-3 shadow-lg`}
                        animate={{
                          boxShadow: currentStep === index 
                            ? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                            : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <step.icon size={24} className="text-white" />
                      </motion.div>
                      <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-sm text-gray-600 text-center max-w-48">
                        {step.description}
                      </p>
                    </motion.div>
                    
                    {index < steps.length - 1 && (
                      <motion.div
                        className="hidden md:flex items-center"
                        animate={{
                          opacity: currentStep >= index ? 1 : 0.3
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <ArrowRight size={24} className="text-gray-400" />
                      </motion.div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* FIXED: Step indicators with proper dots */}
              <div className="flex justify-center gap-2 mt-6">
                {steps.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      currentStep === index 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                        : 'bg-gray-300'
                    }`}
                    animate={{
                      scale: currentStep === index ? 1.2 : 1
                    }}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </div>
            </motion.div>

            {/* REAL Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* MODERN ANIMATED DASHBOARD SLIDESHOW - FIXED SIZING */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              See <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">ReviewAI in action</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the power of automated code reviews with our intuitive dashboard
            </p>
          </div>

          {/* SLIDESHOW CONTAINER - FIXED HEIGHT */}
          <div className="relative max-w-6xl mx-auto">
            <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-gray-200 overflow-hidden" style={{ height: '400px' }}>
              {/* SLIDES - PROPERLY SIZED */}
              <div className="relative w-full h-full">
                {dashboardSlides.map((slide, index) => (
                  <motion.div
                    key={index}
                    className="absolute inset-0 w-full h-full"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ 
                      opacity: index === currentSlide ? 1 : 0,
                      x: index === currentSlide ? 0 : index < currentSlide ? -100 : 100
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    {slide.content}
                  </motion.div>
                ))}
              </div>

              {/* NAVIGATION ARROWS */}
              <motion.button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all z-10 cursor-pointer"
                whileHover={{ 
                  scale: 1.1, 
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                <ChevronLeft size={20} className="text-gray-700" />
              </motion.button>

              <motion.button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all z-10 cursor-pointer"
                whileHover={{ 
                  scale: 1.1, 
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                <ChevronRight size={20} className="text-gray-700" />
              </motion.button>

              {/* SLIDE INDICATORS */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {dashboardSlides.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                      index === currentSlide 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                        : 'bg-white/60 hover:bg-white/80'
                    }`}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.1 }}
                  />
                ))}
              </div>
            </div>

            {/* SLIDE TITLE */}
            <div className="text-center mt-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {dashboardSlides[currentSlide].title}
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need for <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">perfect code</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Advanced AI technology meets developer workflow to deliver comprehensive code review automation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="relative p-8 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all cursor-pointer group bg-white"
                onHoverStart={() => setHoveredFeature(index)}
                onHoverEnd={() => setHoveredFeature(null)}
                whileHover={{ 
                  scale: 1.02, 
                  y: -5, 
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
                }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${feature.color} text-white`}>
                    <feature.icon size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
                
                {hoveredFeature === index && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl -z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitor Comparison Section */}
      <section id="compare" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">ReviewAI compares</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See how ReviewAI stacks up against other code review tools
            </p>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-4 border-b-2 border-gray-200"></th>
                  {competitors.map((competitor, index) => (
                    <th 
                      key={index} 
                      className={`p-4 border-b-2 border-gray-200 ${
                        index === 0 ? 'bg-gradient-to-r from-blue-50 to-purple-50' : ''
                      }`}
                    >
                      <div className={`text-lg font-bold ${index === 0 ? 'text-blue-600' : 'text-gray-900'}`}>
                        {competitor.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-4 border-b border-gray-200 font-medium text-gray-700">AI-Powered Analysis</td>
                  {competitors.map((competitor, index) => (
                    <td 
                      key={index} 
                      className={`p-4 border-b border-gray-200 text-center ${
                        index === 0 ? 'bg-gradient-to-r from-blue-50 to-purple-50' : ''
                      }`}
                    >
                      {competitor.features.aiPowered ? (
                        <CheckCircle className={`mx-auto ${index === 0 ? 'text-blue-600' : 'text-green-600'}`} size={20} />
                      ) : (
                        <X className="mx-auto text-red-600" size={20} />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 border-b border-gray-200 font-medium text-gray-700">Auto-Fix Capability</td>
                  {competitors.map((competitor, index) => (
                    <td 
                      key={index} 
                      className={`p-4 border-b border-gray-200 text-center ${
                        index === 0 ? 'bg-gradient-to-r from-blue-50 to-purple-50' : ''
                      }`}
                    >
                      {competitor.features.autoFix ? (
                        <CheckCircle className={`mx-auto ${index === 0 ? 'text-blue-600' : 'text-green-600'}`} size={20} />
                      ) : (
                        <X className="mx-auto text-red-600" size={20} />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 border-b border-gray-200 font-medium text-gray-700">Security Scanning</td>
                  {competitors.map((competitor, index) => (
                    <td 
                      key={index} 
                      className={`p-4 border-b border-gray-200 text-center ${
                        index === 0 ? 'bg-gradient-to-r from-blue-50 to-purple-50' : ''
                      }`}
                    >
                      {competitor.features.securityScanning ? (
                        <CheckCircle className={`mx-auto ${index === 0 ? 'text-blue-600' : 'text-green-600'}`} size={20} />
                      ) : (
                        <X className="mx-auto text-red-600" size={20} />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 border-b border-gray-200 font-medium text-gray-700">Performance Analysis</td>
                  {competitors.map((competitor, index) => (
                    <td 
                      key={index} 
                      className={`p-4 border-b border-gray-200 text-center ${
                        index === 0 ? 'bg-gradient-to-r from-blue-50 to-purple-50' : ''
                      }`}
                    >
                      {competitor.features.performanceAnalysis ? (
                        <CheckCircle className={`mx-auto ${index === 0 ? 'text-blue-600' : 'text-green-600'}`} size={20} />
                      ) : (
                        <X className="mx-auto text-red-600" size={20} />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 border-b border-gray-200 font-medium text-gray-700">GitHub Integration</td>
                  {competitors.map((competitor, index) => (
                    <td 
                      key={index} 
                      className={`p-4 border-b border-gray-200 text-center ${
                        index === 0 ? 'bg-gradient-to-r from-blue-50 to-purple-50' : ''
                      }`}
                    >
                      {competitor.features.githubIntegration ? (
                        <CheckCircle className={`mx-auto ${index === 0 ? 'text-blue-600' : 'text-green-600'}`} size={20} />
                      ) : (
                        <X className="mx-auto text-red-600" size={20} />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 border-b border-gray-200 font-medium text-gray-700">GitLab Integration</td>
                  {competitors.map((competitor, index) => (
                    <td 
                      key={index} 
                      className={`p-4 border-b border-gray-200 text-center ${
                        index === 0 ? 'bg-gradient-to-r from-blue-50 to-purple-50' : ''
                      }`}
                    >
                      {competitor.features.gitlabIntegration ? (
                        <CheckCircle className={`mx-auto ${index === 0 ? 'text-blue-600' : 'text-green-600'}`} size={20} />
                      ) : (
                        <X className="mx-auto text-red-600" size={20} />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 border-b border-gray-200 font-medium text-gray-700">Bitbucket Integration</td>
                  {competitors.map((competitor, index) => (
                    <td 
                      key={index} 
                      className={`p-4 border-b border-gray-200 text-center ${
                        index === 0 ? 'bg-gradient-to-r from-blue-50 to-purple-50' : ''
                      }`}
                    >
                      {competitor.features.bitbucketIntegration ? (
                        <CheckCircle className={`mx-auto ${index === 0 ? 'text-blue-600' : 'text-green-600'}`} size={20} />
                      ) : (
                        <X className="mx-auto text-red-600" size={20} />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 border-b border-gray-200 font-medium text-gray-700">Setup Time</td>
                  {competitors.map((competitor, index) => (
                    <td 
                      key={index} 
                      className={`p-4 border-b border-gray-200 text-center ${
                        index === 0 ? 'bg-gradient-to-r from-blue-50 to-purple-50 font-bold text-blue-600' : 'font-medium text-gray-900'
                      }`}
                    >
                      {competitor.features.setupTime}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 border-b border-gray-200 font-medium text-gray-700">Pricing</td>
                  {competitors.map((competitor, index) => (
                    <td 
                      key={index} 
                      className={`p-4 border-b border-gray-200 text-center ${
                        index === 0 ? 'bg-gradient-to-r from-blue-50 to-purple-50 font-bold text-blue-600' : 'font-medium text-gray-900'
                      }`}
                    >
                      {competitor.features.price}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 border-b border-gray-200 font-medium text-gray-700">Team Collaboration</td>
                  {competitors.map((competitor, index) => (
                    <td 
                      key={index} 
                      className={`p-4 border-b border-gray-200 text-center ${
                        index === 0 ? 'bg-gradient-to-r from-blue-50 to-purple-50' : ''
                      }`}
                    >
                      {competitor.features.teamCollaboration ? (
                        <CheckCircle className={`mx-auto ${index === 0 ? 'text-blue-600' : 'text-green-600'}`} size={20} />
                      ) : (
                        <X className="mx-auto text-red-600" size={20} />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 border-b border-gray-200 font-medium text-gray-700">Custom Rules</td>
                  {competitors.map((competitor, index) => (
                    <td 
                      key={index} 
                      className={`p-4 border-b border-gray-200 text-center ${
                        index === 0 ? 'bg-gradient-to-r from-blue-50 to-purple-50' : ''
                      }`}
                    >
                      {competitor.features.customRules ? (
                        <CheckCircle className={`mx-auto ${index === 0 ? 'text-blue-600' : 'text-green-600'}`} size={20} />
                      ) : (
                        <X className="mx-auto text-red-600" size={20} />
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="reviews" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">developers worldwide</span>
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of developers who trust ReviewAI with their code
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white p-8 rounded-2xl border border-gray-200 hover:shadow-lg transition-all"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ 
                  scale: 1.02, 
                  y: -5, 
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
                }}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEEDBACK SECTION - ADDED BACK */}
      <section id="feedback">
        <FeedbackSection />
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold mb-4">
              Ready to revolutionize your code reviews?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of developers who trust ReviewAI with their code quality
            </p>
            
            <motion.button
              onClick={handleStartFreeReview}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-colors text-lg font-medium shadow-xl cursor-pointer"
              whileHover={{ 
                scale: 1.05, 
                y: -2, 
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
            >
              <Github size={20} />
              Start Your Free Code Review
              <ArrowRight size={20} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-6 md:mb-0">
              <div className="p-2 bg-white rounded-lg">
                <Wand2 size={20} className="text-gray-900" />
              </div>
              <div>
                <div className="font-bold">ReviewAI</div>
                <div className="text-sm text-gray-400">Automated Code Review</div>
              </div>
            </div>
            
            <div className="text-sm text-gray-400">
              © 2025 ReviewAI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;