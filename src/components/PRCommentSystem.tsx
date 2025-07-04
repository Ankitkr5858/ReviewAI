import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Send, X, User, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

interface PRCommentSystemProps {
  isOpen: boolean;
  onClose: () => void;
  lineNumber?: number;
  fileName?: string;
  lineContent?: string;
  repositoryName?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

const PRCommentSystem: React.FC<PRCommentSystemProps> = ({
  isOpen,
  onClose,
  lineNumber,
  fileName,
  lineContent,
  repositoryName
}) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [minimized, setMinimized] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Get current GitHub user
  useEffect(() => {
    const fetchCurrentUser = async () => {
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
            setUserName(userData.login);
            setUserAvatar(userData.avatar_url);
          }
        } catch (error) {
          console.error('Failed to fetch current user:', error);
        }
      }
    };

    fetchCurrentUser();
  }, []);

  // Initialize with greeting message
  useEffect(() => {
    if (isOpen) {
      let initialMessage = "How may I help you today?";
      
      // If we have context about a specific line, provide a more contextual greeting
      if (fileName && lineNumber && lineContent) {
        initialMessage = `I see you're asking about line ${lineNumber} in ${fileName}. This is part of your pull request changes. How can I help you with this specific line?`;
      }
      
      setChatMessages([{
        id: '1',
        sender: 'bot',
        text: initialMessage,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, fileName, lineNumber, lineContent]);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping]);

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

  if (!isOpen) return null;

  return (
    <motion.div
      className={`fixed ${minimized ? 'bottom-4 right-4 w-auto' : 'bottom-0 right-0 w-96'} z-50 shadow-xl rounded-t-lg overflow-hidden`}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div 
        className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 flex items-center justify-between cursor-pointer"
        onClick={() => setMinimized(!minimized)}
      >
        <div className="flex items-center gap-2 text-white">
          <Wand2 size={16} />
          <span className="font-medium">
            {minimized 
              ? 'Chat with ReviewAI' 
              : fileName && lineNumber 
                ? `${fileName}:${lineNumber}` 
                : 'Chat with ReviewAI'
            }
          </span>
          {!minimized && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Online</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {minimized ? (
            <ChevronUp size={16} className="text-white" />
          ) : (
            <>
              <ChevronDown size={16} className="text-white" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="text-white hover:bg-white/20 rounded p-1 transition-colors"
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Chat Content */}
      {!minimized && (
        <>
          {/* Line context if available */}
          {fileName && lineNumber && lineContent && (
            <div className="bg-gray-900 text-gray-200 p-3 border-b border-gray-700 font-mono text-sm overflow-x-auto">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <span>{fileName}:{lineNumber}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500 mr-3">{lineNumber}</span>
                <code>{lineContent}</code>
              </div>
            </div>
          )}
          
          {/* Messages */}
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
                        <div className="flex items-center gap-1">
                          {userAvatar ? (
                            <img src={userAvatar} alt={userName} className="w-5 h-5 rounded-full" />
                          ) : (
                            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                              <User size={12} className="text-white" />
                            </div>
                          )}
                          <span className="text-xs font-medium text-white/90">
                            {userName || 'You'} • {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
                onClick={() => {
                  setNewMessage("What does this code do?");
                  handleSendMessage();
                }}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
              >
                What does this code do?
              </button>
              <button
                onClick={() => {
                  setNewMessage("Is there a better way to write this?");
                  handleSendMessage();
                }}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
              >
                Is there a better way?
              </button>
              <button
                onClick={() => {
                  setNewMessage("Explain this syntax");
                  handleSendMessage();
                }}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
              >
                Explain this syntax
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default PRCommentSystem;