import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { applicationsAPI, jobsAPI } from '../services/api';

const MyApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await applicationsAPI.myApplications();
      const appsData = Array.isArray(response.data) ? response.data : response.data.results || [];
      setApplications(appsData);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (appId) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;
    try {
      await applicationsAPI.updateStatus(appId, 'withdrawn');
      fetchApplications();
    } catch (err) {
      console.error('Error withdrawing application:', err);
      alert('Failed to withdraw application');
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    interview: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    offered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    withdrawn: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
  };

  const tabs = [
    { id: 'all', label: 'All Applications', count: applications.length },
    { id: 'pending', label: 'Pending', count: applications.filter(a => a.status === 'pending' || a.status === 'applied').length },
    { id: 'interview', label: 'Interview', count: applications.filter(a => a.status === 'interview').length },
    { id: 'accepted', label: 'Accepted', count: applications.filter(a => a.status === 'accepted' || a.status === 'offered').length },
    { id: 'rejected', label: 'Rejected', count: applications.filter(a => a.status === 'rejected' || a.status === 'withdrawn').length },
  ];

  const filteredApps = activeTab === 'all' 
    ? applications 
    : activeTab === 'pending' 
    ? applications.filter(a => a.status === 'pending' || a.status === 'applied')
    : activeTab === 'interview'
    ? applications.filter(a => a.status === 'interview')
    : activeTab === 'accepted'
    ? applications.filter(a => a.status === 'accepted' || a.status === 'offered')
    : applications.filter(a => a.status === 'rejected' || a.status === 'withdrawn');

  const applicationStats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending' || a.status === 'applied').length,
    interview: applications.filter(a => a.status === 'interview').length,
    accepted: applications.filter(a => a.status === 'accepted' || a.status === 'offered').length,
    rejected: applications.filter(a => a.status === 'rejected' || a.status === 'withdrawn').length,
  };

  const getJobTitle = (app) => {
    return app.job_details?.title || app.job?.title || app.job_title || 'Job Title';
  };

  const getCompanyName = (app) => {
    return app.job_details?.company_name || app.company_name || app.job?.company_name || app.job?.company?.name || 'Company';
  };

  const getLocation = (app) => {
    return app.job_details?.location || app.job?.location || 'Location';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            My Applications 📋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track the status of your job applications
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{applicationStats.total}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{applicationStats.pending}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{applicationStats.interview}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Interview</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{applicationStats.accepted}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Accepted</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{applicationStats.rejected}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Rejected</div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-6 overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-4 font-semibold whitespace-nowrap transition-all ${activeTab === tab.id ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400 bg-violet-50 dark:bg-violet-900/20' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                <span>{tab.label}</span>
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded-full">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" /></div>
          ) : filteredApps.length > 0 ? (
            <div className="space-y-4">
              {filteredApps.map((app) => (
                <motion.div key={app.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{getJobTitle(app)}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{getCompanyName(app)} • {getLocation(app)}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>📅 Applied {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recently'}</span>
                        {app.match_score && <span>🤖 Match: {Math.round(app.match_score)}%</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold capitalize ${statusColors[app.status] || statusColors.pending}`}>
                        {app.status || 'Pending'}
                      </span>
                      {app.status !== 'withdrawn' && app.status !== 'rejected' && app.status !== 'accepted' && (
                        <button onClick={() => handleWithdraw(app.id)} className="text-sm text-red-500 hover:text-red-700 font-medium">
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                  {app.notes && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300">📝 {app.notes}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {activeTab === 'all' ? 'No applications yet' : `No ${activeTab} applications`}
              </h4>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {activeTab === 'all' ? 'Start applying for jobs to track your applications here' : `You don't have any ${activeTab} applications`}
              </p>
              <Link to="/jobs" className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700">Browse Jobs</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyApplications;
