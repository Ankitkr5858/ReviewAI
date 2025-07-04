import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Send, X, User } from 'lucide-react';

interface InlineCommentProps {
  fileName: string;
  lineNumber: number;
  lineContent: string;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  userName?: string;
  userAvatar?: string;
}

const InlineComment: React.FC<InlineCommentProps> = ({
  fileName,
  lineNumber,
  lineContent,
  onClose
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name: string; avatar: string }>({ name: 'You', avatar: '' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get user info from GitHub
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
              name: userData.login || 'You',
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

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Initialize with AI greeting
  useEffect(() => {
    const initialMessage: ChatMessage = {
      id: '1',
      sender: 'bot',
      text: `I'm here to help with your code review. You're looking at ${fileName} line ${lineNumber}. What would you like to know about this code?`,
      timestamp: new Date()
    };
    setMessages([initialMessage]);
  }, [fileName, lineNumber]);

  const generateIntelligentResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Context-aware responses based on the specific line being commented on
    if (fileName && lineNumber && lineContent) {
      // Responses for import statements
      if (lineContent.includes('import ') && lineContent.includes('from ')) {
        if (lowerMessage.includes('what') || lowerMessage.includes('explain')) {
          return `This line is importing components or functions from a package. In this case, you're importing from "${lineContent.match(/from ['"]([^'"]+)['"]/)?.[1] || 'a package'}". These imports will be available to use in this file.`;
        }
        
        if (lowerMessage.includes('why') || lowerMessage.includes('purpose')) {
          return `These imports are necessary to use external components or functions in your file. Each imported item (${lineContent.match(/import\s+{([^}]+)}/)?.[1] || 'component'}) provides specific functionality that's being used in this component.`;
        }
      }
      
      // Responses for JSX/component code
      if (lineContent.includes('<') && lineContent.includes('>')) {
        if (lowerMessage.includes('what') || lowerMessage.includes('explain')) {
          return `This line contains JSX code which is rendering a UI component. It appears to be ${lineContent.includes('className') ? 'applying CSS classes' : 'creating a component structure'} for your React application.`;
        }
        
        if (lowerMessage.includes('style') || lowerMessage.includes('css')) {
          const classes = lineContent.match(/className="([^"]+)"/)?.[1];
          if (classes) {
            return `This line applies the following Tailwind CSS classes: "${classes}". These classes control the styling and layout of this element.`;
          }
        }
      }
      
      // Responses for function declarations
      if (lineContent.includes('function') || lineContent.includes('=>')) {
        if (lowerMessage.includes('what') || lowerMessage.includes('explain')) {
          return `This line defines a ${lineContent.includes('=>') ? 'arrow function' : 'function'} in JavaScript/TypeScript. It ${lineContent.includes('async') ? 'performs asynchronous operations' : 'handles some logic'} in your component.`;
        }
      }

      // Responses for variable declarations
      if (lineContent.includes('const ') || lineContent.includes('let ') || lineContent.includes('var ')) {
        if (lowerMessage.includes('what') || lowerMessage.includes('explain')) {
          return `This line declares a variable. ${lineContent.includes('useState') ? 'It\'s using React\'s useState hook to manage component state.' : lineContent.includes('useEffect') ? 'It\'s using React\'s useEffect hook for side effects.' : 'This variable stores data that can be used throughout your component.'}`;
        }
      }
    }
    
    // Generic responses when we don't have specific context
    if (lowerMessage.includes('help') || lowerMessage.includes('how can you')) {
      return `I can help you understand the code, explain what different parts do, suggest improvements, or answer questions about best practices. What specific aspect would you like me to help with?`;
    }
    
    if (lowerMessage.includes('explain') || lowerMessage.includes('what does this')) {
      return `This code ${fileName ? `in ${fileName}` : ''} ${lineNumber ? `at line ${lineNumber}` : ''} appears to be ${
        lineContent?.includes('import') ? 'importing dependencies' :
        lineContent?.includes('function') ? 'defining a function' :
        lineContent?.includes('const') || lineContent?.includes('let') ? 'declaring variables' :
        lineContent?.includes('<') && lineContent?.includes('>') ? 'rendering JSX components' :
        lineContent?.includes('return') ? 'returning values' :
        'implementing logic'
      }. Would you like me to explain a specific aspect in more detail?`;
    }
    
    if (lowerMessage.includes('best practice') || lowerMessage.includes('improve')) {
      return `Based on what I can see, here are some best practices to consider:
      
1. Ensure your code follows the project's style guide
2. Add appropriate comments for complex logic
3. Consider breaking down complex components into smaller ones
4. Use proper error handling for any asynchronous operations
5. Make sure variable and function names are descriptive

Would you like more specific advice about this particular code?`;
    }

    if (lowerMessage.includes('better way') || lowerMessage.includes('alternative')) {
      return `There are often multiple ways to write the same functionality. For this specific line, I'd need to understand your requirements better. Are you looking for:

• Better performance?
• Improved readability?
• More maintainable code?
• Following specific coding standards?

Let me know what aspect you'd like to improve and I can suggest alternatives!`;
    }
    
    // Default response
    return `I'm here to help with your code review. ${
      fileName && lineNumber 
        ? `You're looking at ${fileName} line ${lineNumber}. ` 
        : ''
    }What would you like to know about this code?`;
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: newMessage,
      timestamp: new Date(),
      userName: userInfo.name,
      userAvatar: userInfo.avatar
    };
    
    setMessages(prev => [...prev, userMessage]);
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
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickQuestion = (question: string) => {
    setNewMessage(question);
    setTimeout(() => handleSendMessage(), 100);
  };

  return (
    <motion.div
      className="border-t border-gray-200 bg-gray-50"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
            <Wand2 size={16} className="text-white" />
          </div>
          <span className="font-medium text-gray-900">
            Chat with ReviewAI
          </span>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Online</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
        >
          <X size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Code context */}
      <div className="bg-gray-900 text-gray-200 p-3 font-mono text-sm overflow-x-auto border-b border-gray-200">
        <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
          <span>{fileName}:{lineNumber}</span>
        </div>
        <div className="flex">
          <span className="text-gray-500 mr-3">{lineNumber}</span>
          <code>{lineContent}</code>
        </div>
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto p-4 bg-gray-50">
        <div className="space-y-4">
          {messages.map((message) => (
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
                    <div className="flex items-center gap-1">
                      {message.userAvatar ? (
                        <img src={message.userAvatar} alt={message.userName} className="w-5 h-5 rounded-full" />
                      ) : (
                        <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                          <User size={12} className="text-white" />
                        </div>
                      )}
                      <span className="text-xs font-medium text-white/90">
                        {message.userName} • {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <div className="p-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded">
                        <Wand2 size={12} className="text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-500">
                        ReviewAI • {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  )}
                </div>
                <div className={`text-sm whitespace-pre-line ${message.sender === 'user' ? 'text-white' : 'text-gray-800'}`}>
                  {message.text}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
          
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
        </div>
      </div>
      
      {/* Input */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask ReviewAI about this code..."
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
            onClick={() => handleQuickQuestion("What does this code do?")}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
          >
            What does this code do?
          </button>
          <button
            onClick={() => handleQuickQuestion("Is there a better way?")}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
          >
            Is there a better way?
          </button>
          <button
            onClick={() => handleQuickQuestion("Explain this syntax")}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
          >
            Explain this syntax
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default InlineComment;