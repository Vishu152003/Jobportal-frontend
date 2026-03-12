import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { jobsAPI, applicationsAPI, ideasAPI, companyAPI, chatAPI } from '../services/api';

const RecruiterDashboard = () => {
  const { user, logout } = useAuth();
  const [myJobs, setMyJobs] = useState([]);
  const [allApplicants, setAllApplicants] = useState([]);
  const [myIdeas, setMyIdeas] = useState([]);
  const [allIdeasCount, setAllIdeasCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(null);
  const [showEditJobModal, setShowEditJobModal] = useState(null);
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  
  // Chat related state
  const [eligibleCandidates, setEligibleCandidates] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [showChatModal, setShowChatModal] = useState(null);
  const [showInterviewModal, setShowInterviewModal] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    interview_date: '',
    interview_time: '',
    interview_mode: 'online',
    meeting_link: '',
    hr_contact: '',
    required_documents: '',
    interview_notes: ''
  });
  
  const [creating, setCreating] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });
  
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    salary_min: '',
    salary_max: '',
    job_type: 'full_time',
    experience_level: 'mid',
    skills: '',
    application_deadline: '',
  });
  const [ideaForm, setIdeaForm] = useState({
    title: '',
    problem_statement: '',
    solution: '',
    target_audience: '',
    business_model: '',
    category: 'technology',
  });
  const [companyForm, setCompanyForm] = useState({
    name: '',
    description: '',
    website: '',
    location: '',
    industry: '',
    founded_year: '',
    company_size: '',
    logo: null,
    logoUrl: null, // Store the logo URL from API
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingCompany, setEditingCompany] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyJobs();
    fetchCompanyData();
    fetchMyIdeas();
    fetchAllIdeasCount();
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

  const fetchCompanyData = async () => {
    try {
      const response = await companyAPI.get();
      if (response.data) {
        setCompanyForm({
          name: response.data.name || '',
          description: response.data.description || '',
          website: response.data.website || '',
          location: response.data.location || '',
          industry: response.data.industry || '',
          founded_year: response.data.founded_year || '',
          company_size: response.data.company_size || '',
          logo: null,
          logoUrl: response.data.logo || null,
        });
      }
    } catch (err) {
      console.error('Error fetching company:', err);
    }
  };

  const fetchMyIdeas = async () => {
    try {
      const response = await ideasAPI.myIdeas();
      setMyIdeas(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (err) {
      console.error('Error fetching ideas:', err);
      setMyIdeas([]);
    }
  };

  const fetchAllIdeasCount = async () => {
    try {
      // Fetch all approved ideas for stats
      const response = await ideasAPI.list({ page_size: 1 });
      if (response.data && response.data.count !== undefined) {
        setAllIdeasCount(response.data.count);
      } else if (Array.isArray(response.data)) {
        setAllIdeasCount(response.data.length);
      } else if (Array.isArray(response.data.results)) {
        setAllIdeasCount(response.data.results.length);
      }
    } catch (err) {
      console.error('Error fetching all ideas count:', err);
      setAllIdeasCount(0);
    }
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setSavingCompany(true);
    try {
      const formData = new FormData();
      Object.keys(companyForm).forEach(key => {
        if (key === 'logo' && companyForm.logo instanceof File) {
          formData.append('logo', companyForm.logo);
        } else if (companyForm[key] !== null && companyForm[key] !== '') {
          formData.append(key, companyForm[key]);
        }
      });
      await companyAPI.update(formData);
      
      // Show success message directly
      setMessage({ type: 'success', text: 'Company profile updated successfully!' });
      
      // Refresh company data and switch to view mode
      await fetchCompanyData();
      setEditingCompany(false);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (err) {
      console.error('Error saving company:', err);
      setMessage({ type: 'error', text: 'Failed to update company profile' });
    } finally {
      setSavingCompany(false);
    }
  };

  const handleCreateIdea = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await ideasAPI.create(ideaForm);
      setSuccess(true);
      setTimeout(() => {
        setShowIdeaModal(false);
        setSuccess(false);
        setIdeaForm({ title: '', problem_statement: '', solution: '', target_audience: '', business_model: '', category: 'technology' });
        fetchMyIdeas();
      }, 2000);
    } catch (err) {
      console.error('Error creating idea:', err);
      alert('Failed to submit idea');
    } finally {
      setCreating(false);
    }
  };

  const handleEditJob = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const jobData = {
        ...jobForm,
        skills: jobForm.skills.split(',').map(s => s.trim()).filter(s => s),
        salary_min: jobForm.salary_min ? parseInt(jobForm.salary_min) : null,
        salary_max: jobForm.salary_max ? parseInt(jobForm.salary_max) : null,
      };
      await jobsAPI.update(showEditJobModal.id, jobData);
      setShowEditJobModal(null);
      fetchMyJobs();
      alert('Job updated successfully!');
    } catch (err) {
      console.error('Error updating job:', err);
      alert('Failed to update job');
    } finally {
      setCreating(false);
    }
  };

  const openEditJobModal = (job) => {
    setJobForm({
      title: job.title || '',
      description: job.description || '',
      requirements: job.requirements || '',
      location: job.location || '',
      salary_min: job.salary_min || '',
      salary_max: job.salary_max || '',
      job_type: job.job_type || 'full_time',
      experience_level: job.experience_level || 'mid',
      skills: Array.isArray(job.skills) ? job.skills.join(', ') : '',
      application_deadline: job.application_deadline || '',
    });
    setShowEditJobModal(job);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCompanyForm(prev => ({ ...prev, logo: file }));
    }
  };

  const fetchMyJobs = async () => {
    setLoading(true);
    try {
      // First get all jobs
      const response = await jobsAPI.myJobs();
      const jobsData = Array.isArray(response.data) ? response.data : response.data.results || [];
      setMyJobs(jobsData);
      
      // Then get all applicants for all jobs in one call using the new endpoint
      // This returns full applicant details including skills, phone, location, etc.
      try {
        const appsResponse = await applicationsAPI.myJobApplicants();
        const allAppsData = Array.isArray(appsResponse.data) ? appsResponse.data : appsResponse.data.results || [];
        
        // Map job titles to applications
        const jobsMap = {};
        jobsData.forEach(job => {
          jobsMap[job.id] = job;
        });
        
        const allApps = allAppsData.map(app => {
          const job = jobsMap[app.job] || {};
          return { 
            ...app, 
            jobTitle: job.title || 'Unknown Job', 
            jobId: app.job 
          };
        });
        
        setAllApplicants(allApps);
      } catch (appsErr) {
        console.error('Error fetching applicants:', appsErr);
        setAllApplicants([]);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setMyJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const jobData = {
        ...jobForm,
        skills: jobForm.skills.split(',').map(s => s.trim()).filter(s => s),
        salary_min: jobForm.salary_min ? parseInt(jobForm.salary_min) : null,
        salary_max: jobForm.salary_max ? parseInt(jobForm.salary_max) : null,
      };
      await jobsAPI.create(jobData);
      setSuccess(true);
      setJobForm({ title: '', description: '', requirements: '', location: '', salary_min: '', salary_max: '', job_type: 'full_time', experience_level: 'mid', skills: '', application_deadline: '' });
      await fetchMyJobs();
      setActiveTab('my-jobs');
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error('Error creating job:', err);
      alert('Failed to create job');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      await jobsAPI.delete(jobId);
      fetchMyJobs();
    } catch (err) {
      console.error('Error deleting job:', err);
      alert('Failed to delete job');
    }
  };

  const handleUpdateStatus = async (appId, status) => {
    try {
      await applicationsAPI.updateStatus(appId, status);
      fetchMyJobs();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  // Stats calculations
  const totalJobs = myJobs.length;
  const totalApplicants = allApplicants.length;
  const totalIdeas = allIdeasCount; // Use real-time count from all approved ideas
  const shortlistedCandidates = allApplicants.filter(a => a.status === 'interview' || a.status === 'accepted' || a.status === 'offered').length;
  const rejectedCandidates = allApplicants.filter(a => a.status === 'rejected').length;
  const pendingApplications = allApplicants.filter(a => !a.status || a.status === 'pending' || a.status === 'applied').length;

const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'post-job', label: 'Post Job', icon: '➕' },
    { id: 'my-jobs', label: 'Manage Jobs', icon: '💼' },
    { id: 'applicants', label: 'Applications', icon: '📝' },
    { id: 'chat', label: 'Chat & Interviews', icon: '💬' },
    { id: 'ideas', label: 'Startup Ideas', icon: '💡' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
      case 'offered':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'interview':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
  };

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
            {(companyForm.logo || companyForm.logoUrl) ? (
              <img 
                src={companyForm.logo ? URL.createObjectURL(companyForm.logo) : companyForm.logoUrl} 
                alt="Company Logo" 
                className="w-12 h-12 rounded-xl object-cover shadow-lg" 
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                <span className="text-2xl">🏢</span>
              </div>
            )}
            <div>
              <h2 className={`text-lg font-bold ${textClass}`}>Recruiter Hub</h2>
              <p className={`text-sm ${textMuted}`}>{companyForm.name || 'Manage hiring'}</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${
                activeTab === item.id
                  ? darkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
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
            Welcome back! 👋
          </h1>
          <p className={textMuted}>
            Manage your job postings and candidates
          </p>
        </motion.div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className={`${cardClass} rounded-2xl shadow-lg p-5 border-l-4 border-emerald-500`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textMuted}`}>Active Jobs</p>
                    <p className="text-3xl font-bold text-emerald-600">{totalJobs}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-2xl">💼</div>
                </div>
              </div>
              <div className={`${cardClass} rounded-2xl shadow-lg p-5 border-l-4 border-blue-500`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textMuted}`}>Applications</p>
                    <p className="text-3xl font-bold text-blue-600">{totalApplicants}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-2xl">📝</div>
                </div>
              </div>
              <div className={`${cardClass} rounded-2xl shadow-lg p-5 border-l-4 border-purple-500`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textMuted}`}>Shortlisted</p>
                    <p className="text-3xl font-bold text-purple-600">{shortlistedCandidates}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-2xl">✅</div>
                </div>
              </div>
              <div className={`${cardClass} rounded-2xl shadow-lg p-5 border-l-4 border-orange-500`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textMuted}`}>Pending</p>
                    <p className="text-3xl font-bold text-orange-600">{pendingApplications}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-2xl">⏳</div>
                </div>
              </div>
              <div className={`${cardClass} rounded-2xl shadow-lg p-5 border-l-4 border-yellow-500`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textMuted}`}>Startup Ideas</p>
                    <p className="text-3xl font-bold text-yellow-600">{totalIdeas}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center text-2xl">💡</div>
                </div>
              </div>
            </div>

            {/* Recent Jobs & Quick Actions */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className={`${cardClass} rounded-2xl shadow-lg p-6`}>
                <h3 className={`text-xl font-bold ${textClass} mb-4`}>Recent Job Posts</h3>
                {loading ? (
                  <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>
                ) : myJobs.length > 0 ? (
                  <div className="space-y-3">
                    {myJobs.slice(0, 5).map((job) => (
                      <div key={job.id} className={`flex items-center justify-between p-4 ${bgSecondary} rounded-xl`}>
                        <div>
                          <h4 className={`font-semibold ${textClass}`}>{job.title}</h4>
                          <p className={`text-sm ${textMuted}`}>{job.application_count || 0} applicants • {new Date(job.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${job.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                          {job.status || 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-8 ${textMuted}`}>No jobs posted yet</div>
                )}
              </div>

              <div className={`${cardClass} rounded-2xl shadow-lg p-6`}>
                <h3 className={`text-xl font-bold ${textClass} mb-4`}>Quick Actions</h3>
                <div className="space-y-3">
                  <button onClick={() => setActiveTab('post-job')} className="w-full p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2">
                    <span>➕</span> Post New Job
                  </button>
                  <button onClick={() => setActiveTab('my-jobs')} className={`w-full p-4 ${bgSecondary} ${darkMode ? 'text-gray-300' : 'text-gray-700'} rounded-xl font-semibold transition-colors flex items-center justify-center gap-2`}>
                    <span>📋</span> Manage Jobs
                  </button>
                  <button onClick={() => setActiveTab('applicants')} className={`w-full p-4 ${bgSecondary} ${darkMode ? 'text-gray-300' : 'text-gray-700'} rounded-xl font-semibold transition-colors flex items-center justify-center gap-2`}>
                    <span>👥</span> View All Applicants
                  </button>
                  <button onClick={() => setActiveTab('settings')} className={`w-full p-4 ${bgSecondary} ${darkMode ? 'text-gray-300' : 'text-gray-700'} rounded-xl font-semibold transition-colors flex items-center justify-center gap-2`}>
                    <span>🏢</span> Company Profile
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Post Job Tab */}
        {activeTab === 'post-job' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className={`${cardClass} rounded-2xl shadow-lg p-6`}>
              <h3 className={`text-xl font-bold ${textClass} mb-6`}>Post a New Job</h3>
              <form onSubmit={handleCreateJob} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Job Title *</label>
                    <input type="text" value={jobForm.title} onChange={(e) => setJobForm({...jobForm, title: e.target.value})} placeholder="e.g. Senior Frontend Developer" className={`w-full px-4 py-3 ${inputClass} border rounded-xl focus:outline-none focus:border-emerald-500`} required />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Location</label>
                    <input type="text" value={jobForm.location} onChange={(e) => setJobForm({...jobForm, location: e.target.value})} placeholder="e.g. Remote, NYC" className={`w-full px-4 py-3 ${inputClass} border rounded-xl focus:outline-none focus:border-emerald-500`} />
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Job Description *</label>
                  <textarea value={jobForm.description} onChange={(e) => setJobForm({...jobForm, description: e.target.value})} placeholder="Describe the job role, responsibilities..." rows={4} className={`w-full px-4 py-3 ${inputClass} border rounded-xl focus:outline-none focus:border-emerald-500 resize-none`} required />
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Job Type</label>
                    <select value={jobForm.job_type} onChange={(e) => setJobForm({...jobForm, job_type: e.target.value})} className={`w-full px-4 py-3 ${inputClass} border rounded-xl focus:outline-none focus:border-emerald-500`}>
                      <option value="full_time">Full Time</option>
                      <option value="part_time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                      <option value="remote">Remote</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Experience Level</label>
                    <select value={jobForm.experience_level} onChange={(e) => setJobForm({...jobForm, experience_level: e.target.value})} className={`w-full px-4 py-3 ${inputClass} border rounded-xl focus:outline-none focus:border-emerald-500`}>
                      <option value="entry">Entry Level</option>
                      <option value="mid">Mid Level</option>
                      <option value="senior">Senior Level</option>
                      <option value="lead">Lead/Manager</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Application Deadline</label>
                    <input type="date" value={jobForm.application_deadline} onChange={(e) => setJobForm({...jobForm, application_deadline: e.target.value})} className={`w-full px-4 py-3 ${inputClass} border rounded-xl focus:outline-none focus:border-emerald-500`} />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Min Salary ($)</label>
                    <input type="number" value={jobForm.salary_min} onChange={(e) => setJobForm({...jobForm, salary_min: e.target.value})} placeholder="50000" className={`w-full px-4 py-3 ${inputClass} border rounded-xl focus:outline-none focus:border-emerald-500`} />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Max Salary ($)</label>
                    <input type="number" value={jobForm.salary_max} onChange={(e) => setJobForm({...jobForm, salary_max: e.target.value})} placeholder="100000" className={`w-full px-4 py-3 ${inputClass} border rounded-xl focus:outline-none focus:border-emerald-500`} />
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Required Skills (comma separated)</label>
                  <input type="text" value={jobForm.skills} onChange={(e) => setJobForm({...jobForm, skills: e.target.value})} placeholder="React, Node.js, Python, TypeScript" className={`w-full px-4 py-3 ${inputClass} border rounded-xl focus:outline-none focus:border-emerald-500`} />
                </div>
                <button type="submit" disabled={creating} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50">
                  {creating ? 'Posting...' : 'Post Job 🚀'}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* My Jobs Tab */}
        {activeTab === 'my-jobs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className={`${cardClass} rounded-2xl shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${textClass}`}>Manage Job Posts</h3>
                <button onClick={() => setActiveTab('post-job')} className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors">
                  + Post New Job
                </button>
              </div>
              {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>
              ) : myJobs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${borderClass}`}>
                        <th className={`text-left py-3 px-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Job Title</th>
                        <th className={`text-left py-3 px-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Posted</th>
                        <th className={`text-left py-3 px-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                        <th className={`text-left py-3 px-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Applicants</th>
                        <th className={`text-left py-3 px-4 text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myJobs.map((job) => (
                        <tr key={job.id} className={`border-b ${borderClass}`}>
                          <td className="py-4 px-4">
                            <div>
                              <p className={`font-semibold ${textClass}`}>{job.title}</p>
                              <p className={`text-sm ${textMuted}`}>{job.location || 'No location'}</p>
                            </div>
                          </td>
                          <td className={`py-4 px-4 ${textMuted}`}>{new Date(job.created_at).toLocaleDateString()}</td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${job.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                              {job.status || 'Pending'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-semibold text-emerald-600">{job.application_count || 0}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => setActiveTab('applicants')} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-200">View</button>
                              <button onClick={() => handleDeleteJob(job.id)} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-200">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">💼</div>
                  <h4 className={`text-xl font-semibold ${textClass} mb-2`}>No jobs posted yet</h4>
                  <p className={`${textMuted} mb-4`}>Post your first job to start receiving applications</p>
                  <button onClick={() => setActiveTab('post-job')} className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600">Post a Job</button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Applicants Tab */}
        {activeTab === 'applicants' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className={`${cardClass} rounded-2xl shadow-lg p-6`}>
              <h3 className={`text-xl font-bold ${textClass}`}>Top Candidates ({totalApplicants})</h3>
              
              {allApplicants.length > 0 ? (
                <div className="space-y-4">
                  {allApplicants.map((app) => (
                    <div key={app.id} className={`flex items-center justify-between p-4 ${bgSecondary} rounded-xl`}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full flex items-center justify-center text-xl font-bold text-emerald-600 dark:text-emerald-400">
                          {(app.seeker?.username || 'A')[0].toUpperCase()}
                        </div>
                        <div>
                          <h4 className={`font-semibold ${textClass}`}>{app.seeker?.username || 'Applicant'}</h4>
                          <p className={`text-sm ${textMuted}`}>{app.jobTitle} • Applied {new Date(app.applied_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(app.status)}`}>
                          {app.status || 'pending'}
                        </span>
                        <button onClick={() => setShowCandidateModal(app)} className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-200">Profile</button>
                        <button onClick={() => handleUpdateStatus(app.id, 'interview')} className="px-3 py-1 bg-green-100 text-green-600 rounded-lg text-sm font-medium hover:bg-green-200">Shortlist</button>
                        <button onClick={() => handleUpdateStatus(app.id, 'rejected')} className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <h4 className={`text-xl font-semibold ${textClass} mb-2`}>No applicants yet</h4>
                  <p className={textMuted}>Post jobs to receive applications</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

{/* Chat & Interviews Tab */}
        {activeTab === 'chat' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className={`${cardClass} rounded-2xl shadow-lg p-6`}>
              <h3 className={`text-xl font-bold ${textClass} mb-6`}>Chat & Interviews</h3>
              <div className="space-y-6">
                {/* Eligible Candidates for Chat */}
                <div>
                  <h4 className={`text-lg font-semibold ${textClass} mb-4`}>💬 Start New Conversation</h4>
                  <p className={`text-sm ${textMuted} mb-4`}>Select a shortlisted candidate to start chatting</p>
                  {allApplicants.filter(a => a.status === 'interview' || a.status === 'accepted' || a.status === 'offered').length > 0 ? (
                    <div className="space-y-3">
                      {allApplicants.filter(a => a.status === 'interview' || a.status === 'accepted' || a.status === 'offered').map((app) => (
                        <div key={app.id} className={`flex items-center justify-between p-4 ${bgSecondary} rounded-xl`}>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 rounded-full flex items-center justify-center text-lg font-bold text-violet-600 dark:text-violet-400">
                              {(app.seeker?.username || 'A')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className={`font-semibold ${textClass}`}>{app.seeker?.username || 'Candidate'}</p>
                              <p className={`text-sm ${textMuted}`}>{app.jobTitle}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => {
                              // Navigate to chat - conversation will be created automatically or select existing
                              navigate('/chat');
                            }} className="px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg text-sm font-medium hover:bg-violet-200">
                              💬 Start Chat
                            </button>
                            <button onClick={() => setShowInterviewModal(app)} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-200">
                              📅 Schedule Interview
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`text-center py-8 ${textMuted}`}>
                      <div className="text-4xl mb-2">💬</div>
                      <p>No candidates eligible for chat</p>
                      <p className="text-sm">Shortlist candidates from Applications tab to start chatting</p>
                    </div>
                  )}
                </div>
                
                {/* Quick Link to Chat Page */}
                <div className={`p-4 ${bgSecondary} rounded-xl`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-semibold ${textClass}`}>📩 View All Conversations</h4>
                      <p className={`text-sm ${textMuted}`}>See all your active chats and messages</p>
                    </div>
                    <button 
                      onClick={() => navigate('/chat')}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
                    >
                      Open Chat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Startup Ideas Tab */}
        {activeTab === 'ideas' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className={`${cardClass} rounded-2xl shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${textClass}`}>Startup Ideas</h3>
                <button 
                  onClick={() => {
                    setIdeaForm({ 
                      title: '', 
                      problem_statement: '', 
                      solution: '', 
                      target_audience: '', 
                      business_model: '', 
                      category: 'technology' 
                    });
                    setShowIdeaModal(true);
                  }}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
                >
                  + Post Idea
                </button>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                </div>
              ) : myIdeas.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {myIdeas.map((idea) => (
                    <div key={idea.id} className={`p-6 ${bgSecondary} rounded-xl`}>
                      <div className="flex items-start justify-between mb-3">
                        <h4 className={`text-lg font-bold ${textClass}`}>{idea.title}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          idea.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          idea.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {idea.status || 'pending'}
                        </span>
                      </div>
                      <p className={`text-sm ${textMuted} mb-3`}>{idea.category}</p>
                      <p className={`text-sm ${textClass} line-clamp-3`}>{idea.problem_statement}</p>
                      <div className={`flex items-center justify-between mt-4 pt-4 border-t ${borderClass}`}>
                        <span className={`text-sm ${textMuted}`}>Votes: {idea.vote_score || 0}</span>
                        <span className={`text-sm ${textMuted}`}>{new Date(idea.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">💡</div>
                  <h4 className={`text-xl font-semibold ${textClass} mb-2`}>No startup ideas yet</h4>
                  <p className={`${textMuted} mb-4`}>Post your first startup idea</p>
                  <button 
                    onClick={() => setShowIdeaModal(true)}
                    className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600"
                  >
                    Post an Idea
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Success Message */}
            {message.text && (
              <div className={`p-4 rounded-xl mb-6 ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {message.text}
              </div>
            )}

            {/* Appearance */}
            <div className={`${cardClass} rounded-2xl shadow-lg p-6 mb-6`}>
              <h3 className={`text-xl font-bold ${textClass} mb-6`}>Appearance</h3>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-2xl">
                    {darkMode ? '🌙' : '☀️'}
                  </div>
                  <div>
                    <p className={`font-semibold ${textClass}`}>Dark Mode</p>
                    <p className={`text-sm ${textMuted}`}>Toggle dark/light theme</p>
                  </div>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${darkMode ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${darkMode ? 'left-7' : 'left-1'}`}></span>
                </button>
              </div>
            </div>

            {/* Company Profile - View Mode */}
            {!editingCompany ? (
              <div className={`${cardClass} rounded-2xl shadow-lg p-6`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-xl font-bold ${textClass}`}>Company Profile</h3>
                  <button 
                    onClick={() => setEditingCompany(true)} 
                    className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors flex items-center gap-2"
                  >
                    <span>✏️</span> Edit
                  </button>
                </div>
                
                {companyForm.name ? (
                  <div className="space-y-6">
                    {/* Logo and Basic Info */}
                    <div className="flex items-start gap-6">
                      <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl flex items-center justify-center text-4xl overflow-hidden flex-shrink-0">
                        {(companyForm.logo || companyForm.logoUrl) ? (
                          <img src={companyForm.logo ? URL.createObjectURL(companyForm.logo) : companyForm.logoUrl} alt="Company Logo" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-4xl">🏢</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-2xl font-bold ${textClass}`}>{companyForm.name}</h4>
                        <p className={`text-lg ${textMuted}`}>{companyForm.industry || 'No industry specified'}</p>
                        <p className={`text-sm ${textMuted}`}>{companyForm.location || 'No location specified'}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className={`p-4 ${bgSecondary} rounded-xl`}>
                      <p className={`text-sm font-semibold ${textMuted} mb-2`}>Description</p>
                      <p className={textClass}>{companyForm.description || 'No description provided'}</p>
                    </div>

                    {/* Details Grid */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className={`p-4 ${bgSecondary} rounded-xl`}>
                        <p className={`text-sm font-semibold ${textMuted} mb-1`}>Website</p>
                        <p className={textClass}>{companyForm.website || 'Not specified'}</p>
                      </div>
                      <div className={`p-4 ${bgSecondary} rounded-xl`}>
                        <p className={`text-sm font-semibold ${textMuted} mb-1`}>Founded Year</p>
                        <p className={textClass}>{companyForm.founded_year || 'Not specified'}</p>
                      </div>
                      <div className={`p-4 ${bgSecondary} rounded-xl`}>
                        <p className={`text-sm font-semibold ${textMuted} mb-1`}>Company Size</p>
                        <p className={textClass}>{companyForm.company_size || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🏢</div>
                    <h4 className={`text-xl font-semibold ${textClass} mb-2`}>No company profile yet</h4>
                    <p className={`${textMuted} mb-4`}>Create your company profile to get started</p>
                    <button 
                      onClick={() => setEditingCompany(true)} 
                      className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600"
                    >
                      Create Company Profile
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Company Profile - Edit Mode */
              <div className={`${cardClass} rounded-2xl shadow-lg p-6`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-xl font-bold ${textClass}`}>{companyForm.name ? 'Edit Company Profile' : 'Create Company Profile'}</h3>
                  <button 
                    onClick={() => { setEditingCompany(false); fetchCompanyData(); }} 
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                
                <form onSubmit={handleSaveCompany} className="space-y-6">
                  {/* Logo Upload */}
                  <div className="flex items-center gap-6 mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl flex items-center justify-center text-4xl overflow-hidden">
                      {companyForm.logo ? (
                        <img src={URL.createObjectURL(companyForm.logo)} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">🏢</span>
                      )}
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Company Logo</label>
                      <input type="file" accept="image/*" onChange={handleLogoChange} className={`text-sm ${textMuted}`} />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Company Name *</label>
                      <input type="text" value={companyForm.name} onChange={(e) => setCompanyForm({...companyForm, name: e.target.value})} placeholder="e.g. Tech Solutions Inc." className={`w-full px-4 py-3 ${inputClass} border rounded-xl focus:outline-none focus:border-emerald-500`} required />
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Industry</label>
                      <input type="text" value={companyForm.industry} onChange={(e) => setCompanyForm({...companyForm, industry: e.target.value})} placeholder="e.g. Technology, Healthcare" className={`w-full px-4 py-3 ${inputClass} border rounded-xl focus:outline-none focus:border-emerald-500`} />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Company Description</label>
                    <textarea value={companyForm.description} onChange={(e) => setCompanyForm({...companyForm, description: e.target.value})} placeholder="Tell us about your company..." rows={4} className={`w-full px-4 py-3 ${inputClass} border rounded-xl focus:outline-none focus:border-emerald-500 resize-none`} />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Website</label>
                      <input type="url" value={companyForm.website} onChange={(e) => setCompanyForm({...companyForm, website: e.target.value})} placeholder="https://yourcompany.com" className={`w-full px-4 py-3 ${inputClass} border rounded-xl focus:outline-none focus:border-emerald-500`} />
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Location</label>
                      <input type="text" value={companyForm.location} onChange={(e) => setCompanyForm({...companyForm, location: e.target.value})} placeholder="e.g. San Francisco, CA" className={`w-full px-4 py-3 ${inputClass} border rounded-xl focus:outline-none focus:border-emerald-500`} />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Founded Year</label>
                      <input type="number" value={companyForm.founded_year} onChange={(e) => setCompanyForm({...companyForm, founded_year: e.target.value})} placeholder="e.g. 2020" className={`w-full px-4 py-3 ${inputClass} border rounded-xl focus:outline-none focus:border-emerald-500`} />
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Company Size</label>
                      <select value={companyForm.company_size} onChange={(e) => setCompanyForm({...companyForm, company_size: e.target.value})} className={`w-full px-4 py-3 ${inputClass} border rounded-xl focus:outline-none focus:border-emerald-500`}>
                        <option value="">Select size</option>
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="500+">500+ employees</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" disabled={savingCompany} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50">
                    {savingCompany ? 'Saving...' : 'Save Company Profile 💾'}
                  </button>
                </form>
              </div>
            )}

            {/* Account Section */}
            <div className={`${cardClass} rounded-2xl shadow-lg p-6 mt-6`}>
              <h3 className={`text-xl font-bold ${textClass} mb-6`}>Account</h3>
              <div className="space-y-4">
                <div className={`flex items-center gap-4 p-4 ${bgSecondary} rounded-xl`}>
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full flex items-center justify-center text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {(user?.username || 'R')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className={`font-semibold ${textClass}`}>{user?.username || 'Recruiter'}</p>
                    <p className={`text-sm ${textMuted}`}>{user?.email || 'recruiter@company.com'}</p>
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

      {/* Candidate Profile Modal */}
      <AnimatePresence>
        {showCandidateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowCandidateModal(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className={`${cardClass} rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold ${textClass}`}>Candidate Profile</h2>
                  <button onClick={() => setShowCandidateModal(null)} className={`p-2 rounded-xl hover:${bgSecondary}`}>✕</button>
                </div>
                <div className="space-y-4">
                  {/* Profile Header */}
                  <div className="flex items-center gap-4">
                    {showCandidateModal.seeker_profile_photo ? (
                      <img src={showCandidateModal.seeker_profile_photo} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full flex items-center justify-center text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        {(showCandidateModal.seeker_name || showCandidateModal.seeker?.username || 'A')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className={`text-xl font-bold ${textClass}`}>{showCandidateModal.seeker_name || showCandidateModal.seeker?.username || 'Applicant'}</p>
                      <p className={textMuted}>{showCandidateModal.seeker_email || 'email@example.com'}</p>
                      {showCandidateModal.match_score && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded text-xs font-semibold">
                          Match Score: {showCandidateModal.match_score}%
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Job Applied For */}
                  <div className={`p-4 ${bgSecondary} rounded-xl`}>
                    <p className={`text-sm ${textMuted} mb-1`}>Applied for</p>
                    <p className={`font-semibold ${textClass}`}>{showCandidateModal.job_title || showCandidateModal.jobTitle}</p>
                  </div>
                  
                  {/* Contact Info */}
                  {(showCandidateModal.seeker_phone || showCandidateModal.seeker_location) && (
                    <div className="grid grid-cols-2 gap-3">
                      {showCandidateModal.seeker_phone && (
                        <div className={`p-4 ${bgSecondary} rounded-xl`}>
                          <p className={`text-sm ${textMuted} mb-1`}>📱 Phone</p>
                          <p className={`font-semibold ${textClass}`}>{showCandidateModal.seeker_phone}</p>
                        </div>
                      )}
                      {showCandidateModal.seeker_location && (
                        <div className={`p-4 ${bgSecondary} rounded-xl`}>
                          <p className={`text-sm ${textMuted} mb-1`}>📍 Location</p>
                          <p className={`font-semibold ${textClass}`}>{showCandidateModal.seeker_location}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Skills */}
                  {showCandidateModal.seeker_skills && showCandidateModal.seeker_skills.length > 0 && (
                    <div className={`p-4 ${bgSecondary} rounded-xl`}>
                      <p className={`text-sm ${textMuted} mb-2`}>💼 Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {showCandidateModal.seeker_skills.map((skill, index) => (
                          <span key={index} className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Experience */}
                  {showCandidateModal.seeker_experience && (
                    <div className={`p-4 ${bgSecondary} rounded-xl`}>
                      <p className={`text-sm ${textMuted} mb-1`}>💼 Experience</p>
                      <p className={`font-semibold ${textClass}`}>{showCandidateModal.seeker_experience}</p>
                    </div>
                  )}
                  
                  {/* Social Links */}
                  {(showCandidateModal.seeker_linkedin || showCandidateModal.seeker_github || showCandidateModal.seeker_portfolio) && (
                    <div className={`p-4 ${bgSecondary} rounded-xl`}>
                      <p className={`text-sm ${textMuted} mb-2`}>🔗 Social Links</p>
                      <div className="flex flex-wrap gap-2">
                        {showCandidateModal.seeker_linkedin && (
                          <a 
                            href={showCandidateModal.seeker_linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-200"
                          >
                            <span>💼</span> LinkedIn
                          </a>
                        )}
                        {showCandidateModal.seeker_github && (
                          <a 
                            href={showCandidateModal.seeker_github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-gray-800 dark:bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
                          >
                            <span>💻</span> GitHub
                          </a>
                        )}
                        {showCandidateModal.seeker_portfolio && (
                          <a 
                            href={showCandidateModal.seeker_portfolio}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-sm font-medium hover:bg-green-200"
                          >
                            <span>🌐</span> Portfolio
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Resume */}
                  {showCandidateModal.resume_url && (
                    <div className={`p-4 ${bgSecondary} rounded-xl`}>
                      <p className={`text-sm ${textMuted} mb-1`}>📄 Resume</p>
                      <a 
                        href={showCandidateModal.resume_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                      >
                        📥 View Resume
                      </a>
                    </div>
                  )}
                  
                  {/* Cover Letter */}
                  {showCandidateModal.cover_letter && (
                    <div className={`p-4 ${bgSecondary} rounded-xl`}>
                      <p className={`text-sm ${textMuted} mb-1`}>📝 Cover Letter</p>
                      <p className={`text-sm ${textClass}`}>{showCandidateModal.cover_letter}</p>
                    </div>
                  )}
                  
                  {/* Applied Date */}
                  <div className={`p-4 ${bgSecondary} rounded-xl`}>
                    <p className={`text-sm ${textMuted} mb-1`}>Applied on</p>
                    <p className={`font-semibold ${textClass}`}>{new Date(showCandidateModal.applied_at).toLocaleDateString()}</p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => { handleUpdateStatus(showCandidateModal.id, 'interview'); setShowCandidateModal(null); }} className="flex-1 py-3 bg-green-100 text-green-600 rounded-xl font-semibold hover:bg-green-200 transition-colors">
                      ✅ Shortlist
                    </button>
                    <button onClick={() => { handleUpdateStatus(showCandidateModal.id, 'rejected'); setShowCandidateModal(null); }} className="flex-1 py-3 bg-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-200 transition-colors">
                      ❌ Reject
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post Idea Modal */}
      <AnimatePresence>
        {showIdeaModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowIdeaModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className={`${cardClass} rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold ${textClass}`}>Post Startup Idea</h2>
                  <button onClick={() => setShowIdeaModal(false)} className={`p-2 rounded-xl hover:${bgSecondary}`}>✕</button>
                </div>
                <form onSubmit={handleCreateIdea} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Title *</label>
                    <input 
                      type="text" 
                      value={ideaForm.title} 
                      onChange={(e) => setIdeaForm({...ideaForm, title: e.target.value})} 
                      placeholder="Your startup idea title" 
                      className={`w-full px-4 py-3 ${inputClass} border rounded-xl focus:outline-none focus:border-emerald-500`} 
                      required 
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Category</label>
                    <select 
                      value={ideaForm.category} 
                      onChange={(e) => setIdeaForm({...ideaForm, category: e.target.value})} 
                      className={`w-full px-4 py-3 ${inputClass} border rounded-xl focus:outline-none focus:border-emerald-500`}
                    >
                      <option value="technology">technology</option>
                      <option value="healthcare">healthcare</option>
                      <option value="education">education</option>
                      <option value="finance">finance</option>
                      <option value="ecommerce">e-commerce</option>
                      <option value="food">food & Beverage</option>
                      <option value="travel">travel</option>
                      <option value="entertainment">entertainment</option>
                      <option value="social">Social Impact</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Problem Statement *</label>
                    <textarea 
                      value={ideaForm.problem_statement} 
                      onChange={(e) => setIdeaForm({...ideaForm, problem_statement: e.target.value})} 
                      placeholder="What problem does your idea solve?" 
                      rows={3}
                      className={`w-full px-4 py-3 ${inputClass} border rounded-xl focus:outline-none focus:border-emerald-500 resize-none`} 
                      required 
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Solution *</label>
                    <textarea 
                      value={ideaForm.solution} 
                      onChange={(e) => setIdeaForm({...ideaForm, solution: e.target.value})} 
                      placeholder="How does your idea solve this problem?" 
                      rows={3}
                      className={`w-full px-4 py-3 ${inputClass} border rounded-xl focus:outline-none focus:border-emerald-500 resize-none`} 
                      required 
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Target Audience</label>
                    <input 
                      type="text" 
                      value={ideaForm.target_audience} 
                      onChange={(e) => setIdeaForm({...ideaForm, target_audience: e.target.value})} 
                      placeholder="Who is your target audience?" 
                      className={`w-full px-4 py-3 ${inputClass} border rounded-xl focus:outline-none focus:border-emerald-500`} 
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Business Model</label>
                    <input 
                      type="text" 
                      value={ideaForm.business_model} 
                      onChange={(e) => setIdeaForm({...ideaForm, business_model: e.target.value})} 
                      placeholder="How will you make money?" 
                      className={`w-full px-4 py-3 ${inputClass} border rounded-xl focus:outline-none focus:border-emerald-500`} 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={creating}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50"
                  >
                    {creating ? 'Submitting...' : 'Submit Idea 🚀'}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecruiterDashboard;
