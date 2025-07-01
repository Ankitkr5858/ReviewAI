import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Key, Zap, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { useGitHubIntegration } from '../hooks/useGitHubIntegration';

const GitHubSetup: React.FC = () => {
  const [githubToken, setGithubToken] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [showTokens, setShowTokens] = useState(false);
  const { connectGitHub, loading, error, isConnected } = useGitHubIntegration();

  const handleConnect = async () => {
    if (!githubToken || !openaiKey) {
      alert('Please provide both GitHub token and OpenAI API key');
      return;
    }

    // Store OpenAI key
    localStorage.setItem('openai_api_key', openaiKey);
    
    const result = await connectGitHub(githubToken);
    if (result.success) {
      alert('Successfully connected to GitHub!');
    }
  };

  if (isConnected) {
    return (
      <motion.div
        className="bg-green-50 border border-green-200 rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="text-green-600" size={24} />
          <h3 className="text-lg font-semibold text-green-900">GitHub Connected</h3>
        </div>
        <p className="text-green-700 mb-4">
          ReviewAI is now connected to your GitHub account and ready to review code!
        </p>
        <div className="flex gap-3">
          <motion.button
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
          >
            Go to Dashboard
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-3 bg-black rounded-lg inline-block mb-4">
          <Github size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect GitHub Account</h2>
        <p className="text-gray-600">
          Set up ReviewAI to automatically review your repositories
        </p>
      </motion.div>

      <motion.div
        className="bg-white rounded-lg border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Setup</h3>
        
        <div className="space-y-6">
          {/* GitHub Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GitHub Personal Access Token
            </label>
            <div className="space-y-2">
              <input
                type={showTokens ? 'text' : 'password'}
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowTokens(!showTokens)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {showTokens ? 'Hide' : 'Show'} tokens
                </button>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo,read:user,user:email"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  Create Token
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Required scopes: repo, read:user, user:email
            </p>
          </div>

          {/* OpenAI API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OpenAI API Key
            </label>
            <div className="space-y-2">
              <input
                type={showTokens ? 'text' : 'password'}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                Get API Key
                <ExternalLink size={14} />
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Required for AI-powered code analysis
            </p>
          </div>
        </div>

        {error && (
          <motion.div
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AlertCircle size={16} className="text-red-600" />
            <span className="text-red-700 text-sm">{error}</span>
          </motion.div>
        )}

        <motion.button
          onClick={handleConnect}
          disabled={loading || !githubToken || !openaiKey}
          className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Zap size={18} />
              Connect ReviewAI
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Instructions */}
      <motion.div
        className="bg-gray-50 rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h4 className="font-semibold text-gray-900 mb-3">How it works:</h4>
        <ol className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">1</span>
            Create a GitHub Personal Access Token with repo permissions
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">2</span>
            Get an OpenAI API key for AI-powered code analysis
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">3</span>
            ReviewAI will automatically review pull requests and main branch
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">4</span>
            Get detailed feedback, auto-fixes, and merge recommendations
          </li>
        </ol>
      </motion.div>
    </div>
  );
};

export default GitHubSetup;