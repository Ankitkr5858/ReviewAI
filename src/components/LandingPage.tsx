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
  ChevronRight
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [currentSlide, setCurrentSlide] = useState(0);

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
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: Shield,
      title: 'Security-First Approach',
      description: 'Identify security flaws, XSS vulnerabilities, and potential exploits before deployment',
      color: 'from-red-500 to-pink-600'
    },
    {
      icon: Clock,
      title: 'Real-time GitHub Integration',
      description: 'Seamless integration with GitHub. Review pull requests and main branch automatically',
      color: 'from-orange-500 to-yellow-600'
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

  // Dashboard slides with PROPERLY CENTERED content
  const dashboardSlides = [
    {
      title: 'Main Dashboard',
      content: (
        <div className="w-full h-full flex items-center justify-center p-8">
          <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <Wand2 size={24} />
                  <div>
                    <h3 className="font-bold">ReviewAI Dashboard</h3>
                    <p className="text-sm opacity-90">Automated Code Review</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Team</span>
                  <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="p-6">
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 mb-1">25</div>
                  <div className="text-sm text-gray-600">Reviews Completed</div>
                  <div className="text-xs text-blue-600 mt-1">+12%</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 mb-1">114</div>
                  <div className="text-sm text-gray-600">Active Repositories</div>
                  <div className="text-xs text-blue-600 mt-1">+12%</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 mb-1">11</div>
                  <div className="text-sm text-gray-600">Issues Resolved</div>
                  <div className="text-xs text-blue-600 mt-1">+12%</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 mb-1">22h</div>
                  <div className="text-sm text-gray-600">Time Saved</div>
                  <div className="text-xs text-blue-600 mt-1">+12%</div>
                </div>
              </div>

              {/* Active Reviews and Recent Activity */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Active Reviews</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Bitespeed</span>
                      </div>
                      <span className="text-sm text-green-600">completed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="font-medium">vue-Task</span>
                      </div>
                      <span className="text-sm text-blue-600">in-progress</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="font-medium">web3</span>
                      </div>
                      <span className="text-sm text-orange-600">review-required</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Recent Activity</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2">
                      <CheckCircle size={16} className="text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Code review completed</p>
                        <p className="text-xs text-gray-500">Bitespeed • 2h ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2">
                      <Zap size={16} className="text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">AI fixed 5 issues</p>
                        <p className="text-xs text-gray-500">vue-Task • 4h ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2">
                      <GitBranch size={16} className="text-gray-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">New repository added</p>
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
        <div className="w-full h-full flex items-center justify-center p-8">
          <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h3 className="font-bold text-lg">Repository Management</h3>
                  <p className="text-sm opacity-90">Manage your connected repositories (114 total)</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="bg-white/20 px-3 py-1 rounded-full text-sm">+ Sync Repositories</button>
                </div>
              </div>
            </div>

            {/* Repository Grid */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <GitBranch size={16} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold">ReviewAI</h4>
                      <p className="text-sm text-gray-600">No description available</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs">Active</span>
                    <span className="text-xs text-gray-500">JavaScript</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div>
                      <div className="font-semibold">0</div>
                      <div className="text-gray-500">Open Issues</div>
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

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <GitBranch size={16} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Bitespeed</h4>
                      <p className="text-sm text-gray-600">No description available</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-green-50 text-green-600 rounded-full text-xs">Completed</span>
                    <span className="text-xs text-gray-500">JavaScript</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div>
                      <div className="font-semibold">1</div>
                      <div className="text-gray-500">Open Issues</div>
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

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <GitBranch size={16} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold">vue-Task</h4>
                      <p className="text-sm text-gray-600">No description available</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-orange-50 text-orange-600 rounded-full text-xs">Review Required</span>
                    <span className="text-xs text-gray-500">Vue</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div>
                      <div className="font-semibold">3</div>
                      <div className="text-gray-500">Open Issues</div>
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
                      <div className="font-semibold text-xs">14h ago</div>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <GitBranch size={16} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold">ankity-exercise</h4>
                      <p className="text-sm text-gray-600">No description available</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-orange-50 text-orange-600 rounded-full text-xs">Review Required</span>
                    <span className="text-xs text-gray-500">JavaScript</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div>
                      <div className="font-semibold">83</div>
                      <div className="text-gray-500">Open Issues</div>
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
                      <div className="font-semibold text-xs">15h ago</div>
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
        <div className="w-full h-full flex items-center justify-center p-8">
          <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h3 className="font-bold text-lg">AI Code Review</h3>
                  <p className="text-sm opacity-90">Security Issue Found</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">High Priority</span>
                </div>
              </div>
            </div>

            {/* Code Review Content */}
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-sm">⚠</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 mb-2">Security Issue Found</h4>
                    <p className="text-red-800 text-sm mb-3">Potential XSS vulnerability detected in user input handling</p>
                    
                    {/* Code Diff */}
                    <div className="bg-white rounded border overflow-hidden">
                      <div className="bg-red-100 px-3 py-2 border-b text-sm font-medium text-red-800">
                        Current Code (Vulnerable)
                      </div>
                      <div className="p-3 font-mono text-sm">
                        <div className="text-red-600">- innerHTML = userInput;</div>
                      </div>
                      
                      <div className="bg-green-100 px-3 py-2 border-b text-sm font-medium text-green-800">
                        Suggested Fix
                      </div>
                      <div className="p-3 font-mono text-sm">
                        <div className="text-green-600">+ textContent = sanitize(userInput);</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-yellow-600 text-sm">⚡</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-yellow-900 mb-1">Performance Warning</h4>
                    <p className="text-yellow-800 text-sm">Consider using async/await for better performance</p>
                  </div>
                  <ChevronRight size={16} className="text-yellow-600 mt-1" />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle size={14} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-1">Code Quality Suggestion</h4>
                    <p className="text-blue-800 text-sm">Consider extracting this function for better reusability</p>
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
        <div className="w-full h-full flex items-center justify-center p-8">
          <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h3 className="font-bold text-lg">Team Analytics</h3>
                  <p className="text-sm opacity-90">Performance metrics and insights</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Last 30 days</span>
                </div>
              </div>
            </div>

            {/* Analytics Content */}
            <div className="p-6">
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="text-3xl font-bold text-green-600 mb-2">98.5%</div>
                  <div className="text-sm text-green-700 font-medium">Code Quality Score</div>
                  <div className="text-xs text-green-600 mt-1">↗ +2.3% from last month</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600 mb-2">156</div>
                  <div className="text-sm text-blue-700 font-medium">Issues Prevented</div>
                  <div className="text-xs text-blue-600 mt-1">↗ +18% from last month</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600 mb-2">47h</div>
                  <div className="text-sm text-purple-700 font-medium">Time Saved</div>
                  <div className="text-xs text-purple-600 mt-1">↗ +12% from last month</div>
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-gray-900 mb-4">Review Trends</h4>
                <div className="h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-end justify-between p-4">
                  <div className="w-8 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t" style={{ height: '60%' }}></div>
                  <div className="w-8 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t" style={{ height: '80%' }}></div>
                  <div className="w-8 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t" style={{ height: '70%' }}></div>
                  <div className="w-8 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t" style={{ height: '90%' }}></div>
                  <div className="w-8 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t" style={{ height: '100%' }}></div>
                  <div className="w-8 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t" style={{ height: '85%' }}></div>
                  <div className="w-8 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t" style={{ height: '95%' }}></div>
                </div>
              </div>

              {/* Team Performance */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Top Contributors</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">S</div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Sarah Chen</p>
                        <p className="text-xs text-gray-500">23 reviews completed</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">98.2%</p>
                        <p className="text-xs text-gray-500">Quality</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold">M</div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Marcus Rodriguez</p>
                        <p className="text-xs text-gray-500">19 reviews completed</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">97.8%</p>
                        <p className="text-xs text-gray-500">Quality</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Issue Categories</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Security</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                        <span className="text-sm font-medium">12</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Performance</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                        <span className="text-sm font-medium">8</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Code Quality</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                        <span className="text-sm font-medium">6</span>
                      </div>
                    </div>
                  </div>
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

  // COMPREHENSIVE FEATURE COMPARISON TABLE - LIKE LOOM
  const featureCategories = [
    {
      name: 'Code Review & Analysis',
      features: [
        { name: 'Repositories', free: 'Up to 3', pro: 'Unlimited', team: 'Unlimited' },
        { name: 'Code quality checks', free: true, pro: true, team: true },
        { name: 'Security vulnerability detection', free: 'Basic', pro: 'Advanced', team: 'Advanced' },
        { name: 'Performance analysis', free: false, pro: true, team: true },
        { name: 'Custom review rules', free: false, pro: true, team: true },
        { name: 'AI-powered suggestions', free: 'Basic', pro: 'Advanced', team: 'Advanced' }
      ]
    },
    {
      name: 'Automation & Integration',
      features: [
        { name: 'GitHub integration', free: true, pro: true, team: true },
        { name: 'Auto-fix & merge', free: false, pro: true, team: true },
        { name: 'Daily main branch checks', free: true, pro: true, team: true },
        { name: 'Pull request automation', free: false, pro: true, team: true },
        { name: 'Slack/Teams integration', free: false, pro: true, team: true },
        { name: 'Custom webhooks', free: false, pro: false, team: true }
      ]
    },
    {
      name: 'Team & Collaboration',
      features: [
        { name: 'Team members', free: '1', pro: 'Up to 5', team: 'Unlimited' },
        { name: 'Role-based permissions', free: false, pro: false, team: true },
        { name: 'Team analytics', free: false, pro: 'Basic', team: 'Advanced' },
        { name: 'Shared review templates', free: false, pro: false, team: true },
        { name: 'SSO integration', free: false, pro: false, team: true }
      ]
    },
    {
      name: 'Support & Analytics',
      features: [
        { name: 'Support', free: 'Community', pro: 'Priority', team: 'Dedicated' },
        { name: 'Analytics dashboard', free: false, pro: true, team: true },
        { name: 'Custom reports', free: false, pro: false, team: true },
        { name: 'API access', free: false, pro: 'Limited', team: 'Full' },
        { name: 'SLA guarantee', free: false, pro: false, team: '99.9%' }
      ]
    }
  ];

  const renderFeatureValue = (value: any) => {
    if (typeof value === 'boolean') {
      return (
        <div className="flex justify-center">
          {value ? (
            <CheckCircle size={16} className="text-green-600" />
          ) : (
            <X size={16} className="text-gray-300" />
          )}
        </div>
      );
    }
    return (
      <div className="flex justify-center">
        <span className="text-sm text-gray-700">{value}</span>
      </div>
    );
  };

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

            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Reviews</a>
              <motion.button
                onClick={onGetStarted}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-xl"
                whileHover={{ 
                  scale: 1.05, 
                  y: -1, 
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                Get Started
                <ArrowRight size={16} />
              </motion.button>
            </nav>
          </div>
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
              
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Code Reviews
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Reimagined
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                AI-powered code reviews that catch bugs, security issues, and performance problems 
                before they reach production. Get instant feedback and automated fixes for JavaScript, TypeScript, Python, and more.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <motion.button
                onClick={onGetStarted}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all text-lg font-medium shadow-xl"
                whileHover={{ 
                  scale: 1.05, 
                  y: -2, 
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                <Github size={20} />
                Start Free Review
                <ArrowRight size={20} />
              </motion.button>
              
              <motion.button
                className="flex items-center justify-center gap-2 px-8 py-4 border border-gray-300 rounded-full hover:bg-gray-50 transition-all text-lg font-medium"
                whileHover={{ 
                  scale: 1.05, 
                  y: -2, 
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                <Play size={20} />
                Watch Demo
              </motion.button>
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

      {/* MODERN ANIMATED DASHBOARD SLIDESHOW - FIXED CENTERING */}
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

          {/* SLIDESHOW CONTAINER - FIXED POSITIONING */}
          <div className="relative max-w-6xl mx-auto">
            <div className="relative h-96 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-gray-200 overflow-hidden">
              {/* SLIDES - PROPERLY CENTERED */}
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

              {/* NAVIGATION ARROWS - PERFECTLY CENTERED */}
              <motion.button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all z-10"
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
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all z-10"
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
                    className={`w-3 h-3 rounded-full transition-all ${
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

      {/* Pricing Section - MOVED UP */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">transparent pricing</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Start free, scale as you grow
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
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
                Save 34%
              </span>
            )}
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <motion.div
              className="p-8 border-2 border-gray-200 rounded-2xl bg-white hover:border-gray-300 transition-all"
              whileHover={{ 
                scale: 1.02, 
                y: -5, 
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <div className="text-4xl font-bold text-gray-900 mb-4">$0</div>
              <p className="text-gray-600 mb-6">Perfect for personal projects</p>
              
              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-gray-700">Up to 3 repositories</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-gray-700">Basic AI reviews</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-gray-700">Community support</span>
                </li>
              </ul>
              
              <motion.button
                onClick={onGetStarted}
                className="w-full py-3 border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-medium text-gray-900"
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                Get Started Free
              </motion.button>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              className="p-8 border-2 border-indigo-500 rounded-2xl bg-white relative shadow-lg"
              whileHover={{ 
                scale: 1.02, 
                y: -5, 
                boxShadow: "0 25px 30px -5px rgba(0, 0, 0, 0.15), 0 15px 15px -5px rgba(0, 0, 0, 0.08)" 
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                  Most Popular
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <div className="text-4xl font-bold text-gray-900">
                  ${billingCycle === 'annual' ? '19' : '29'}
                </div>
                {billingCycle === 'annual' && (
                  <div className="text-lg line-through text-gray-400">$29</div>
                )}
                <span className="text-gray-600 whitespace-nowrap">per month</span>
              </div>
              <p className="text-gray-600 mb-2">For professional developers</p>
              {billingCycle === 'annual' && (
                <p className="text-sm text-green-600 mb-4 font-medium">Save $120/year</p>
              )}
              
              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-gray-700">Unlimited repositories</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-gray-700">Advanced AI reviews</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-gray-700">Auto-fix & merge</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-gray-700">Priority support</span>
                </li>
              </ul>
              
              <motion.button
                onClick={onGetStarted}
                className="w-full py-3 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-colors font-medium"
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 15px 20px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -5px rgba(0, 0, 0, 0.08)" 
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                Start Pro Trial
              </motion.button>
            </motion.div>

            {/* Team Plan */}
            <motion.div
              className="p-8 border-2 border-gray-200 rounded-2xl bg-white hover:border-gray-300 transition-all"
              whileHover={{ 
                scale: 1.02, 
                y: -5, 
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Team</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <div className="text-4xl font-bold text-gray-900">
                  ${billingCycle === 'annual' ? '39' : '99'}
                </div>
                {billingCycle === 'annual' && (
                  <div className="text-lg line-through text-gray-400">$99</div>
                )}
                <span className="text-gray-600 whitespace-nowrap">per month</span>
              </div>
              <p className="text-gray-600 mb-2">For development teams</p>
              {billingCycle === 'annual' && (
                <p className="text-sm text-green-600 mb-4 font-medium">Save $240/year</p>
              )}
              
              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-gray-700">Everything in Pro</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-gray-700">Team collaboration</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-gray-700">Advanced analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-gray-700">Dedicated support</span>
                </li>
              </ul>
              
              <motion.button
                onClick={onGetStarted}
                className="w-full py-3 border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-medium text-gray-900"
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                Upgrade Now
              </motion.button>
            </motion.div>
          </div>

          {/* Footer note */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 mb-2">
              All plans include 30-day money-back guarantee
            </p>
            <p className="text-xs text-gray-500">
              Questions? Contact us at <span className="font-medium">support@reviewai.com</span>
            </p>
          </div>
        </div>
      </section>

      {/* COMPREHENSIVE FEATURE COMPARISON TABLE - BELOW PRICING */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Compare plans and <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">features</span>
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your development workflow
            </p>
          </div>

          {/* Plan Headers */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
            <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
              <div className="font-semibold text-gray-900">Features</div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">Free</div>
                <div className="text-sm text-gray-600">$0/month</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900 flex items-center justify-center gap-2">
                  Pro
                  <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full whitespace-nowrap">Popular</span>
                </div>
                <div className="text-sm text-gray-600">$19/month</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">Team</div>
                <div className="text-sm text-gray-600">$39/month</div>
              </div>
            </div>

            {/* Feature Categories */}
            {featureCategories.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <div className="px-6 py-4 bg-gray-100 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                </div>
                {category.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="grid grid-cols-4 gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="font-medium text-gray-700">{feature.name}</div>
                    <div className="text-center">{renderFeatureValue(feature.free)}</div>
                    <div className="text-center">{renderFeatureValue(feature.pro)}</div>
                    <div className="text-center">{renderFeatureValue(feature.team)}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
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
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-colors text-lg font-medium shadow-xl"
              whileHover={{ 
                scale: 1.05, 
                y: -2, 
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
            >
              <Github size={20} />
              Start Your Free Review
              <ArrowRight size={20} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
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