import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wand2, Settings, GitCommit, CheckCircle, Code, ArrowRight, AlertTriangle, Info, Send, User, MessageCircle } from 'lucide-react';
import CodeDiffViewer from './CodeDiffViewer';
import ConfirmationModal from './ConfirmationModal';

interface CodeIssue {
  type: 'error' | 'warning' | 'info';
  severity: 'high' | 'medium' | 'low';
  file: string;
  line: number;
  column?: number;
  message: string;
  rule?: string;
  suggestion?: string;
  fixable?: boolean;
  originalCode?: string;
  suggestedCode?: string;
  id?: string;
  hash?: string;
  category?: 'prettier' | 'eslint' | 'security' | 'performance' | 'best-practice';
}

interface IssueDetailModalProps {
  issue: CodeIssue;
  onClose: () => void;
  onAIFix: (issue: CodeIssue) => Promise<void>;
  onManualFix: (issue: CodeIssue) => void;
  repositoryUrl: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  issue,
  onClose,
  onAIFix,
  onManualFix,
  repositoryUrl
}) => {
  const [fixing, setFixing] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: `I understand you're asking about this high eslint issue. The problem is "Missing semicolon". Would you like me to explain more about why this matters or how to fix it?`,
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  const handleAIFixClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmAIFix = async () => {
    setShowConfirmation(false);
    setFixing(true);
    try {
      await onAIFix(issue);
      setFixed(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Fix failed:', error);
    } finally {
      setFixing(false);
    }
  };

  const generateIntelligentResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    const { file, line, message, severity, category, rule, suggestion, originalCode, suggestedCode } = issue;

    // Specific responses based on issue type and user question
    if (lowerMessage.includes('why') && (lowerMessage.includes('important') || lowerMessage.includes('matter'))) {
      if (category === 'security') {
        return `This ${severity} security issue is critical because it could expose your application to attacks. Specifically, "${message}" can lead to vulnerabilities like XSS, injection attacks, or data breaches. Security issues should always be fixed immediately to protect your users and data.`;
      } else if (category === 'performance') {
        return `This performance issue matters because it can slow down your application and create a poor user experience. "${message}" can cause your app to use more memory, CPU, or network resources than necessary. Fixing it will make your app faster and more responsive.`;
      } else if (rule?.includes('semi')) {
        return `Missing semicolons matter because JavaScript's Automatic Semicolon Insertion (ASI) can cause unexpected behavior. When code is minified or certain patterns are used, missing semicolons can break your application or cause subtle bugs that are hard to debug.`;
      } else if (category === 'eslint') {
        return `This ESLint rule helps maintain code quality and consistency. "${message}" ensures your code follows best practices, making it more readable, maintainable, and less prone to bugs. Following these rules helps your team write better code together.`;
      } else {
        return `This ${severity} issue is important because it affects code quality and maintainability. "${message}" can lead to bugs, make your code harder to understand, or cause problems in production. Fixing it will improve your codebase overall.`;
      }
    }

    if (lowerMessage.includes('how') && (lowerMessage.includes('fix') || lowerMessage.includes('solve'))) {
      if (originalCode && suggestedCode) {
        return `To fix this issue, I need to change:\n\n**Current code:** \`${originalCode.trim()}\`\n**Fixed code:** \`${suggestedCode.trim()}\`\n\n${suggestion || 'This change follows coding best practices.'} I can apply this fix automatically by creating a commit to your repository. Would you like me to do that?`;
      } else if (suggestion) {
        return `Here's how to fix this issue: ${suggestion}. The specific problem is "${message}" in ${file} at line ${line}. ${rule ? `This follows the ${rule} rule.` : ''} I can help you apply this fix automatically if you'd like.`;
      } else {
        return `To fix "${message}", you'll need to modify the code at ${file}:${line}. This is a ${severity} ${category || 'code quality'} issue that should be addressed to improve your codebase. I can apply an automatic fix if you click the "Apply AI Fix" button below.`;
      }
    }

    if (lowerMessage.includes('break') && lowerMessage.includes('code')) {
      return `No, this fix won't break your existing code! The suggested change is safe and follows best practices. ${originalCode && suggestedCode ? `I'm only changing "${originalCode.trim()}" to "${suggestedCode.trim()}"` : 'The fix addresses the specific issue without affecting other functionality'}. This type of ${category || 'code quality'} fix is designed to improve your code while maintaining its behavior.`;
    }

    if (lowerMessage.includes('explain') || lowerMessage.includes('what') || lowerMessage.includes('understand')) {
      let explanation = `Let me explain this issue in detail:\n\n`;
      explanation += `**File:** ${file} (line ${line})\n`;
      explanation += `**Issue:** ${message}\n`;
      explanation += `**Severity:** ${severity} - ${severity === 'high' ? 'needs immediate attention' : severity === 'medium' ? 'should be fixed soon' : 'can be addressed when convenient'}\n`;
      if (category) explanation += `**Category:** ${category}\n`;
      if (rule) explanation += `**Rule:** ${rule}\n`;
      if (suggestion) explanation += `**Solution:** ${suggestion}\n`;
      
      if (category === 'prettier') {
        explanation += `\nThis is a code formatting issue. Prettier helps maintain consistent code style across your project, making it easier for teams to collaborate and reducing merge conflicts.`;
      } else if (category === 'eslint') {
        explanation += `\nThis is an ESLint rule violation. ESLint helps catch potential bugs and enforces coding standards to improve code quality.`;
      } else if (category === 'security') {
        explanation += `\nThis is a security vulnerability that could be exploited by attackers. It's crucial to fix security issues to protect your application and users.`;
      }
      
      return explanation;
    }

    if (lowerMessage.includes('automatic') || lowerMessage.includes('apply') || lowerMessage.includes('commit')) {
      return `Yes! I can automatically apply this fix for you. When you click "Apply AI Fix & Commit", I will:\n\n1. ✅ Apply the fix to ${file} at line ${line}\n2. 🔄 Create a new commit with a descriptive message\n3. 📝 Update the issue status to resolved\n4. 🎯 Apply coding standards and best practices\n\nThe fix is safe and won't break your existing functionality. Would you like me to proceed?`;
    }

    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return `You're very welcome! I'm here to help make your code better and more secure. Feel free to ask me anything else about this issue or any other code quality questions. Happy coding! 🚀`;
    }

    // Default intelligent response
    return `I understand you're asking about this ${severity} ${category || 'code'} issue. The problem "${message}" in ${file} at line ${line} ${suggestion ? `can be fixed by: ${suggestion}` : 'needs attention'}. ${rule ? `This relates to the ${rule} rule.` : ''} Would you like me to explain why this matters, how to fix it, or apply the fix automatically?`;
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: newMessage,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    const currentMessage = newMessage;
    setNewMessage('');
    setIsTyping(true);

    // Simulate typing delay and generate intelligent response
    setTimeout(() => {
      const botResponse = generateIntelligentResponse(currentMessage);
      
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botResponse,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  // Scroll to bottom of chat when new messages arrive
  React.useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping]);

  const getCodeExplanation = (issue: CodeIssue) => {
    if (!issue.originalCode || !issue.suggestedCode) {
      return {
        whatItDoes: "This fix will resolve the identified issue according to best practices.",
        whyBetter: "The suggested change follows coding standards and prevents potential problems.",
        impact: "Improves code quality and maintainability."
      };
    }

    const original = issue.originalCode.trim();
    const suggested = issue.suggestedCode.trim();
    const rule = issue.rule?.toLowerCase() || '';
    const message = issue.message.toLowerCase();

    if (rule.includes('semi') || message.includes('semicolon')) {
      return {
        whatItDoes: `Adds a semicolon (;) at the end of the statement`,
        whyBetter: "Explicitly terminates the statement instead of relying on JavaScript's automatic semicolon insertion (ASI). This prevents bugs when code is minified or when certain patterns are used.",
        impact: "🛡️ Prevents unexpected statement combinations, 🔧 Makes code more predictable, 📦 Safer when code is minified"
      };
    }

    if (rule.includes('console') || message.includes('console.log')) {
      return {
        whatItDoes: `Removes or comments out the console.log statement`,
        whyBetter: "Eliminates debugging code that shouldn't be in production. Console logs can expose sensitive data and clutter the browser console for end users.",
        impact: "🔒 Prevents data exposure, 🚀 Cleaner production code, 👥 Better user experience"
      };
    }

    if (rule.includes('eqeqeq') || message.includes('strict equality') || message.includes('===')) {
      return {
        whatItDoes: `Changes loose equality (==) to strict equality (===)`,
        whyBetter: "Strict equality (===) compares both value AND type without automatic type conversion. This prevents unexpected results like '0' == 0 being true.",
        impact: "🎯 More predictable comparisons, 🐛 Prevents type coercion bugs, 📚 Follows JavaScript best practices"
      };
    }

    if (rule.includes('error') || message.includes('error handling') || message.includes('try-catch')) {
      return {
        whatItDoes: `Wraps the async operation in a try-catch block`,
        whyBetter: "Catches any errors that might occur during the async operation (network failures, server errors, etc.) instead of letting them crash the application.",
        impact: "💥 Prevents app crashes, 👥 Better user experience with error messages, 🔧 Easier debugging"
      };
    }

    if (rule.includes('unused') || message.includes('unused')) {
      return {
        whatItDoes: `Prefixes the variable name with underscore`,
        whyBetter: "The underscore prefix is a convention that tells other developers (and linters) that this variable is intentionally unused. This removes the warning while keeping the variable for future use.",
        impact: "🧹 Cleaner code without warnings, 📝 Documents intentional non-use, 🤝 Better team communication"
      };
    }

    if (rule.includes('innerHTML') || message.includes('xss')) {
      return {
        whatItDoes: `Changes innerHTML to textContent`,
        whyBetter: "textContent safely sets text without interpreting HTML, preventing XSS attacks. innerHTML can execute malicious scripts if user input contains HTML/JavaScript.",
        impact: "🛡️ Prevents XSS attacks, 🔒 Safer handling of user input, 👤 Protects user data"
      };
    }

    return {
      whatItDoes: `Changes "${original}" to "${suggested}"`,
      whyBetter: "This change follows coding best practices and resolves the identified issue.",
      impact: "📈 Improves code quality and follows industry standards"
    };
  };

  const codeExplanation = getCodeExplanation(issue);

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Code Issue Details</h2>
                <p className="text-white/80">{issue.file} - Line {issue.line}</p>
              </div>
              <motion.button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={24} className="text-white" />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {fixed ? (
              <motion.div
                className="text-center py-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-900 mb-2">Issue Fixed!</h3>
                <p className="text-green-700">The fix has been committed to your repository.</p>
              </motion.div>
            ) : (
              <>
                {/* Issue details with file and line number */}
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-red-600 mt-1" size={20} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-red-800">{issue.file}:<span className="text-red-600">{issue.line}</span></span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          issue.severity === 'high' ? 'bg-red-100 text-red-700' :
                          issue.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {issue.severity}
                        </span>
                        {issue.rule && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            {issue.rule}
                          </span>
                        )}
                      </div>
                      <p className="text-red-700 font-medium mt-1">{issue.message}</p>
                      {issue.suggestion && (
                        <div className="mt-2 bg-white bg-opacity-50 rounded p-2">
                          <p className="text-xs font-medium text-gray-700">💡 Suggestion:</p>
                          <p className="text-sm text-gray-800">{issue.suggestion}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <CodeDiffViewer issue={issue} onApplyFix={null} />

                {/* Code explanation section */}
                {issue.originalCode && issue.suggestedCode && (
                  <motion.div
                    className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Code size={20} className="text-blue-600" />
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">What This AI Fix Will Do</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <ArrowRight size={18} className="text-blue-600 mt-1 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-blue-900">🔧 What the fix does: </span>
                          <span className="text-blue-800">{codeExplanation.whatItDoes}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <CheckCircle size={18} className="text-green-600 mt-1 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-green-900">✅ Why this is better: </span>
                          <span className="text-green-800">{codeExplanation.whyBetter}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <AlertTriangle size={18} className="text-orange-600 mt-1 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-orange-900">🎯 How this improves your code: </span>
                          <span className="text-orange-800">{codeExplanation.impact}</span>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 border border-blue-200 mt-2">
                        <h4 className="font-medium text-gray-900 mb-3 text-sm">📝 Before vs After:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs font-medium text-red-700 mb-1 flex items-center gap-1">
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              Your Current Code
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 font-mono text-xs">
                              <code className="text-red-800">{issue.originalCode}</code>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              AI Suggested Fix
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 font-mono text-xs">
                              <code className="text-green-800">{issue.suggestedCode}</code>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-300">
                      <p className="text-blue-900 text-sm">
                        <strong>💡 Pro Tip:</strong> Understanding these specific changes helps you write better code from the start!
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Chat with ReviewAI */}
                <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                        <Wand2 size={16} className="text-white" />
                      </div>
                      <h3 className="font-medium text-gray-900">Chat with ReviewAI</h3>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Online</span>
                    </div>
                    <button
                      onClick={() => setShowChat(!showChat)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {showChat ? 'Hide Chat' : 'Show Chat'}
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {showChat && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="h-80 overflow-y-auto p-4 bg-gray-50">
                          <div className="space-y-4">
                            {chatMessages.map((message) => (
                              <div 
                                key={message.id} 
                                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`max-w-[85%] rounded-lg p-3 ${
                                  message.sender === 'user' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-white border border-gray-200 shadow-sm'
                                }`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    {message.sender === 'user' ? (
                                      <User size={14} className="text-white" />
                                    ) : (
                                      <div className="p-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded">
                                        <Wand2 size={12} className="text-white" />
                                      </div>
                                    )}
                                    <span className={`text-xs font-medium ${
                                      message.sender === 'user' ? 'text-white/90' : 'text-gray-500'
                                    }`}>
                                      {message.sender === 'user' ? 'You' : 'ReviewAI'} • {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                  </div>
                                  <div className={`text-sm whitespace-pre-line ${message.sender === 'user' ? 'text-white' : 'text-gray-800'}`}>
                                    {message.text}
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {/* Typing indicator */}
                            {isTyping && (
                              <div className="flex justify-start">
                                <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-3 max-w-[85%]">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="p-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded">
                                      <Wand2 size={12} className="text-white" />
                                    </div>
                                    <span className="text-xs font-medium text-gray-500">ReviewAI is typing...</span>
                                  </div>
                                  <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div ref={chatEndRef} />
                          </div>
                        </div>
                        
                        <div className="p-3 border-t border-gray-200 bg-white">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                              placeholder="Ask ReviewAI about this issue..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <motion.button
                              onClick={handleSendMessage}
                              disabled={!newMessage.trim() || isTyping}
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50"
                              whileHover={{ scale: (!newMessage.trim() || isTyping) ? 1 : 1.05 }}
                              whileTap={{ scale: (!newMessage.trim() || isTyping) ? 1 : 0.95 }}
                            >
                              <Send size={18} />
                            </motion.button>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              onClick={() => setNewMessage("Why is this important?")}
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
                            >
                              Why is this important?
                            </button>
                            <button
                              onClick={() => setNewMessage("How do I fix this?")}
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
                            >
                              How do I fix this?
                            </button>
                            <button
                              onClick={() => setNewMessage("Will it break any existing code?")}
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
                            >
                              Will it break existing code?
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <motion.button
                    onClick={handleAIFixClick}
                    disabled={fixing}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50"
                    whileHover={{ scale: fixing ? 1 : 1.02 }}
                    whileTap={{ scale: fixing ? 1 : 0.98 }}
                  >
                    {fixing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Applying AI Fix...
                      </>
                    ) : (
                      <>
                        <Wand2 size={18} />
                        Apply AI Fix & Commit
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    onClick={() => onManualFix(issue)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Settings size={18} />
                    Fix Manually on GitHub
                  </motion.button>
                </div>

                {/* Additional Info */}
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-medium text-gray-900 mb-2">What happens when you apply AI fix:</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-center gap-2">
                      <GitCommit size={16} className="text-blue-600" />
                      Creates a new commit with the fix
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-600" />
                      Updates the issue status to resolved
                    </li>
                    <li className="flex items-center gap-2">
                      <Wand2 size={16} className="text-purple-600" />
                      Applies best practices and coding standards
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showConfirmation && (
          <ConfirmationModal
            isOpen={showConfirmation}
            onClose={() => setShowConfirmation(false)}
            onConfirm={handleConfirmAIFix}
            title="Apply AI Fix"
            message={`Are you sure you want to apply AI fix to this issue in ${issue.file}? This will create a commit in your repository and mark the issue as resolved.`}
            confirmText="Apply Fix"
            type="warning"
            loading={fixing}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default IssueDetailModal;