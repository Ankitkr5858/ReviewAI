import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Check, GitBranch } from 'lucide-react';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  language: string;
  updated_at: string;
  html_url: string;
  open_issues_count: number;
  stargazers_count: number;
  forks_count: number;
  private: boolean;
}

interface SearchableDropdownProps {
  repositories: Repository[];
  selectedRepo: string;
  onRepoChange: (repoFullName: string) => void;
  placeholder?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  repositories,
  selectedRepo,
  onRepoChange,
  placeholder = "Choose a repository..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter repositories based on search term
  const filteredRepos = repositories.filter(repo =>
    repo.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (repo.language && repo.language.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get selected repository details
  const selectedRepository = repositories.find(repo => repo.full_name === selectedRepo);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleRepoSelect = (repoFullName: string) => {
    onRepoChange(repoFullName);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      'JavaScript': 'bg-yellow-100 text-yellow-800',
      'TypeScript': 'bg-blue-100 text-blue-800',
      'Python': 'bg-green-100 text-green-800',
      'Java': 'bg-red-100 text-red-800',
      'C++': 'bg-purple-100 text-purple-800',
      'Go': 'bg-cyan-100 text-cyan-800',
      'Rust': 'bg-orange-100 text-orange-800',
      'PHP': 'bg-indigo-100 text-indigo-800',
      'Ruby': 'bg-pink-100 text-pink-800',
      'C#': 'bg-violet-100 text-violet-800',
      'Swift': 'bg-orange-100 text-orange-800',
      'Kotlin': 'bg-purple-100 text-purple-800',
    };
    return colors[language] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-3 flex-1 text-left">
          <GitBranch size={18} className="text-gray-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {selectedRepository ? (
              <div>
                <div className="font-medium text-gray-900 truncate">
                  {selectedRepository.name}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {selectedRepository.full_name} • {selectedRepository.language || 'Unknown'}
                </div>
              </div>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={20} className="text-gray-400" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Search Input */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search repositories..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Repository List */}
            <div className="max-h-80 overflow-y-auto">
              {filteredRepos.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <GitBranch size={32} className="mx-auto mb-2 text-gray-400" />
                  <p>No repositories found</p>
                  <p className="text-sm">Try adjusting your search terms</p>
                </div>
              ) : (
                filteredRepos.map((repo) => (
                  <motion.button
                    key={repo.id}
                    onClick={() => handleRepoSelect(repo.full_name)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                      selectedRepo === repo.full_name ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                    whileHover={{ backgroundColor: '#f9fafb' }}
                  >
                    <div className="flex-shrink-0">
                      <GitBranch size={16} className="text-gray-500" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 truncate">
                          {repo.name}
                        </span>
                        {repo.language && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLanguageColor(repo.language)}`}>
                            {repo.language}
                          </span>
                        )}
                        {repo.private && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            Private
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-500 truncate">
                        {repo.full_name}
                      </div>
                      
                      {repo.description && (
                        <div className="text-xs text-gray-400 truncate mt-1">
                          {repo.description}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                        <span>⭐ {repo.stargazers_count}</span>
                        <span>🍴 {repo.forks_count}</span>
                        {repo.open_issues_count > 0 && (
                          <span>🐛 {repo.open_issues_count} issues</span>
                        )}
                      </div>
                    </div>

                    {selectedRepo === repo.full_name && (
                      <div className="flex-shrink-0">
                        <Check size={16} className="text-blue-600" />
                      </div>
                    )}
                  </motion.button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-500 text-center">
                {filteredRepos.length} of {repositories.length} repositories
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchableDropdown;