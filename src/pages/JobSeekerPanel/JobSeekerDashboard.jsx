import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { jobsAPI, applicationsAPI, ideasAPI } from '../../services/api';

const JobSeekerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    applied: 0,
    saved: 0,
    interviews: 0,
    profileViews: 0
  });
  const [myApplications, setMyApplications] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch my applications
      try {
        const appsRes = await applicationsAPI.myApplications();
        const apps = Array.isArray(appsRes.data) ? appsRes.data : appsRes.data.results || [];
        setMyApplications(apps);
        setStats(prev => ({ ...prev, applied: apps.length }));
        
        // Count interviews
        const interviewCount = apps.filter(a => a.status === 'interview' || a.status === 'offered').length;
        setStats(prev => ({ ...prev, interviews: interviewCount }));
      } catch (e) {
        setMyApplications([]);
      }

      // Fetch recommended jobs
      try {
        const jobsRes = await jobsAPI.list({ limit: 5 });
        const jobs = Array.isArray(jobsRes.data) ? jobsRes.data : jobsRes.data.results || [];
        setRecommendedJobs(jobs);
      } catch (e) {
        setRecommendedJobs([]);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'jobs', label: 'Browse Jobs', icon: '💼' },
    { id: 'applications', label: 'My Applications', icon: '📝' },
    { id: 'recommendations', label: 'AI Recommendations', icon: '🤖' },
    { id: 'saved', label: 'Saved Jobs', icon: '⭐' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const cardClass = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const textMuted = darkMode ? 'text-gray-400' : 'text-gray-500';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';
  const bgSecondary = darkMode ? 'bg-gray-700/50' : 'bg-gray-50';
  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900';

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-slate-50'} pb-12 transition-colors duration-300`}>
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 bottom-0 w-72 ${cardClass} shadow-2xl z-40 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h2 className={`text-lg font-bold ${textClass}`}>Job Seeker Hub</h2>
              <p className={`text-sm ${textMuted}`}>Find your dream job</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'profile') {
                  navigate('/profile');
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${
                activeTab === item.id
                  ? darkMode ? 'bg-violet-900/40 text-violet-400' : 'bg-violet-50 text-violet-700'
                  : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => { logout(); navigate('/'); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${
              darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <span className="text-xl">🚪</span>
            Logout
          </button>
        </div>
      </div>

      {/* Mobile menu toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`fixed left-4 top-4 z-50 p-3 rounded-xl shadow-lg lg:hidden ${cardClass} ${textClass}`}
      >
        <span className="text-xl">{sidebarOpen ? '✕' : '☰'}</span>
      </button>

      {/* Main Content */}
      <div className="lg:ml-72 px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 pt-6">
          <h1 className={`text-4xl font-bold ${textClass} mb-2`}>
            Welcome, {user?.first_name || user?.username || 'Job Seeker'}! 👋
          </h1>
          <p className={textMuted}>
            Find your dream job and track your applications
          </p>
        </motion.div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className={`${cardClass} rounded-2xl shadow-lg p-5 border-l-4 border-violet-500`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textMuted}`}>Applications</p>
                    <p className="text-3xl font-bold text-violet-600">{stats.applied}</p>
                  </div>
                  <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center text-2xl">📝</div>
                </div>
              </div>
              <div className={`${cardClass} rounded-2xl shadow-lg p-5 border-l-4 border-purple-500`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textMuted}`}>Interviews</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.interviews}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-2xl">💬</div>
                </div>
              </div>
              <div className={`${cardClass} rounded-2xl shadow-lg p-5 border-l-4 border-yellow-500`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textMuted}`}>Saved</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.saved}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center text-2xl">⭐</div>
                </div>
              </div>
              <div className={`${cardClass} rounded-2xl shadow-lg p-5 border-l-4 border-blue-500`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textMuted}`}>Profile Views</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.profileViews}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-2xl">👁️</div>
                </div>
              </div>
            </div>

            {/* Recent Applications & Quick Actions */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className={`${cardClass} rounded-2xl shadow-lg p-6`}>
                <h3 className={`text-xl font-bold ${textClass} mb-4`}>Recent Applications</h3>
                {myApplications.length > 0 ? (
                  <div className="space-y-3">
                    {myApplications.slice(0, 5).map((app) => (
                      <div key={app.id} className={`flex items-center justify-between p-4 ${bgSecondary} rounded-xl`}>
                        <div>
                          <h4 className={`font-semibold ${textClass}`}>{app.job?.title || 'Job Title'}</h4>
                          <p className={`text-sm ${textMuted}`}>Applied {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recently'}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                          app.status === 'interview' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          app.status === 'accepted' || app.status === 'offered' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {app.status || 'pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-8 ${textMuted}`}>
                    <div className="text-4xl mb-2">📋</div>
                    <p>No applications yet</p>
                    <Link to="/jobs" className="text-violet-600 font-medium hover:underline mt-2 inline-block">Browse Jobs →</Link>
                  </div>
                )}
              </div>

              <div className={`${cardClass} rounded-2xl shadow-lg p-6`}>
                <h3 className={`text-xl font-bold ${textClass} mb-4`}>Quick Actions</h3>
                <div className="space-y-3">
                  <button onClick={() => setActiveTab('jobs')} className="w-full p-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-violet-500/30 transition-all flex items-center justify-center gap-2">
                    <span>🔍</span> Browse Jobs
                  </button>
                  <button onClick={() => navigate('/profile')} className={`w-full p-4 ${bgSecondary} ${darkMode ? 'text-gray-300' : 'text-gray-700'} rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2`}>
                    <span>👤</span> Edit Profile
                  </button>
                  <button onClick={() => setActiveTab('recommendations')} className={`w-full p-4 ${bgSecondary} ${darkMode ? 'text-gray-300' : 'text-gray-700'} rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2`}>
                    <span>🤖</span> AI Recommendations
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className={`${cardClass} rounded-2xl shadow-lg p-6`}>
              <h3 className={`text-xl font-bold ${textClass} mb-6`}>Browse Jobs</h3>
              {recommendedJobs.length > 0 ? (
                <div className="space-y-4">
                  {recommendedJobs.map((job) => (
                    <div key={job.id} className={`p-4 ${bgSecondary} rounded-xl`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className={`font-semibold ${textClass}`}>{job.title}</h4>
                          <p className={`text-sm ${textMuted}`}>{job.company_name || 'Company'} • {job.location}</p>
                          <p className={`text-sm ${textClass} mt-2`}>{job.description?.slice(0, 100)}...</p>
                        </div>
                        <Link to={`/jobs/${job.id}`} className="px-4 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl font-medium hover:bg-violet-200">View</Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-12 ${textMuted}`}>
                  <div className="text-6xl mb-4">💼</div>
                  <p>No jobs available at the moment</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className={`${cardClass} rounded-2xl shadow-lg p-6`}>
              <h3 className={`text-xl font-bold ${textClass} mb-6`}>My Applications ({myApplications.length})</h3>
              {myApplications.length > 0 ? (
                <div className="space-y-4">
                  {myApplications.map((app) => (
                    <div key={app.id} className={`flex items-center justify-between p-4 ${bgSecondary} rounded-xl`}>
                      <div>
                        <h4 className={`font-semibold ${textClass}`}>{app.job?.title || 'Job Title'}</h4>
                        <p className={`text-sm ${textMuted}`}>Applied {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recently'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                        app.status === 'interview' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        app.status === 'accepted' || app.status === 'offered' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {app.status || 'pending'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <h4 className={`text-xl font-semibold ${textClass} mb-2`}>No applications yet</h4>
                  <p className={`${textMuted} mb-4`}>Start applying for jobs</p>
                  <Link to="/jobs" className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700">Browse Jobs</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className={`${cardClass} rounded-2xl shadow-lg p-6`}>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🤖</span>
                <h3 className={`text-xl font-bold ${textClass}`}>AI-Powered Recommendations</h3>
              </div>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <h4 className={`text-xl font-semibold ${textClass} mb-2`}>Personalized Job Matches</h4>
                <p className={`${textMuted} mb-4`}>Complete your profile to get AI recommendations</p>
                <Link to="/profile" className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700">Complete Profile</Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Saved Jobs Tab */}
        {activeTab === 'saved' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className={`${cardClass} rounded-2xl shadow-lg p-6`}>
              <h3 className={`text-xl font-bold ${textClass} mb-6`}>Saved Jobs</h3>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⭐</div>
                <h4 className={`text-xl font-semibold ${textClass} mb-2`}>No saved jobs yet</h4>
                <p className={`${textMuted} mb-4`}>Save jobs you're interested in</p>
                <Link to="/jobs" className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700">Browse Jobs</Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Appearance */}
            <div className={`${cardClass} rounded-2xl shadow-lg p-6 mb-6`}>
              <h3 className={`text-xl font-bold ${textClass} mb-6`}>Appearance</h3>
              <div className={`flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/20 rounded-xl`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center text-2xl">
                    {darkMode ? '🌙' : '☀️'}
                  </div>
                  <div>
                    <p className={`font-semibold ${textClass}`}>Dark Mode</p>
                    <p className={`text-sm ${textMuted}`}>Toggle dark/light theme</p>
                  </div>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${darkMode ? 'bg-violet-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${darkMode ? 'left-7' : 'left-1'}`}></span>
                </button>
              </div>
            </div>

            {/* Account Section */}
            <div className={`${cardClass} rounded-2xl shadow-lg p-6`}>
              <h3 className={`text-xl font-bold ${textClass} mb-6`}>Account</h3>
              <div className="space-y-4">
                <div className={`flex items-center gap-4 p-4 ${bgSecondary} rounded-xl`}>
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 rounded-full flex items-center justify-center text-2xl font-bold text-violet-600 dark:text-violet-400">
                    {(user?.username || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className={`font-semibold ${textClass}`}>{user?.username || 'User'}</p>
                    <p className={`text-sm ${textMuted}`}>{user?.email || 'email@example.com'}</p>
                  </div>
                </div>
                <button onClick={() => { logout(); navigate('/'); }} className="w-full p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2">
                  <span>🚪</span> Logout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
