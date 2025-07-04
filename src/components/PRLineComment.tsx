import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Wand2, Send, X } from 'lucide-react';

interface PRLineCommentProps {
  fileName: string;
  lineNumber: number;
  lineContent: string;
  onComment: (comment: string) => void;
  onCancel: () => void;
}

const PRLineComment: React.FC<PRLineCommentProps> = ({
  fileName,
  lineNumber,
  lineContent,
  onComment,
  onCancel
}) => {
  const [comment, setComment] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      onComment(comment);
      setComment('');
    }
  };

  return (
    <motion.div
      className="border border-gray-200 rounded-lg bg-white shadow-lg overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
    >
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-gray-500" />
          <span className="font-medium text-gray-900">
            Comment on {fileName}:{lineNumber}
          </span>
        </div>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
        >
          <X size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Code context */}
      <div className="bg-gray-900 text-gray-200 p-3 font-mono text-sm overflow-x-auto">
        <div className="flex">
          <span className="text-gray-500 mr-3">{lineNumber}</span>
          <code>{lineContent}</code>
        </div>
      </div>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-start gap-2">
          <div className="p-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full">
            <Wand2 size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ask ReviewAI about this code..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
            <div className="flex justify-between mt-2">
              <div className="text-xs text-gray-500">
                {isTyping ? 'ReviewAI is typing...' : 'Ask about this specific line of code'}
              </div>
              <motion.button
                type="submit"
                disabled={!comment.trim() || isTyping}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                whileHover={{ scale: !comment.trim() || isTyping ? 1 : 1.05 }}
                whileTap={{ scale: !comment.trim() || isTyping ? 1 : 0.95 }}
              >
                <Send size={16} />
                Comment
              </motion.button>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default PRLineComment;