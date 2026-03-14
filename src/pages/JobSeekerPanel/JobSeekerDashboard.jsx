import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { jobsAPI, applicationsAPI, authAPI } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

const JobSeekerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
const [stats, setStats] = useState({
    applied: 0,
    saved: 0,
    interviews: 0,
    profile_views: 0
  });

  const [myApplications, setMyApplications] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const { unreadCount, fetchUnreadCount } = useNotification();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDarkMode(localStorage.getItem('theme') === 'dark');
    }
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchDashboardData();
    }, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [fetchUnreadCount, fetchDashboardData]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const statsRes = await applicationsAPI.dashboardStats();
      setStats({
        applied: statsRes.data.applied_count || 0,
        saved: statsRes.data.saved_count || 0,
        interviews: statsRes.data.interviews_count || 0,
        profile_views: statsRes.data.profile_views || 0
      });


      const appsRes = await applicationsAPI.myApplications();
      const apps = Array.isArray(appsRes.data) ? appsRes.data : appsRes.data.results || [];
      setMyApplications(apps);

      const jobsRes = await jobsAPI.list({ limit: 5 });
      const jobs = Array.isArray(jobsRes.data) ? jobsRes.data : jobsRes.data.results || [];
      setRecommendedJobs(jobs);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  }, []);

  const cardClass = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const textMuted = darkMode ? 'text-gray-400' : 'text-gray-500';
  const bgSecondary = darkMode ? 'bg-gray-700/50' : 'bg-gray-50';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'jobs', label: 'Browse Jobs', icon: '💼' },
    { id: 'applications', label: 'My Applications', icon: '📝' },
    { id: 'recommendations', label: 'AI Recommendations', icon: '🤖' },
    { id: 'saved', label: 'Saved Jobs', icon: '⭐' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-slate-50'} pb-12 transition-colors duration-300`}>
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 bottom-0 w-72 ${cardClass} shadow-2xl z-40 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 relative">
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h2 className={`text-lg font-bold ${textClass}`}>Job Seeker Hub</h2>
              <p className={`text-sm ${textMuted}`}>Find your dream job ({unreadCount} new notifications)</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'settings') {
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

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`fixed left-4 top-4 z-50 p-3 rounded-xl shadow-lg lg:hidden ${cardClass} ${textClass}`}
      >
        <span className="text-xl">{sidebarOpen ? '✕' : '☰'}</span>
      </button>

      <div className="lg:ml-72 px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 pt-6">
          <h1 className={`text-4xl font-bold ${textClass} mb-2`}>
            Welcome, {user?.first_name || user?.username || 'Job Seeker'}! 👋
          </h1>
          <p className={textMuted}>
            Find your dream job and track your applications
          </p>
        </motion.div>

        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className={`${cardClass} rounded-2xl shadow-lg p-5 border-l-4 border-violet-500`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textMuted}`}>Applications</p>
                    <p className="text-3xl font-bold text-violet-600">{stats.applied}</p>
                  </div>
                  <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center text-2xl">📝</div>
                </div>
              </div>
              <div className={`${cardClass} rounded-2xl shadow-lg p-5 border-l-4 border-emerald-500`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textMuted}`}>Profile Views</p>
                    <div className="flex items-center">
                      <p className="text-3xl font-bold text-emerald-600">{stats.profile_views}</p>
                      <button 
                        onClick={fetchDashboardData}
                        className="ml-2 p-1 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors text-emerald-500 hover:text-emerald-600" 
                        title="Refresh stats"
                      >
                        ↻
                      </button>
                    </div>

                  </div>
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-2xl">👁️</div>
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
            </div>


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

        {/* Other tabs abbreviated - add as needed */}
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
