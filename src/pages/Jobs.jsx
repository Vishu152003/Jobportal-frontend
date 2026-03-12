import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from '../components/Loader';
import { jobsAPI, applicationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [filters, setFilters] = useState({
    job_type: '',
    location: '',
    experience: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [savingJobId, setSavingJobId] = useState(null);
  const [locationInput, setLocationInput] = useState('');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Location autocomplete - India and International
  const locations = [
    { value: 'India', label: 'India' },
    { value: 'Mumbai, India', label: 'Mumbai, India' },
    { value: 'Delhi, India', label: 'Delhi, India' },
    { value: 'Bangalore, India', label: 'Bangalore, India' },
    { value: 'Hyderabad, India', label: 'Hyderabad, India' },
    { value: 'Chennai, India', label: 'Chennai, India' },
    { value: 'Kolkata, India', label: 'Kolkata, India' },
    { value: 'Pune, India', label: 'Pune, India' },
    { value: 'Ahmedabad, India', label: 'Ahmedabad, India' },
    { value: 'Jaipur, India', label: 'Jaipur, India' },
    { value: 'Surat, India', label: 'Surat, India' },
    { value: 'Lucknow, India', label: 'Lucknow, India' },
    { value: 'Kanpur, India', label: 'Kanpur, India' },
    { value: 'Nagpur, India', label: 'Nagpur, India' },
    { value: 'Indore, India', label: 'Indore, India' },
    { value: 'Coimbatore, India', label: 'Coimbatore, India' },
    { value: 'Kochi, India', label: 'Kochi, India' },
    { value: 'Chandigarh, India', label: 'Chandigarh, India' },
    { value: 'Goa, India', label: 'Goa, India' },
    { value: 'Gurgaon, India', label: 'Gurgaon, India' },
    { value: 'Noida, India', label: 'Noida, India' },
    { value: 'Remote, India', label: 'Remote (India)' },
    { value: 'Remote', label: 'Remote' },
    { value: 'New York, USA', label: 'New York, USA' },
    { value: 'San Francisco, USA', label: 'San Francisco, USA' },
    { value: 'Austin, USA', label: 'Austin, USA' },
    { value: 'Seattle, USA', label: 'Seattle, USA' },
    { value: 'Los Angeles, USA', label: 'Los Angeles, USA' },
    { value: 'Chicago, USA', label: 'Chicago, USA' },
    { value: 'Boston, USA', label: 'Boston, USA' },
    { value: 'London, UK', label: 'London, UK' },
    { value: 'Berlin, Germany', label: 'Berlin, Germany' },
    { value: 'Paris, France', label: 'Paris, France' },
    { value: 'Dubai, UAE', label: 'Dubai, UAE' },
    { value: 'Singapore', label: 'Singapore' },
    { value: 'Toronto, Canada', label: 'Toronto, Canada' },
    { value: 'Sydney, Australia', label: 'Sydney, Australia' },
    { value: 'Tokyo, Japan', label: 'Tokyo, Japan' },
  ];

  // Filter suggestions based on input
  const filteredLocations = locations.filter(loc => 
    loc.label.toLowerCase().includes(locationInput.toLowerCase()) ||
    loc.value.toLowerCase().includes(locationInput.toLowerCase())
  );

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setFilters({...filters, location: value});
    setLocationInput(value);
    if (value.length > 0) {
      setShowLocationSuggestions(true);
    } else {
      setShowLocationSuggestions(false);
    }
  };

  const handleLocationSelect = (location) => {
    setFilters({...filters, location: location});
    setLocationInput(location);
    setShowLocationSuggestions(false);
  };

  useEffect(() => {
    fetchJobs();
    fetchSavedJobs();
    fetchAppliedJobs();
  }, [filters]);

  // Refetch saved jobs when user logs in or navigates to the page
  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedJobs();
      fetchAppliedJobs();
    } else {
      setSavedJobs([]);
      setAppliedJobs([]);
    }
  }, [isAuthenticated]);

  const fetchAppliedJobs = async () => {
    try {
      const response = await applicationsAPI.myApplications();
      const applications = response.data.results || response.data || [];
      const appliedJobIds = applications.map(app => app.job);
      setAppliedJobs(appliedJobIds);
    } catch (err) {
      console.error('Error fetching applied jobs:', err);
      setAppliedJobs([]);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filters.job_type) params.job_type = filters.job_type;
      if (filters.location) params.location = filters.location;
      if (filters.experience) params.experience = filters.experience;
      
      const response = await jobsAPI.list(params);
      const jobsData = response.data.results || response.data || [];
      
      const transformedJobs = jobsData.map(job => ({
        id: job.id,
        title: job.title,
        company: { 
          name: job.company_name || 'Company',
          logo: null
        },
        location: job.location || 'Remote',
        salary: job.salary_min && job.salary_max 
          ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
          : 'Negotiable',
        salary_currency: job.salary_currency || 'USD',
        job_type: job.job_type || 'full_time',
        skills: job.skills || [],
        description: job.description || '',
        requirements: job.requirements || '',
        experience_level: job.experience_level || '',
        is_remote: job.is_remote,
        application_deadline: job.application_deadline,
        positions: job.positions,
        application_count: job.application_count,
        posted_date: job.created_at,
      }));
      
      setJobs(transformedJobs);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setApplyingJobId(jobId);
    try {
      const jobIdInt = parseInt(jobId, 10);
      console.log('Applying to job with ID:', jobIdInt, 'Resume:', resumeFile?.name);
      
      let response;
      const token = localStorage.getItem('token');
      
      if (resumeFile) {
        const formData = new FormData();
        formData.append('job', jobIdInt);
        formData.append('resume', resumeFile);
        
        response = await fetch('/api/applications/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
      } else {
        response = await fetch('/api/applications/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ job: jobIdInt })
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        
        let errorMessage = '';
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (typeof errorData === 'object') {
          errorMessage = Object.values(errorData).flat().join(', ');
        } else {
          errorMessage = 'Failed to apply. You may have already applied or the job may not be available.';
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Application success:', data);
      setAppliedJobs([...appliedJobs, jobId]);
      alert('Application submitted successfully!');
      setSelectedJob(null);
      setResumeFile(null);
    } catch (err) {
      console.error('Error applying to job:', err);
      alert(err.message || 'Failed to apply. Please try again.');
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.includes('pdf') && !file.type.includes('word') && !file.type.includes('document')) {
        alert('Please upload a PDF or Word document');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setResumeFile(file);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const clearFilters = () => {
    setFilters({ job_type: '', location: '', experience: '' });
    setSearch('');
    setLocationInput('');
  };

  const jobTypeColors = {
    full_time: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    part_time: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    contract: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    internship: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };

  const isJobApplied = (jobId) => appliedJobs.includes(jobId);

  const fetchSavedJobs = async () => {
    // Load from localStorage first for immediate display
    const cached = localStorage.getItem('savedJobIds');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setSavedJobs(parsed);
        console.log('Loaded saved jobs from localStorage:', parsed);
      } catch (e) {
        console.error('Error parsing cached saved jobs:', e);
      }
    }
    
    // Always try to fetch from API if authenticated (to get latest data)
    if (!isAuthenticated) return;
    
    try {
      const response = await jobsAPI.getSavedJobs();
      const saved = response.data.results || response.data || [];
      console.log('API response for saved jobs:', saved);
      
      // Handle both response formats
      const savedJobIds = saved.map(s => {
        if (s.job && typeof s.job === 'object' && s.job.id) {
          return s.job.id;
        }
        if (s.job_id) {
          return parseInt(s.job_id);
        }
        if (s.id) {
          return parseInt(s.id);
        }
        return null;
      }).filter(id => id !== null);
      
      console.log('Parsed saved job IDs:', savedJobIds);
      setSavedJobs(savedJobIds);
      localStorage.setItem('savedJobIds', JSON.stringify(savedJobIds));
    } catch (err) {
      console.error('Error fetching saved jobs:', err);
    }
  };

  const handleSaveJob = async (jobId, e) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    e.stopPropagation();
    setSavingJobId(jobId);
    
    // Optimistic UI update - toggle immediately for better UX
    const wasSaved = savedJobs.includes(jobId);
    const newSavedJobs = wasSaved 
      ? savedJobs.filter(id => id !== jobId)
      : [...savedJobs, jobId];
    
    setSavedJobs(newSavedJobs);
    localStorage.setItem('savedJobIds', JSON.stringify(newSavedJobs));

    try {
      if (wasSaved) {
        await jobsAPI.unsaveJob(jobId);
      } else {
        await jobsAPI.saveJob(jobId);
      }
    } catch (err) {
      console.error('Error saving/unsaving job:', err);
      // Revert the optimistic update on error
      setSavedJobs(prev => 
        wasSaved ? [...prev, jobId] : prev.filter(id => id !== jobId)
      );
      localStorage.setItem('savedJobIds', JSON.stringify(savedJobs));
    } finally {
      setSavingJobId(null);
    }
  };

  const isJobSaved = (jobId) => savedJobs.includes(jobId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">Dream Job</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse {jobs.length}+ available positions from top companies
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">🔍</span>
              <input
                type="text"
                placeholder="Search jobs by title, company, or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-900/50 transition-all text-gray-900 dark:text-white placeholder-gray-400 shadow-sm"
              />
            </div>
            <button type="button" onClick={() => setShowFilters(!showFilters)} className={`px-6 py-4 rounded-2xl font-semibold transition-all ${showFilters ? 'bg-violet-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}>
              ⚙️ Filters
            </button>
            <button type="submit" className="px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-violet-500/30 transition-all">
              Search
            </button>
          </form>
        </motion.div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Job Type</label>
                  <select value={filters.job_type} onChange={(e) => setFilters({...filters, job_type: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-violet-500 text-black">
                    <option value="">All Types</option>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Location</label>
                  <input
                    type="text"
                    placeholder="Type to search location..."
                    value={locationInput}
                    onChange={handleLocationChange}
                    onFocus={() => locationInput.length > 0 && setShowLocationSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-violet-500 text-black"
                  />
                  {showLocationSuggestions && filteredLocations.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-auto">
                      {filteredLocations.map((loc) => (
                        <div
                          key={loc.value}
                          onClick={() => handleLocationSelect(loc.value)}
                          className="px-4 py-2 hover:bg-violet-50 dark:hover:bg-violet-900/30 cursor-pointer text-gray-900 dark:text-gray-100"
                        >
                          {loc.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Experience</label>
                  <select value={filters.experience} onChange={(e) => setFilters({...filters, experience: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-violet-500 text-black">
                    <option value="">All Levels</option>
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                    <option value="lead">Lead/Manager</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={clearFilters} className="text-sm text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400">Clear all filters</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {(filters.job_type || filters.location || filters.experience) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2 mb-6">
            {filters.job_type && <span className="px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-sm font-medium flex items-center gap-1">{filters.job_type.replace('_', ' ')}<button onClick={() => setFilters({...filters, job_type: ''})} className="hover:text-violet-900">×</button></span>}
            {filters.location && <span className="px-3 py-1 bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300 rounded-full text-sm font-medium flex items-center gap-1">{filters.location}<button onClick={() => {setFilters({...filters, location: ''}); setLocationInput('');}} className="hover:text-fuchsia-900">×</button></span>}
            {filters.experience && <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium flex items-center gap-1">{filters.experience} level<button onClick={() => setFilters({...filters, experience: ''})} className="hover:text-blue-900">×</button></span>}
          </motion.div>
        )}

{loading ? (
          <Loader type="job-list" count={6} />
        ) : jobs.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No jobs found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors">Clear Filters</button>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job, index) => (
              <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} whileHover={{ scale: 1.01 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl border border-gray-200 dark:border-gray-700 p-6 transition-all cursor-pointer" onClick={() => setSelectedJob(job)}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 flex items-center justify-center overflow-hidden">
                      {job.company?.logo ? <img src={job.company.logo} alt={job.company.name} className="w-full h-full object-cover" /> : <span className="text-2xl">🏢</span>}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{job.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 font-medium">{job.company?.name || 'Company Name'}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">📍 {job.location || 'Remote'}</span>
                        <span className="flex items-center gap-1">💰 {job.salary || 'Negotiable'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${jobTypeColors[job.job_type] || jobTypeColors.full_time}`}>{job.job_type?.replace('_', ' ') || 'Full Time'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex flex-wrap gap-2 justify-end">
                      {(job.skills || []).slice(0, 3).map((skill, i) => (<span key={i} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">{skill}</span>))}
                      {(job.skills?.length || 0) > 3 && <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-xs">+{job.skills.length - 3}</span>}
                    </div>
                    <div className="flex gap-2">
                      {isJobApplied(job.id) ? (
                        <span className="px-6 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl font-semibold">✓ Applied</span>
                      ) : (
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); if (!isAuthenticated) { navigate('/login'); return; } setSelectedJob(job); }} className="px-6 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-violet-500/30 transition-all">
                          Apply Now
                        </motion.button>
                      )}
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={(e) => handleSaveJob(job.id, e)} disabled={savingJobId === job.id} className={`px-6 py-2 rounded-xl font-semibold transition-all ${isJobSaved(job.id) ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                        {savingJobId === job.id ? 'Saving...' : isJobSaved(job.id) ? '★ Saved' : '☆ Save'}
                      </motion.button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">Posted {job.posted_date ? new Date(job.posted_date).toLocaleDateString() : 'recently'}</p>
                    <p className="text-sm text-gray-400 flex items-center gap-1">
                      <span className="text-violet-600 dark:text-violet-400 font-semibold">{job.application_count || 0}</span> applicant{(job.application_count || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {selectedJob && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedJob(null)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 flex items-center justify-center overflow-hidden">
                        {selectedJob.company?.logo ? <img src={selectedJob.company.logo} alt={selectedJob.company.name} className="w-full h-full object-cover" /> : <span className="text-3xl">🏢</span>}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedJob.title}</h2>
                        <p className="text-gray-600 dark:text-gray-400 font-medium">{selectedJob.company?.name}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedJob(null)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">✕</button>
                  </div>

                  <div className="flex flex-wrap gap-4 mb-6">
                    <span className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300">📍 {selectedJob.location || 'Remote'}</span>
                    <span className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300">💰 {selectedJob.salary || 'Negotiable'}</span>
                    <span className={`px-4 py-2 rounded-xl text-sm font-medium ${jobTypeColors[selectedJob.job_type] || jobTypeColors.full_time}`}>{selectedJob.job_type?.replace('_', ' ') || 'Full Time'}</span>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {(selectedJob.skills || []).map((skill, i) => (<span key={i} className="px-4 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-sm font-medium">{skill}</span>))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Job Description</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{selectedJob.description || 'No description provided.'}</p>
                  </div>

                  {selectedJob.requirements && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Requirements</h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{selectedJob.requirements}</p>
                    </div>
                  )}

                  {selectedJob.experience_level && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Experience Level</h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{selectedJob.experience_level}</p>
                    </div>
                  )}

                  {!isJobApplied(selectedJob.id) && (
                    <div className="mb-6 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        📄 Upload Resume (Optional but recommended)
                      </label>
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeChange}
                        className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-700"
                      />
                      {resumeFile && (
                        <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                          ✓ Selected: {resumeFile.name}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        PDF or Word documents, max 5MB
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    {isJobApplied(selectedJob.id) ? (
                      <div className="flex-1 py-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl font-bold text-center">✓ Already Applied</div>
                    ) : (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleApply(selectedJob.id)} disabled={applyingJobId === selectedJob.id} className="flex-1 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-violet-500/30 transition-all disabled:opacity-50">
                        {applyingJobId === selectedJob.id ? 'Applying...' : 'Apply Now'}
                      </motion.button>
                    )}
                    <button onClick={() => setSelectedJob(null)} className="px-6 py-4 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Close</button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Jobs;
