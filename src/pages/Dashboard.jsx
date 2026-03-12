import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { jobsAPI, applicationsAPI, ideasAPI, profileAPI } from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    jobs: 0,
    applications: 0,
    ideas: 0,
    users: 0,
  });
  const [profileViews, setProfileViews] = useState(0);
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [jobApplicants, setJobApplicants] = useState({});
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [creatingJob, setCreatingJob] = useState(false);
  const [jobSuccess, setJobSuccess] = useState(false);
  const [jobFormData, setJobFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    salary_min: '',
    salary_max: '',
    job_type: 'full_time',
    experience_level: 'mid',
    skills: '',
  });
  const navigate = useNavigate();

  const role = user?.role || localStorage.getItem('userRole') || 'seeker';

  useEffect(() => {
    fetchDashboardData();
    if (role === 'seeker') {
      fetchSavedJobs();
    }
  }, [user, role]);

  const fetchSavedJobs = async () => {
    setSavedLoading(true);
    try {
      const response = await jobsAPI.getSavedJobs();
      const saved = response.data.results || response.data || [];
      setSavedJobs(saved);
    } catch (err) {
      console.error('Error fetching saved jobs:', err);
      setSavedJobs([]);
    } finally {
      setSavedLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let jobsRes = null;
      let appsRes = null;
      let ideasRes = null;
      
      // For recruiters, fetch their own jobs using myJobs endpoint
      if (role === 'recruiter') {
        console.log('Fetching jobs for recruiter, role:', role);
        try {
          jobsRes = await jobsAPI.myJobs();
          console.log('Recruiter jobs response:', jobsRes.data);
        } catch (e) {
          console.error('Error fetching recruiter jobs:', e);
          jobsRes = { data: [] };
        }
      } else {
        // For seekers and admins, fetch all approved jobs
        try {
          jobsRes = await jobsAPI.list();
        } catch (e) {
          jobsRes = { data: { results: [] } };
        }
      }
      
      // For seekers, fetch their applications and profile
      if (role === 'seeker') {
        try {
          appsRes = await applicationsAPI.myApplications();
        } catch (e) {
          appsRes = { data: { results: [] } };
        }
        
        // Fetch profile for profile views count
        try {
          const profileRes = await profileAPI.get();
          if (profileRes.data && profileRes.data.profile_views !== undefined) {
            setProfileViews(profileRes.data.profile_views);
          }
        } catch (e) {
          console.error('Error fetching profile:', e);
        }
      }
      
      // Fetch all approved startup ideas for stats
      try {
        ideasRes = await ideasAPI.list({ page_size: 1 }); // Just get count
        console.log('Ideas response:', ideasRes.data);
      } catch (e) {
        console.error('Error fetching ideas:', e);
        ideasRes = { data: { results: [], count: 0 } };
      }
      
      // Handle both array response (myJobs) and paginated response (list)
      let jobsData = [];
      if (Array.isArray(jobsRes?.data)) {
        jobsData = jobsRes.data;
      } else if (jobsRes?.data?.results) {
        jobsData = jobsRes.data.results;
      }
      
      console.log('Jobs data after parsing:', jobsData);
      
      if (role === 'recruiter' && jobsData.length > 0) {
        const applicantsData = {};
        for (const job of jobsData) {
          try {
            const applicantsRes = await applicationsAPI.jobApplicants(job.id);
            applicantsData[job.id] = applicantsRes.data || [];
          } catch (e) {
            applicantsData[job.id] = [];
          }
        }
        setJobApplicants(applicantsData);
      }
      
      setRecentJobs(jobsData.slice(0, 5));
      
      // Handle applications response
      let appsData = [];
      if (Array.isArray(appsRes?.data)) {
        appsData = appsRes.data;
      } else if (appsRes?.data?.results) {
        appsData = appsRes.data.results;
      }
      
      if (appsRes) {
        setRecentApplications(appsData);
      }
      
      // Handle ideas count from paginated response
      let ideasCount = 0;
      if (ideasRes?.data?.count !== undefined) {
        ideasCount = ideasRes.data.count;
      } else if (Array.isArray(ideasRes?.data)) {
        ideasCount = ideasRes.data.length;
      } else if (Array.isArray(ideasRes?.data?.results)) {
        ideasCount = ideasRes.data.results.length;
      }
      
      console.log('Ideas count:', ideasCount);
      
      setStats({
        jobs: jobsData.length || 0,
        applications: appsData.length || 0,
        ideas: ideasCount,
        users: 0,
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setStats({ jobs: 0, applications: 0, ideas: 0, users: 0 });
      setRecentJobs([]);
      setRecentApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setCreatingJob(true);
    
    try {
      const jobData = {
        ...jobFormData,
        skills: jobFormData.skills.split(',').map(s => s.trim()).filter(s => s),
        salary_min: jobFormData.salary_min ? parseInt(jobFormData.salary_min) : null,
        salary_max: jobFormData.salary_max ? parseInt(jobFormData.salary_max) : null,
      };
      
      await jobsAPI.create(jobData);
      setJobSuccess(true);
      setTimeout(() => {
        setShowCreateJobModal(false);
        setJobSuccess(false);
        setJobFormData({ title: '', description: '', requirements: '', location: '', salary_min: '', salary_max: '', job_type: 'full_time', experience_level: 'mid', skills: '' });
        fetchDashboardData();
      }, 2000);
    } catch (err) {
      console.error('Error creating job:', err);
      alert('Failed to create job. Please try again.');
    } finally {
      setCreatingJob(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    interview: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    offered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    hired: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };

  const statsCards = [
    { label: 'Available Jobs', value: stats.jobs, icon: '💼', color: 'from-violet-500 to-purple-500', link: '/jobs' },
    { label: role === 'seeker' ? 'My Applications' : 'Total Applications', value: stats.applications, icon: '📝', color: 'from-pink-500 to-rose-500', link: '/jobs' },
    { label: 'Startup Ideas', value: stats.ideas, icon: '💡', color: 'from-blue-500 to-cyan-500', link: '/ideas' },
    { label: role === 'admin' ? 'Total Users' : 'Profile Views', value: role === 'admin' ? stats.users : profileViews, icon: role === 'admin' ? '👥' : '👁️', color: 'from-green-500 to-emerald-500', link: '/profile' },
  ];

  const tabs = role === 'recruiter'
    ? [{ id: 'overview', label: 'Overview', icon: '📊' }, { id: 'my-jobs', label: 'My Jobs', icon: '💼' }, { id: 'applicants', label: 'Applicants', icon: '📝' }, { id: 'analytics', label: 'Analytics', icon: '📈' }]
    : [{ id: 'overview', label: 'Overview', icon: '📊' }, { id: 'applications', label: 'Applications', icon: '📋' }, { id: 'recommendations', label: 'AI Recommendations', icon: '🤖' }, { id: 'saved', label: 'Saved Jobs', icon: '⭐' }];

  // Calculate total applicants for recruiters
  const totalApplicants = Object.values(jobApplicants).flat().length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {getGreeting()}, {user?.first_name || user?.username}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back to your {role === 'admin' ? 'admin' : role === 'recruiter' ? 'recruiter' : 'job seeker'} dashboard
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} whileHover={{ scale: 1.02, y: -5 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl p-6 cursor-pointer group" onClick={() => navigate(stat.link)}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl shadow-lg`}>{stat.icon}</div>
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + index * 0.1, type: 'spring' }} className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</motion.span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mb-6">
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${role === 'admin' ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' : role === 'recruiter' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white'}`}>
            {role === 'admin' && '👑 Admin'}{role === 'recruiter' && '🏢 Recruiter'}{role === 'seeker' && '👔 Job Seeker'}
          </span>
        </motion.div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-6 overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === 'saved' && role === 'seeker') { fetchSavedJobs(); }}} className={`flex items-center gap-2 px-6 py-4 font-semibold whitespace-nowrap transition-all ${activeTab === tab.id ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400 bg-violet-50 dark:bg-violet-900/20' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                <span>{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
            {activeTab === 'overview' && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{role === 'seeker' ? 'Recent Applications' : role === 'recruiter' ? 'My Posted Jobs' : 'Recent Jobs'}</h3>
                    <Link to="/jobs" className="text-violet-600 dark:text-violet-400 font-medium hover:underline">View All</Link>
                  </div>
{loading ? (
                    <Loader type="list" count={4} />
                  ) : role === 'seeker' ? (
                    <div className="space-y-4">
                      {recentApplications.length > 0 ? recentApplications.slice(0, 4).map((app) => (
                        <div key={app.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <div><h4 className="font-semibold text-gray-900 dark:text-white">{app.job?.title || 'Job Title'}</h4><p className="text-sm text-gray-500 dark:text-gray-400">Applied on {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'N/A'}</p></div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[app.status] || statusColors.pending}`}>{app.status || 'Pending'}</span>
                        </div>
                      )) : (
                        <div className="text-center py-8"><div className="text-4xl mb-2">📋</div><p className="text-gray-500 dark:text-gray-400">No applications yet</p><Link to="/jobs" className="text-violet-600 font-medium hover:underline mt-2 inline-block">Browse Jobs →</Link></div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentJobs.length > 0 ? recentJobs.slice(0, 4).map((job) => (
                        <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <div><h4 className="font-semibold text-gray-900 dark:text-white">{job.title}</h4><p className="text-sm text-gray-500 dark:text-gray-400">{job.company_name || 'My Company'} • Posted {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Recently'}</p></div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[job.status] || statusColors.active}`}>{job.status || 'Active'}</span>
                        </div>
                      )) : (
                        <div className="text-center py-8"><div className="text-4xl mb-2">💼</div><p className="text-gray-500 dark:text-gray-400">No jobs posted yet</p><button onClick={() => setShowCreateJobModal(true)} className="text-violet-600 font-medium hover:underline mt-2">Post a Job →</button></div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: '🔍', label: 'Browse Jobs', link: '/jobs', color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400' },
                      { icon: '💡', label: 'Explore Ideas', link: '/ideas', color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' },
                      { icon: '📤', label: role === 'seeker' ? 'Upload Resume' : 'Post Job', action: () => role !== 'seeker' ? setShowCreateJobModal(true) : navigate('/profile'), color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
                      { icon: '👤', label: 'Edit Profile', link: '/profile', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
                    ].map((action) => (
                      <motion.button key={action.label} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={action.action || (() => navigate(action.link))} className={`p-4 rounded-xl ${action.color} font-semibold hover:shadow-lg transition-all text-left flex items-center gap-3`}>
                        <span className="text-2xl">{action.icon}</span>{action.label}
                      </motion.button>
                    ))}
                  </div>
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">📊 Your Stats</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <span className="text-gray-700 dark:text-gray-300">Total Jobs Posted</span>
                        <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">{stats.jobs}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <span className="text-gray-700 dark:text-gray-300">Total Applicants</span>
                        <span className="text-sm font-semibold text-pink-600 dark:text-pink-400">{totalApplicants}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'my-jobs' && role === 'recruiter' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">My Posted Jobs</h3>
                  <button onClick={() => setShowCreateJobModal(true)} className="px-4 py-2 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors">+ Post New Job</button>
                </div>
                {recentJobs.length > 0 ? (
                  <div className="space-y-4">
                    {recentJobs.map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div className="flex-1"><h4 className="font-semibold text-gray-900 dark:text-white">{job.title}</h4><p className="text-sm text-gray-500 dark:text-gray-400">Posted {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Recently'} • {(jobApplicants[job.id] || []).length} applicants</p></div>
                        <div className="flex items-center gap-3">
                          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[job.status] || statusColors.active}`}>{job.status || 'Active'}</span>
                          <button className="p-2 text-gray-500 hover:text-violet-600 transition-colors">✏️</button>
                          <button className="p-2 text-gray-500 hover:text-red-600 transition-colors">🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12"><div className="text-6xl mb-4">💼</div><h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No jobs posted yet</h4><p className="text-gray-500 dark:text-gray-400 mb-4">Post your first job to attract candidates</p><button onClick={() => setShowCreateJobModal(true)} className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors">Post a Job</button></div>
                )}
              </div>
            )}

            {activeTab === 'applicants' && role === 'recruiter' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Job Applicants</h3>
                {recentJobs.length > 0 ? (
                  <div className="space-y-6">
                    {recentJobs.map((job) => (
                      <div key={job.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{job.title} ({(jobApplicants[job.id] || []).length} applicants)</h4>
                        {(jobApplicants[job.id] || []).length > 0 ? (
                          <div className="space-y-3">
                            {(jobApplicants[job.id] || []).map((app) => (
                              <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div><h5 className="font-medium text-gray-900 dark:text-white">{app.seeker?.username || 'Applicant'}</h5><p className="text-sm text-gray-500 dark:text-gray-400">Applied {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recently'}</p></div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[app.status] || statusColors.pending}`}>{app.status || 'Pending'}</span>
                                  <button onClick={() => applicationsAPI.updateStatus(app.id, 'interview')} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-200">Interview</button>
                                  <button onClick={() => applicationsAPI.updateStatus(app.id, 'rejected')} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-200">Reject</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">No applicants yet</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12"><div className="text-6xl mb-4">📝</div><h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No jobs posted yet</h4><p className="text-gray-500 dark:text-gray-400">Post jobs to receive applicants</p></div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && role === 'recruiter' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Analytics</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-xl p-6">
                    <div className="text-3xl mb-2">💼</div>
                    <div className="text-3xl font-bold text-violet-600 dark:text-violet-400">{stats.jobs}</div>
                    <div className="text-gray-600 dark:text-gray-400">Total Jobs</div>
                  </div>
                  <div className="bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-xl p-6">
                    <div className="text-3xl mb-2">📝</div>
                    <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">{totalApplicants}</div>
                    <div className="text-gray-600 dark:text-gray-400">Total Applicants</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl p-6">
                    <div className="text-3xl mb-2">✅</div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">{Object.values(jobApplicants).flat().filter(a => a.status === 'hired' || a.status === 'accepted').length}</div>
                    <div className="text-gray-600 dark:text-gray-400">Hired</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'applications' && role === 'seeker' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">My Applications</h3>
                {recentApplications.length > 0 ? (
                  <div className="space-y-4">
                    {recentApplications.map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div className="flex-1"><h4 className="font-semibold text-gray-900 dark:text-white">{app.job?.title || 'Job Title'}</h4><p className="text-sm text-gray-500 dark:text-gray-400">Applied on {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'N/A'}</p></div>
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold capitalize ${statusColors[app.status] || statusColors.pending}`}>{app.status || 'Pending'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12"><div className="text-6xl mb-4">📋</div><h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No applications yet</h4><p className="text-gray-500 dark:text-gray-400 mb-4">Start applying for jobs</p><Link to="/jobs" className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700">Browse Jobs</Link></div>
                )}
              </div>
            )}

            {activeTab === 'recommendations' && role === 'seeker' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6"><span className="text-3xl">🤖</span><h3 className="text-xl font-bold text-gray-900 dark:text-white">AI-Powered Recommendations</h3></div>
                <div className="text-center py-12"><div className="text-6xl mb-4">🎯</div><h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Personalized Job Matches</h4><p className="text-gray-500 dark:text-gray-400 mb-4">Complete your profile to get AI recommendations</p><Link to="/profile" className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700">Complete Profile</Link></div>
              </div>
            )}

            {activeTab === 'saved' && role === 'seeker' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Saved Jobs</h3>
                {savedLoading ? (
                  <div className="flex justify-center py-8"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full" /></div>
                ) : savedJobs.length > 0 ? (
                  <div className="space-y-4">
                    {savedJobs.map((savedJob) => (
                      <div key={savedJob.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{savedJob.job?.title || 'Job Title'}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{savedJob.job?.company_name || 'Company'} • Saved {savedJob.saved_at ? new Date(savedJob.saved_at).toLocaleDateString() : 'Recently'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[savedJob.job?.status] || statusColors.active}`}>{savedJob.job?.status || 'Active'}</span>
                          <Link to={`/jobs`} className="px-4 py-2 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors">View</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12"><div className="text-6xl mb-4">⭐</div><h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No saved jobs yet</h4><p className="text-gray-500 dark:text-gray-400 mb-4">Save jobs you're interested in</p><Link to="/jobs" className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700">Browse Jobs</Link></div>
                )}
              </div>
            )}

            {activeTab === 'users' && role === 'admin' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">User Management</h3>
                <div className="text-center py-12"><div className="text-6xl mb-4">👥</div><h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">User Management Panel</h4><p className="text-gray-500 dark:text-gray-400">View and manage all users</p></div>
              </div>
            )}

            {activeTab === 'jobs' && role === 'admin' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Job Approvals</h3>
                <div className="text-center py-12"><div className="text-6xl mb-4">✅</div><h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Pending Job Approvals</h4><p className="text-gray-500 dark:text-gray-400">Review and approve job postings</p></div>
              </div>
            )}

            {activeTab === 'ideas' && role === 'admin' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Idea Approvals</h3>
                <div className="text-center py-12"><div className="text-6xl mb-4">💡</div><h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Pending Idea Approvals</h4><p className="text-gray-500 dark:text-gray-400">Review and approve startup ideas</p></div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Create Job Modal */}
        <AnimatePresence>
          {showCreateJobModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateJobModal(false)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {jobSuccess ? (
                  <div className="p-12 text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"><span className="text-4xl">✅</span></motion.div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Job Posted Successfully!</h2>
                    <p className="text-gray-500 dark:text-gray-400">Your job is now live and visible to candidates.</p>
                  </div>
                ) : (
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Post New Job</h2>
                      <button onClick={() => setShowCreateJobModal(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">✕</button>
                    </div>
                    <form onSubmit={handleCreateJob} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Job Title *</label>
                        <input type="text" name="title" value={jobFormData.title} onChange={(e) => setJobFormData({...jobFormData, title: e.target.value})} placeholder="e.g. Senior Frontend Developer" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-violet-500 text-gray-900 dark:text-white" required />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                        <textarea name="description" value={jobFormData.description} onChange={(e) => setJobFormData({...jobFormData, description: e.target.value})} placeholder="Describe the job role..." rows={3} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-violet-500 text-gray-900 dark:text-white resize-none" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Location</label>
                          <input type="text" name="location" value={jobFormData.location} onChange={(e) => setJobFormData({...jobFormData, location: e.target.value})} placeholder="e.g. Remote, NYC" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-violet-500 text-gray-900 dark:text-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Job Type</label>
                          <select name="job_type" value={jobFormData.job_type} onChange={(e) => setJobFormData({...jobFormData, job_type: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-violet-500 text-gray-900 dark:text-white">
                            <option value="full_time">Full Time</option>
                            <option value="part_time">Part Time</option>
                            <option value="contract">Contract</option>
                            <option value="internship">Internship</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Min Salary ($)</label>
                          <input type="number" name="salary_min" value={jobFormData.salary_min} onChange={(e) => setJobFormData({...jobFormData, salary_min: e.target.value})} placeholder="50000" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-violet-500 text-gray-900 dark:text-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Max Salary ($)</label>
                          <input type="number" name="salary_max" value={jobFormData.salary_max} onChange={(e) => setJobFormData({...jobFormData, salary_max: e.target.value})} placeholder="100000" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-violet-500 text-gray-900 dark:text-white" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Required Skills (comma separated)</label>
                        <input type="text" name="skills" value={jobFormData.skills} onChange={(e) => setJobFormData({...jobFormData, skills: e.target.value})} placeholder="e.g. React, TypeScript, Node.js" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-violet-500 text-gray-900 dark:text-white" />
                      </div>
                      <motion.button type="submit" disabled={creatingJob} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-violet-500/30 transition-all disabled:opacity-50">
                        {creatingJob ? 'Posting...' : 'Post Job 🚀'}
                      </motion.button>
                    </form>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;
