import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ideasAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Ideas = () => {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportingIdea, setReportingIdea] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    problem_statement: '',
    solution: '',
    target_audience: '',
    business_model: ''
  });
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchIdeas();
  }, [category, sortBy]);

  const fetchIdeas = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (sortBy && sortBy !== 'trending') params.sort = sortBy;
      
      const response = await ideasAPI.list(params);
      let ideasData = response.data.results || response.data || [];
      
      // Handle "trending" filter on frontend since backend doesn't support it
      if (sortBy === 'trending') {
        ideasData = ideasData.filter(idea => (idea.upvotes || 0) - (idea.downvotes || 0) > 10);
        ideasData.sort((a, b) => ((b.upvotes || 0) - (b.downvotes || 0)) - ((a.upvotes || 0) - (a.downvotes || 0)));
      }
      
      setIdeas(ideasData);
    } catch (err) {
      console.error('Error fetching ideas:', err);
      setIdeas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchIdeas();
  };

  const handleVote = async (id, voteType) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await ideasAPI.vote(id, voteType);
      fetchIdeas();
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitIdea = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      await ideasAPI.create(formData);
      alert('Idea submitted successfully! It will be reviewed by admin.');
      setShowCreateModal(false);
      setFormData({
        title: '',
        category: '',
        problem_statement: '',
        solution: '',
        target_audience: '',
        business_model: ''
      });
      fetchIdeas();
    } catch (err) {
      console.error('Error submitting idea:', err);
      alert('Failed to submit idea. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReport = (idea, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setReportingIdea(idea);
    setShowReportModal(true);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    
    if (!reportingIdea || !reportReason.trim()) {
      alert('Please provide a reason for reporting');
      return;
    }

    setSubmitting(true);
    try {
      await ideasAPI.report(reportingIdea.id, reportReason);
      alert('Thank you! This idea has been reported and will be reviewed by admin.');
      setShowReportModal(false);
      setReportReason('');
      setReportingIdea(null);
    } catch (err) {
      console.error('Error reporting idea:', err);
      alert('Failed to report idea. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Backend uses these category values: technology, healthcare, education, finance, e-commerce, food, travel, real_estate, entertainment, social, other
  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'technology', label: 'Technology' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'finance', label: 'Finance' },
    { value: 'e-commerce', label: 'E-commerce' },
    { value: 'food', label: 'Food & Beverage' },
    { value: 'travel', label: 'Travel' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'social', label: 'Social Impact' },
    { value: 'other', label: 'Other' },
  ];

  // Display names for categories (backend uses lowercase values)
  const categoryDisplayNames = {
    'technology': 'Technology',
    'healthcare': 'Healthcare',
    'education': 'Education',
    'finance': 'Finance',
    'e-commerce': 'E-commerce',
    'food': 'Food & Beverage',
    'travel': 'Travel',
    'real_estate': 'Real Estate',
    'entertainment': 'Entertainment',
    'social': 'Social Impact',
    'other': 'Other',
  };

  const categoryColors = {
    'technology': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    'healthcare': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'education': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'finance': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'e-commerce': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    'food': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'travel': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    'real_estate': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'entertainment': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'social': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    'other': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };

  const getCategoryDisplayName = (categoryValue) => {
    return categoryDisplayNames[categoryValue] || categoryValue || 'Other';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Startup <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">Ideas</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover innovative ideas, vote on your favorites, and submit your own
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">🔍</span>
              <input
                type="text"
                placeholder="Search ideas by title or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-900/50 transition-all text-gray-900 dark:text-white placeholder-gray-400 shadow-sm"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-violet-500/30 transition-all"
            >
              Search
            </button>
          </form>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    (category === cat.value || (cat.value === '' && !category))
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-violet-500 text-black"
            >
              <option value="newest">Newest First</option>
              <option value="most_voted">Most Voted</option>
              <option value="trending">Trending</option>
            </select>
          </div>
        </motion.div>

        {/* Submit Idea Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <button
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/login');
                return;
              }
              setShowCreateModal(true);
            }}
            className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl font-bold hover:shadow-xl hover:shadow-violet-500/30 transition-all flex items-center justify-center gap-2"
          >
            <span>💡</span>
            Submit Your Startup Idea
          </button>
        </motion.div>

        {/* Ideas Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full"
            />
          </div>
        ) : ideas.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">💡</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No ideas found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Be the first to share your startup idea!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors"
            >
              Submit Idea
            </button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ideas.map((idea, index) => {
              const totalVotes = (idea.upvotes || 0) - (idea.downvotes || 0);
              const isTrending = totalVotes > 100;
              
              return (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  onClick={() => setSelectedIdea(idea)}
                  className={`bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-2xl border border-gray-200 dark:border-gray-700 p-6 cursor-pointer transition-all relative overflow-hidden ${
                    isTrending ? 'ring-2 ring-violet-500' : ''
                  }`}
                >
                  {/* Trending Badge */}
                  {isTrending && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        🔥 Trending
                      </span>
                    </div>
                  )}

                  {/* Category */}
                  <div className="mb-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${categoryColors[idea.category] || categoryColors.other}`}>
                      {getCategoryDisplayName(idea.category)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {idea.title}
                  </h3>

                  {/* Problem */}
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                    {idea.problem_statement}
                  </p>

                  {/* Solution Preview */}
                  <p className="text-gray-500 dark:text-gray-500 text-sm mb-4 line-clamp-2">
                    <span className="font-semibold text-violet-600 dark:text-violet-400">Solution:</span> {idea.solution}
                  </p>

                  {/* Target Audience */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      🎯 {idea.target_audience?.slice(0, 50)}...
                    </p>
                  </div>

                  {/* Author & Date */}
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span>by @{idea.author?.username || 'anonymous'}</span>
                    <span>{new Date(idea.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Vote Buttons */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(idea.id, 'up');
                      }}
                      className="flex-1 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl font-semibold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors flex items-center justify-center gap-1"
                    >
                      <span>👍</span>
                      <span>{idea.upvotes || 0}</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(idea.id, 'down');
                      }}
                      className="flex-1 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-1"
                    >
                      <span>👎</span>
                      <span>{idea.downvotes || 0}</span>
                    </motion.button>
                    <span className={`px-3 py-2 rounded-xl font-bold ${
                      totalVotes > 0 ? 'text-green-600' : totalVotes < 0 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {totalVotes > 0 ? '+' : ''}{totalVotes}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Create Idea Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Submit Your Startup Idea
                    </h2>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSubmitIdea} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Idea Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleFormChange}
                        placeholder="Give your idea a catchy name"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-violet-500 text-gray-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Category *
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 bg-white border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-violet-500 text-black"
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.filter(c => c.value !== '').map((cat) => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Problem Statement *
                      </label>
                      <textarea
                        name="problem_statement"
                        value={formData.problem_statement}
                        onChange={handleFormChange}
                        placeholder="What problem does your idea solve?"
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-violet-500 text-gray-900 dark:text-white resize-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Proposed Solution *
                      </label>
                      <textarea
                        name="solution"
                        value={formData.solution}
                        onChange={handleFormChange}
                        placeholder="How will you solve this problem?"
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-violet-500 text-gray-900 dark:text-white resize-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Target Audience
                      </label>
                      <input
                        type="text"
                        name="target_audience"
                        value={formData.target_audience}
                        onChange={handleFormChange}
                        placeholder="Who will benefit from this idea?"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-violet-500 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Business Model (Optional)
                      </label>
                      <input
                        type="text"
                        name="business_model"
                        value={formData.business_model}
                        onChange={handleFormChange}
                        placeholder="How will you make money?"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-violet-500 text-gray-900 dark:text-white"
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={submitting}
                      className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-violet-500/30 transition-all disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Submit Idea 🚀'}
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Idea Detail Modal */}
        <AnimatePresence>
          {selectedIdea && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedIdea(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <span className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${categoryColors[selectedIdea.category] || categoryColors.other}`}>
                      {getCategoryDisplayName(selectedIdea.category)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => handleOpenReport(selectedIdea, e)}
                        className="p-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                        title="Report this idea"
                      >
                        🚨
                      </button>
                      <button
                        onClick={() => setSelectedIdea(null)}
                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    {selectedIdea.title}
                  </h2>

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
                    <span>by @{selectedIdea.author?.username || 'anonymous'}</span>
                    <span>•</span>
                    <span>{new Date(selectedIdea.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Problem Statement</h3>
                      <p className="text-gray-600 dark:text-gray-400">{selectedIdea.problem_statement}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Proposed Solution</h3>
                      <p className="text-gray-600 dark:text-gray-400">{selectedIdea.solution}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Target Audience</h3>
                      <p className="text-gray-600 dark:text-gray-400">{selectedIdea.target_audience}</p>
                    </div>

                    {selectedIdea.business_model && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Business Model</h3>
                        <p className="text-gray-600 dark:text-gray-400">{selectedIdea.business_model}</p>
                      </div>
                    )}
                  </div>

                  {/* Voting */}
                  <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleVote(selectedIdea.id, 'up')}
                      className="flex-1 py-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl font-semibold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors flex items-center justify-center gap-2"
                    >
                      <span>👍</span>
                      <span>{selectedIdea.upvotes || 0}</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleVote(selectedIdea.id, 'down')}
                      className="flex-1 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2"
                    >
                      <span>👎</span>
                      <span>{selectedIdea.downvotes || 0}</span>
                    </motion.button>
                    <div className={`px-4 py-3 rounded-xl font-bold text-lg ${
                      (selectedIdea.upvotes - selectedIdea.downvotes) > 0 
                        ? 'text-green-600 bg-green-50 dark:bg-green-900/20' 
                        : 'text-gray-500 bg-gray-100 dark:bg-gray-700'
                    }`}>
                      {(selectedIdea.upvotes || 0) - (selectedIdea.downvotes || 0)}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report Idea Modal */}
        <AnimatePresence>
          {showReportModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowReportModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    🚨 Report Idea
                  </h2>
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Why are you reporting this idea?
                </p>

                <form onSubmit={handleSubmitReport}>
                  <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Enter reason for reporting..."
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-red-500 text-gray-900 dark:text-white resize-none mb-4"
                    required
                  />

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowReportModal(false)}
                      className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Reporting...' : 'Submit Report'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Ideas;
