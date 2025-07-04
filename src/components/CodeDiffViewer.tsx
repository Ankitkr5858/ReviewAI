import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, Copy, ExternalLink, MessageSquare } from 'lucide-react';
import PRCommentSystem from './PRCommentSystem';

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
  category?: 'prettier' | 'eslint' | 'security' | 'performance' | 'best-practice';
}

interface CodeDiffViewerProps {
  issue: CodeIssue;
  onApplyFix?: ((issue: CodeIssue) => Promise<void>) | null; 
}

const CodeDiffViewer: React.FC<CodeDiffViewerProps> = ({ issue, onApplyFix }) => {
  const [showCommentLeft, setShowCommentLeft] = React.useState(false);
  const [showCommentRight, setShowCommentRight] = React.useState(false);
  const [showCommentSingle, setShowCommentSingle] = React.useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return AlertTriangle;
      case 'warning':
        return AlertTriangle;
      default:
        return Info;
    }
  };

  const Icon = getIssueIcon(issue.type);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  
  const handleCommentClick = (side: 'left' | 'right' | 'single') => {
    if (side === 'left') {
      setShowCommentLeft(true);
      setShowCommentRight(false);
      setShowCommentSingle(false);
    } else if (side === 'right') {
      setShowCommentLeft(false);
      setShowCommentRight(true);
      setShowCommentSingle(false);
    } else {
      setShowCommentLeft(false);
      setShowCommentRight(false);
      setShowCommentSingle(true);
    }
  };

  // FIXED: Highlight changes in code with light background colors and better contrast
  const highlightChanges = (originalCode: string, suggestedCode: string) => {
    // Simple diff highlighting - mark changed parts
    const original = originalCode.trim();
    const suggested = suggestedCode.trim();
    
    if (original === suggested) return { original, suggested };
    
    // For prettier issues, highlight the specific changes
    if (issue.category === 'prettier') {
      // Highlight spacing changes
      if (issue.rule?.includes('operator-spacing')) {
        const highlighted = suggested.replace(/(\w+)\s+([=+\-*/])\s+(\w+)/g, 
          '$1<span class="bg-green-100 text-green-800 px-1 rounded"> $2 </span>$3'
        );
        return { 
          original: original.replace(/(\w+)([=+\-*/])(\w+)/g, '$1<span class="bg-red-100 px-1 rounded">$2</span>$3'),
          suggested: highlighted 
        };
      }
      
      // Highlight quote changes
      if (issue.rule?.includes('quotes')) {
        const highlighted = suggested.replace(/'/g, '<span class="bg-green-100 text-green-800 px-1 rounded">\'</span>');
        return { 
          original: original.replace(/"/g, '<span class="bg-red-100 px-1 rounded">"</span>'),
          suggested: highlighted 
        };
      }
      
      // Highlight trailing comma
      if (issue.rule?.includes('trailing-comma')) {
        const highlighted = suggested.replace(/,(\s*)$/, '<span class="bg-green-100 text-green-800 px-1 rounded">,</span>$1');
        return { original, suggested: highlighted };
      }
    }
    
    // For other changes, highlight the entire difference
    return { 
      original: `<span class="bg-red-100 px-1 rounded">${original}</span>`,
      suggested: `<span class="bg-green-100 text-green-800 px-1 rounded">${suggested}</span>`
    };
  };

  return (
    <motion.div
      className="border border-gray-200 rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Issue Header */}
      <div className={`p-4 border-b ${getSeverityColor(issue.severity)}`}>
        <div className="flex items-start gap-3">
          <Icon size={20} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">{issue.file}:{issue.line}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                {issue.severity}
              </span>
              {issue.rule && (
                <span className="text-xs text-gray-500">({issue.rule})</span>
              )}
              {issue.category && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  issue.category === 'prettier' ? 'bg-pink-100 text-pink-700' :
                  issue.category === 'eslint' ? 'bg-blue-100 text-blue-700' :
                  issue.category === 'security' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {issue.category}
                </span>
              )}
            </div>
            <p className="text-sm mb-2">{issue.message}</p>
            {issue.suggestion && (
              <div className="bg-white bg-opacity-50 rounded p-2">
                <p className="text-xs font-medium mb-1">💡 Suggestion:</p>
                <p className="text-xs">{issue.suggestion}</p>
              </div>
            )}
          </div>
          <a
            href={`https://github.com/search?q=${encodeURIComponent(issue.rule || issue.message)}&type=code`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 hover:bg-white hover:bg-opacity-50 rounded transition-colors"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {/* Code Diff with IMPROVED HIGHLIGHTING */}
      {issue.originalCode && issue.suggestedCode && (
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Original Code (Left Side) */}
          <div className="border-r border-gray-200">
            <div className="bg-red-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-medium text-red-700">Current Code</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCommentClick('left')}
                  className="p-1 hover:bg-red-100 rounded transition-colors"
                  title="Comment on this code"
                >
                  <MessageSquare size={14} className="text-red-700" />
                </button>
                <button
                  onClick={() => copyToClipboard(issue.originalCode!)}
                  className="p-1 hover:bg-red-100 rounded transition-colors"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
            <div className="p-0 font-mono text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap">
                <div className="relative group">
                  <code 
                    className="text-red-800 flex flex-col"
                    dangerouslySetInnerHTML={{ 
                      __html: highlightChanges(issue.originalCode, issue.suggestedCode).original 
                    }}
                  />
                </div>
              </pre>
            </div>
            
            {/* Inline Comment System for Left Side */}
            {showCommentLeft && (
              <PRCommentSystem
                isOpen={true}
                onClose={() => setShowCommentLeft(false)}
                fileName={issue.file}
                lineNumber={issue.line}
                lineContent={issue.originalCode!}
              />
            )}
          </div>

          {/* Suggested Code (Right Side) */}
          <div>
            <div className="bg-green-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-medium text-green-700">Suggested Fix</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCommentClick('right')}
                  className="p-1 hover:bg-green-100 rounded transition-colors"
                  title="Comment on this code"
                >
                  <MessageSquare size={14} className="text-green-700" />
                </button>
                <button
                  onClick={() => copyToClipboard(issue.suggestedCode!)}
                  className="p-1 hover:bg-green-100 rounded transition-colors"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
            <div className="p-0 font-mono text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap">
                <div className="relative group">
                  <code 
                    className="text-green-800 flex flex-col"
                    dangerouslySetInnerHTML={{ 
                      __html: highlightChanges(issue.originalCode, issue.suggestedCode).suggested 
                    }}
                  />
                </div>
              </pre>
            </div>
            
            {/* Inline Comment System for Right Side */}
            {showCommentRight && (
              <PRCommentSystem
                isOpen={true}
                onClose={() => setShowCommentRight(false)}
                fileName={issue.file}
                lineNumber={issue.line}
                lineContent={issue.suggestedCode!}
              />
            )}
          </div>
        </div>
      )}

      {/* Single Code Block (when no fix available) */}
      {issue.originalCode && !issue.suggestedCode && (
        <div>
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Code at Line {issue.line}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCommentClick('single')}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Comment on this code"
              >
                <MessageSquare size={14} className="text-gray-700" />
              </button>
              <button
                onClick={() => copyToClipboard(issue.originalCode!)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
          <div className="p-4 font-mono text-sm overflow-x-auto bg-gray-25">
            <pre className="whitespace-pre-wrap">
              <div className="relative group">
                <code className="text-gray-800">{issue.originalCode}</code>
              </div>
            </pre>
          </div>
          
          {/* Inline Comment System for Single Code Block */}
          {showCommentSingle && (
            <PRCommentSystem
              isOpen={true}
              onClose={() => setShowCommentSingle(false)}
              fileName={issue.file}
              lineNumber={issue.line}
              lineContent={issue.originalCode!}
            />
          )}
        </div>
      )}
    </motion.div>
  );
};

export default CodeDiffViewer;