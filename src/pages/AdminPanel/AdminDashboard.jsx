import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { jobsAPI, ideasAPI, applicationsAPI, adminAPI, analyticsAPI } from '../../services/api';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Data states
  const [stats, setStats] = useState({
    totalUsers: 0, recruiters: 0, seekers: 0,
    totalJobs: 0, totalApplications: 0,
    totalIdeas: 0, pendingIdeas: 0
  });
  const [pendingJobs, setPendingJobs] = useState([]);
  const [pendingIdeas, setPendingIdeas] = useState([]);
  const [allUsers, setAllUsers] = useState({ recruiters: [], seekers: [] });
  const [reportedIdeas, setReportedIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Analytics data
  const [analytics, setAnalytics] = useState({
    topIdeas: [],
    ideasByCategory: [],
    skills: [],
    monthlyActivity: []
  });

  // User management states
  const [recruiterSearch, setRecruiterSearch] = useState('');
  const [seekerSearch, setSeekerSearch] = useState('');
  const [recruiterFilter, setRecruiterFilter] = useState('all');
  const [seekerFilter, setSeekerFilter] = useState('all');
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);
  const [selectedSeeker, setSelectedSeeker] = useState(null);
  const [adminLogo, setAdminLogo] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch analytics
      try {
        const [dashRes, jobsRes, ideasRes, skillsRes] = await Promise.all([
          analyticsAPI.dashboard(),
          analyticsAPI.jobs(),
          analyticsAPI.ideas(),
          analyticsAPI.skills()
        ]);
        
        const dashData = dashRes.data;
        setStats({
          totalUsers: dashData.users?.total || 0,
          recruiters: dashData.users?.recruiters || 0,
          seekers: dashData.users?.seekers || 0,
          totalJobs: dashData.jobs?.total || 0,
          totalApplications: dashData.applications?.total || 0,
          totalIdeas: dashData.ideas?.total || 0,
          pendingIdeas: dashData.ideas?.pending || 0
        });
        
        setAnalytics({
          topIdeas: ideasRes.data.top_ideas || [],
          ideasByCategory: ideasRes.data.ideas_by_category || [],
          skills: skillsRes.data.top_demanded_skills || [],
          monthlyActivity: ideasRes.data.ideas_by_month || []
        });
      } catch (e) {
        console.log('Analytics not available');
      }

      // Fetch pending jobs
      try {
        const jobsRes = await jobsAPI.pending();
        setPendingJobs(Array.isArray(jobsRes.data) ? jobsRes.data : jobsRes.data.results || []);
      } catch (e) {
        setPendingJobs([]);
      }

      // Fetch pending ideas
      try {
        const ideasRes = await ideasAPI.pending();
        setPendingIdeas(Array.isArray(ideasRes.data) ? ideasRes.data : ideasRes.data.results || []);
      } catch (e) {
        setPendingIdeas([]);
      }

      // Fetch all users
      try {
        const usersRes = await adminAPI.getUsers();
        const users = usersRes.data.results || usersRes.data || [];
        setAllUsers({
          recruiters: users.filter(u => u.role === 'recruiter'),
          seekers: users.filter(u => u.role === 'seeker')
        });
      } catch (e) {
        setAllUsers({ recruiters: [], seekers: [] });
      }

      // Fetch reported ideas
      try {
        const reportedRes = await adminAPI.getReportedIdeas();
        setReportedIdeas(Array.isArray(reportedRes.data) ? reportedRes.data : reportedRes.data.results || []);
      } catch (e) {
        setReportedIdeas([]);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveJob = async (jobId) => {
    try {
      await jobsAPI.approve(jobId);
      setPendingJobs(pendingJobs.filter(j => j.id !== jobId));
      setStats(prev => ({ ...prev, totalJobs: prev.totalJobs + 1 }));
    } catch (err) {
      console.error('Error approving job:', err);
      alert('Failed to approve job');
    }
  };

  const handleRejectJob = async (jobId) => {
    try {
      await jobsAPI.reject(jobId);
      setPendingJobs(pendingJobs.filter(j => j.id !== jobId));
    } catch (err) {
      console.error('Error rejecting job:', err);
      alert('Failed to reject job');
    }
  };

  const handleApproveIdea = async (ideaId) => {
    try {
      await ideasAPI.approve(ideaId);
      setPendingIdeas(pendingIdeas.filter(i => i.id !== ideaId));
      setStats(prev => ({ ...prev, totalIdeas: prev.totalIdeas + 1 }));
    } catch (err) {
      console.error('Error approving idea:', err);
      alert('Failed to approve idea');
    }
  };

  const handleRejectIdea = async (ideaId) => {
    try {
      await ideasAPI.reject(ideaId);
      setPendingIdeas(pendingIdeas.filter(i => i.id !== ideaId));
    } catch (err) {
      console.error('Error rejecting idea:', err);
      alert('Failed to reject idea');
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      await adminAPI.blockUser(userId);
      fetchDashboardData();
    } catch (err) {
      console.error('Error blocking user:', err);
      alert('Failed to block user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await adminAPI.deleteUser(userId);
      fetchDashboardData();
      setSelectedRecruiter(null);
      setSelectedSeeker(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    }
  };

  const handleRemoveReportedIdea = async (ideaId) => {
    try {
      await adminAPI.removeIdea(ideaId);
      setReportedIdeas(reportedIdeas.filter(i => i.id !== ideaId));
    } catch (err) {
      console.error('Error removing idea:', err);
      alert('Failed to remove idea');
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdminLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter users based on search and filter
  const filteredRecruiters = allUsers.recruiters.filter(r => {
    const matchesSearch = !recruiterSearch || 
      r.username?.toLowerCase().includes(recruiterSearch.toLowerCase()) ||
      r.email?.toLowerCase().includes(recruiterSearch.toLowerCase());
    const matchesFilter = recruiterFilter === 'all' || 
      (recruiterFilter === 'blocked' && r.is_blocked) ||
      (recruiterFilter === 'active' && !r.is_blocked);
    return matchesSearch && matchesFilter;
  });

  const filteredSeekers = allUsers.seekers.filter(s => {
    const matchesSearch = !seekerSearch || 
      s.username?.toLowerCase().includes(seekerSearch.toLowerCase()) ||
      s.email?.toLowerCase().includes(seekerSearch.toLowerCase());
    const matchesFilter = seekerFilter === 'all' || 
      (seekerFilter === 'blocked' && s.is_blocked) ||
      (seekerFilter === 'active' && !s.is_blocked);
    return matchesSearch && matchesFilter;
  });

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Manage Users', icon: '👥' },
    { id: 'jobs', label: 'Job Approvals', icon: '💼', badge: pendingJobs.length },
    { id: 'ideas', label: 'Idea Approvals', icon: '💡', badge: pendingIdeas.length },
    { id: 'reported', label: 'Reported Ideas', icon: '🚨', badge: reportedIdeas.length },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Sidebar - No Navbar */}
      <div className={`fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Admin Logo Section */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col items-center">
            <label className="cursor-pointer relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center overflow-hidden border-4 border-violet-200 dark:border-violet-800">
                {adminLogo ? (
                  <img src={adminLogo} alt="Admin Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">👑</span>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-white text-sm shadow-lg">
                📷
              </div>
            </label>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-3">Admin Panel</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">System Administration</p>
          </div>
        </div>
        
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-280px)]">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === item.id
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                {item.label}
              </div>
              {item.badge > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          >
            <span className="text-xl">🚪</span>
            Logout
          </button>
        </div>
      </div>

      {/* Mobile menu toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed left-4 top-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg lg:hidden"
      >
        <span className="text-xl">{sidebarOpen ? '✕' : '☰'}</span>
      </button>

      {/* Main Content */}
      <div className="lg:ml-72 px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 pt-8 lg:pt-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard 👑
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Manage your job portal platform
          </p>
        </motion.div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-xl">👥</div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Users</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center text-xl">💼</div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalJobs}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Jobs</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-xl">📝</div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalApplications}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Applications</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center text-xl">💡</div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalIdeas}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Startup Ideas</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid lg:grid-cols-3 gap-6">
              <button onClick={() => setActiveTab('users')} className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-4xl mb-3">👥</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Manage Users</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stats.recruiters} Recruiters, {stats.seekers} Seekers</p>
              </button>
              <button onClick={() => setActiveTab('jobs')} className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-4xl mb-3">💼</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Job Approvals</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{pendingJobs.length} pending</p>
              </button>
              <button onClick={() => setActiveTab('ideas')} className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-4xl mb-3">💡</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Idea Approvals</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{pendingIdeas.length} pending</p>
              </button>
            </div>
          </motion.div>
        )}

        {/* Users Tab - Enhanced Manage Users */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recruiters Management */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    👨‍💼 Manage Recruiters ({filteredRecruiters.length})
                  </h3>
                </div>
                
                {/* Search and Filter */}
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2">🔍</span>
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={recruiterSearch}
                      onChange={(e) => setRecruiterSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm"
                    />
                  </div>
                  <select
                    value={recruiterFilter}
                    onChange={(e) => setRecruiterFilter(e.target.value)}
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>

                {/* Recruiters Table */}
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Name</th>
                        <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Email</th>
                        <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Status</th>
                        <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecruiters.map((recruiter) => (
                        <tr key={recruiter.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{recruiter.username}</td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{recruiter.email}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${recruiter.is_blocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                              {recruiter.is_blocked ? 'Blocked' : 'Active'}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => setSelectedRecruiter(recruiter)}
                              className="text-blue-600 hover:underline mr-2"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleBlockUser(recruiter.id)}
                              className={`mr-2 ${recruiter.is_blocked ? 'text-green-600' : 'text-red-600'} hover:underline`}
                            >
                              {recruiter.is_blocked ? 'Unblock' : 'Block'}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredRecruiters.length === 0 && (
                        <tr>
                          <td colSpan="4" className="text-center py-4 text-gray-500">No recruiters found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Job Seekers Management */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    👩‍🎓 Manage Job Seekers ({filteredSeekers.length})
                  </h3>
                </div>
                
                {/* Search and Filter */}
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2">🔍</span>
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={seekerSearch}
                      onChange={(e) => setSeekerSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm"
                    />
                  </div>
                  <select
                    value={seekerFilter}
                    onChange={(e) => setSeekerFilter(e.target.value)}
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>

                {/* Seekers Table */}
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Name</th>
                        <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Email</th>
                        <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Status</th>
                        <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSeekers.map((seeker) => (
                        <tr key={seeker.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{seeker.username}</td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{seeker.email}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${seeker.is_blocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                              {seeker.is_blocked ? 'Blocked' : 'Active'}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => setSelectedSeeker(seeker)}
                              className="text-blue-600 hover:underline mr-2"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleBlockUser(seeker.id)}
                              className={`mr-2 ${seeker.is_blocked ? 'text-green-600' : 'text-red-600'} hover:underline`}
                            >
                              {seeker.is_blocked ? 'Unblock' : 'Block'}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredSeekers.length === 0 && (
                        <tr>
                          <td colSpan="4" className="text-center py-4 text-gray-500">No job seekers found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Recruiter Detail Modal */}
            {selectedRecruiter && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedRecruiter(null)}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recruiter Details</h3>
                    <button onClick={() => setSelectedRecruiter(null)} className="text-gray-500 hover:text-gray-700">✕</button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Username:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedRecruiter.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedRecruiter.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${selectedRecruiter.is_blocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {selectedRecruiter.is_blocked ? 'Blocked' : 'Active'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Joined:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedRecruiter.date_joined ? new Date(selectedRecruiter.date_joined).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={() => handleBlockUser(selectedRecruiter.id)}
                      className={`flex-1 py-2 rounded-xl font-medium ${selectedRecruiter.is_blocked ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                    >
                      {selectedRecruiter.is_blocked ? 'Unblock' : 'Block'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(selectedRecruiter.id)}
                      className="flex-1 py-2 bg-red-100 text-red-600 rounded-xl font-medium hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Seeker Detail Modal */}
            {selectedSeeker && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedSeeker(null)}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Job Seeker Details</h3>
                    <button onClick={() => setSelectedSeeker(null)} className="text-gray-500 hover:text-gray-700">✕</button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Username:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedSeeker.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedSeeker.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${selectedSeeker.is_blocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {selectedSeeker.is_blocked ? 'Blocked' : 'Active'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Joined:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedSeeker.date_joined ? new Date(selectedSeeker.date_joined).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={() => handleBlockUser(selectedSeeker.id)}
                      className={`flex-1 py-2 rounded-xl font-medium ${selectedSeeker.is_blocked ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                    >
                      {selectedSeeker.is_blocked ? 'Unblock' : 'Block'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(selectedSeeker.id)}
                      className="flex-1 py-2 bg-red-100 text-red-600 rounded-xl font-medium hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Job Approvals ({pendingJobs.length} pending)
              </h3>
              {pendingJobs.length > 0 ? (
                <div className="space-y-4">
                  {pendingJobs.map((job) => (
                    <div key={job.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{job.title}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {job.company_name || 'Company'} • {job.location}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                            {job.description?.slice(0, 200)}...
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button 
                            onClick={() => handleApproveJob(job.id)} 
                            className="px-4 py-2 bg-green-100 text-green-600 rounded-xl font-medium hover:bg-green-200"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleRejectJob(job.id)} 
                            className="px-4 py-2 bg-red-100 text-red-600 rounded-xl font-medium hover:bg-red-200"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">✅</div>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No pending jobs</h4>
                  <p className="text-gray-500 dark:text-gray-400">All jobs have been reviewed</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Ideas Tab */}
        {activeTab === 'ideas' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Startup Idea Approvals ({pendingIdeas.length} pending)
              </h3>
              {pendingIdeas.length > 0 ? (
                <div className="space-y-4">
                  {pendingIdeas.map((idea) => (
                    <div key={idea.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{idea.title}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {idea.category} • by {idea.author?.username || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                            {idea.problem_statement?.slice(0, 200)}...
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button 
                            onClick={() => handleApproveIdea(idea.id)} 
                            className="px-4 py-2 bg-green-100 text-green-600 rounded-xl font-medium hover:bg-green-200"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleRejectIdea(idea.id)} 
                            className="px-4 py-2 bg-red-100 text-red-600 rounded-xl font-medium hover:bg-red-200"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">✅</div>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No pending ideas</h4>
                  <p className="text-gray-500 dark:text-gray-400">All ideas have been reviewed</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Reported Ideas Tab */}
        {activeTab === 'reported' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Reported Startup Ideas ({reportedIdeas.length})
              </h3>
              {reportedIdeas.length > 0 ? (
                <div className="space-y-4">
                  {reportedIdeas.map((idea) => (
                    <div key={idea.id} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{idea.title}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {idea.category} • by {idea.author?.username || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                            {idea.problem_statement?.slice(0, 200)}...
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button 
                            onClick={() => handleRemoveReportedIdea(idea.id)} 
                            className="px-4 py-2 bg-red-100 text-red-600 rounded-xl font-medium hover:bg-red-200"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">✅</div>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No reported ideas</h4>
                  <p className="text-gray-500 dark:text-gray-400">All ideas are clean</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Most Voted Startup Ideas */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Most-Voted Startup Ideas</h3>
                <div className="space-y-3">
                  {analytics.topIdeas.map((idea, idx) => (
                    <div key={idea.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">{idea.title}</span>
                      </div>
                      <span className="text-sm text-gray-500">{idea.vote_score} votes</span>
                    </div>
                  ))}
                  {analytics.topIdeas.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No ideas yet</p>
                  )}
                </div>
              </div>

              {/* Trending Startup Domains */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Trending Startup Domains</h3>
                <div className="space-y-3">
                  {analytics.ideasByCategory.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <span className="font-medium text-gray-900 dark:text-white">{cat.category}</span>
                      <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-sm">
                        {cat.count} ideas
                      </span>
                    </div>
                  ))}
                  {analytics.ideasByCategory.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No data available</p>
                  )}
                </div>
              </div>

              {/* Skill Demand Analytics */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Skill Demand Analytics</h3>
                <div className="space-y-3">
                  {analytics.skills.slice(0, 10).map((skill, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <span className="font-medium text-gray-900 dark:text-white">{skill.skill}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-violet-500 rounded-full" 
                            style={{ width: `${(skill.count / (analytics.skills[0]?.count || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500">{skill.count}</span>
                      </div>
                    </div>
                  ))}
                  {analytics.skills.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No skills data available</p>
                  )}
                </div>
              </div>

              {/* Monthly Activity */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Monthly Activity (Ideas)</h3>
                <div className="space-y-3">
                  {analytics.monthlyActivity.map((month, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <span className="font-medium text-gray-900 dark:text-white">{month.month}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ width: `${(month.count / (analytics.monthlyActivity[0]?.count || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500">{month.count}</span>
                      </div>
                    </div>
                  ))}
                  {analytics.monthlyActivity.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No activity data</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
