import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { aiAPI, applicationsAPI } from '../services/api';

const Recommendations = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [error, setError] = useState('');
  const [appliedJobs, setAppliedJobs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch user's applied jobs
      if (user) {
        try {
          const appliedResponse = await applicationsAPI.myApplications();
          const applications = appliedResponse.data.results || appliedResponse.data || [];
          const appliedJobIds = applications.map(app => app.job);
          setAppliedJobs(appliedJobIds);
        } catch (err) {
          console.log('Could not fetch applied jobs');
        }
      }

      // Fetch AI recommendations based on skills
      const response = await aiAPI.recommendJobs();
      
      if (response.data.recommendations && response.data.recommendations.length > 0) {
        setRecommendations(response.data.recommendations);
        setProfileComplete(true);
      } else {
        setProfileComplete(false);
        setRecommendations([]);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      if (err.response?.status === 403) {
        setError('Only job seekers can get recommendations.');
      } else if (err.response?.status === 404) {
        setError(err.response.data?.error || 'Profile not found. Please complete your profile first.');
        setProfileComplete(false);
      } else {
        setError('Failed to fetch recommendations. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (score) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-green-400';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getMatchTextColor = (score) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-green-500 dark:text-green-300';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  const isJobApplied = (jobId) => appliedJobs.includes(jobId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🤖</span>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              AI Job Matches
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Jobs matching your skills - ranked by compatibility percentage
          </p>
        </motion.div>

        {/* AI Badge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 rounded-full">
            <span>✨</span>
            <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
              Skill-Based Matching
            </span>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : error || !profileComplete ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {error ? 'Unable to Get Matches' : 'Complete Your Profile'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {error || 'Add your skills in the profile to get job matches based on your skills'}
            </p>
            <Link to="/profile" className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700">
              Add Skills in Profile
            </Link>
          </motion.div>
        ) : recommendations.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {recommendations.length} Jobs Matching Your Skills
              </h2>
              <button 
                onClick={fetchData} 
                className="px-4 py-2 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-xl transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
            {recommendations.map((job, index) => (
              <motion.div 
                key={job.job_id} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start gap-6">
                  {/* Match Score */}
                  <div className="flex flex-col items-center">
                    <div className={`w-20 h-20 rounded-full ${getMatchColor(job.match_score)} flex items-center justify-center`}>
                      <span className="text-3xl font-bold text-white">{Math.round(job.match_score)}%</span>
                    </div>
                    <span className={`text-xs font-semibold mt-1 ${getMatchTextColor(job.match_score)}`}>Match</span>
                  </div>

                  {/* Job Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {job.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {job.company || 'Company'} • {job.location || 'Location not specified'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`}>
                        {job.job_type?.replace('_', ' ') || 'Active'}
                      </span>
                    </div>

                    {/* Skills Match Info */}
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Based on your skills matching job requirements
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center gap-3">
                      {isJobApplied(job.job_id) ? (
                        <div className="px-6 py-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl font-semibold">
                          ✓ Already Applied
                        </div>
                      ) : (
                        <Link 
                          to={`/jobs?job=${job.job_id}`}
                          className="px-4 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl font-medium hover:bg-violet-200 dark:hover:bg-violet-900/50"
                        >
                          View & Apply
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No Matching Jobs Found
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              We couldn't find jobs matching your skills. Try adding more skills to your profile.
            </p>
            <div className="flex justify-center gap-4">
              <button onClick={fetchData} className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700">
                Refresh Matches
              </button>
              <Link to="/profile" className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-700">
                Add More Skills
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;
