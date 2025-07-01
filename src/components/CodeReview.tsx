import React from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  GitBranch,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Download,
  Play
} from 'lucide-react';

const CodeReview: React.FC = () => {
  const { id } = useParams();

  const reviewData = {
    id: '1',
    repository: 'frontend-app',
    branch: 'feature/user-auth',
    status: 'in-progress',
    startedAt: '2024-01-15T10:30:00Z',
    progress: 65,
    issues: [
      {
        type: 'error',
        file: 'src/components/Login.tsx',
        line: 45,
        message: 'Potential XSS vulnerability: Unsanitized user input',
        severity: 'high',
        suggestion: 'Use DOMPurify to sanitize user input before rendering'
      },
      {
        type: 'warning',
        file: 'src/utils/auth.ts',
        line: 23,
        message: 'Missing error handling for async operation',
        severity: 'medium',
        suggestion: 'Add try-catch block around async authentication call'
      },
      {
        type: 'info',
        file: 'src/styles/globals.css',
        line: 12,
        message: 'Consider using CSS custom properties for consistency',
        severity: 'low',
        suggestion: 'Replace hardcoded colors with CSS variables'
      }
    ],
    files: [
      { name: 'src/components/Login.tsx', changes: 45, status: 'modified' },
      { name: 'src/utils/auth.ts', changes: 23, status: 'new' },
      { name: 'src/styles/globals.css', changes: 8, status: 'modified' },
      { name: 'src/types/user.ts', changes: 12, status: 'new' }
    ]
  };

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
        return FileText;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-4"
      >
        <motion.button
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowLeft size={20} />
        </motion.button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black rounded-lg">
            <GitBranch size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{reviewData.repository}</h1>
            <p className="text-gray-600">{reviewData.branch}</p>
          </div>
        </div>
      </motion.div>

      {/* Review Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Clock size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Review in Progress</h3>
              <p className="text-sm text-gray-600">Started 2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play size={16} />
              Resume
            </motion.button>
            <motion.button
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download size={16} />
              Export
            </motion.button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm font-medium text-gray-900">{reviewData.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-black h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${reviewData.progress}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Issues */}
        <motion.div
          className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Issues Found</h3>
          <div className="space-y-4">
            {reviewData.issues.map((issue, index) => {
              const IssueIcon = getIssueIcon(issue.type);
              
              return (
                <motion.div
                  key={index}
                  className={`border rounded-lg p-4 ${getSeverityColor(issue.severity)}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex items-start gap-3">
                    <IssueIcon size={20} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{issue.file}:{issue.line}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                          {issue.severity}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{issue.message}</p>
                      <div className="bg-white bg-opacity-50 rounded p-2">
                        <p className="text-xs font-medium mb-1">Suggestion:</p>
                        <p className="text-xs">{issue.suggestion}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Files */}
        <motion.div
          className="bg-white rounded-lg border border-gray-200 p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Files Changed</h3>
          <div className="space-y-3">
            {reviewData.files.map((file, index) => (
              <motion.div
                key={index}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{file.changes} changes</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  file.status === 'new' 
                    ? 'bg-green-50 text-green-600' 
                    : 'bg-blue-50 text-blue-600'
                }`}>
                  {file.status}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CodeReview;