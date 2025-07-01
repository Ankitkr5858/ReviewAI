import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, Copy, ExternalLink } from 'lucide-react';

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
}

interface CodeDiffViewerProps {
  issue: CodeIssue;
  onApplyFix?: ((issue: CodeIssue) => Promise<void>) | null;
}

const CodeDiffViewer: React.FC<CodeDiffViewerProps> = ({ issue, onApplyFix }) => {
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

      {/* Code Diff */}
      {issue.originalCode && issue.suggestedCode && (
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Original Code */}
          <div className="border-r border-gray-200">
            <div className="bg-red-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-medium text-red-700">Current Code</span>
              <button
                onClick={() => copyToClipboard(issue.originalCode!)}
                className="p-1 hover:bg-red-100 rounded transition-colors"
              >
                <Copy size={14} />
              </button>
            </div>
            <div className="p-4 bg-red-25 font-mono text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap">
                <code className="text-red-800">{issue.originalCode}</code>
              </pre>
            </div>
          </div>

          {/* Suggested Code */}
          <div>
            <div className="bg-green-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-medium text-green-700">Suggested Fix</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(issue.suggestedCode!)}
                  className="p-1 hover:bg-green-100 rounded transition-colors"
                >
                  <Copy size={14} />
                </button>
                {/* Remove the Apply Fix button from here to prevent double confirmation */}
              </div>
            </div>
            <div className="p-4 bg-green-25 font-mono text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap">
                <code className="text-green-800">{issue.suggestedCode}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Single Code Block (when no fix available) */}
      {issue.originalCode && !issue.suggestedCode && (
        <div>
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Code at Line {issue.line}</span>
            <button
              onClick={() => copyToClipboard(issue.originalCode!)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <Copy size={14} />
            </button>
          </div>
          <div className="p-4 font-mono text-sm overflow-x-auto bg-gray-25">
            <pre className="whitespace-pre-wrap">
              <code className="text-gray-800">{issue.originalCode}</code>
            </pre>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CodeDiffViewer;