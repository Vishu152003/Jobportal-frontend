import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../services/api';

const Profile = () => {
  const { user, setUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [profilePercent, setProfilePercent] = useState(0);
  const [userForm, setUserForm] = useState({ first_name: '', last_name: '' });

  const [profile, setProfile] = useState({
    phone: '',
    profile_photo: null,
    profile_summary: '',
    bio: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    skills: [],
    languages: [],
    resume: null,
    is_fresher: true,
    current_company: '',
    current_job_title: '',
    current_salary: '',
    expected_salary: '',
    employment_history: [],
    internships: [],
    education: [],
    projects: [],
    accomplishments: [],
    preferred_job_type: [],
    preferred_locations: [],
    preferred_industry: '',
    willing_to_relocate: false,
    notice_period: '',
    available_from: '',
    current_location: '',
    hometown: '',
    date_of_birth: '',
    gender: '',
    marital_status: '',
    father_name: '',
    mother_name: '',
  });

  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const [showLanguageSuggestions, setShowLanguageSuggestions] = useState(false);
  const [newEducation, setNewEducation] = useState({ type: 'high_school', institution: '', field: '', start_year: '', end_year: '', grade: '', description: '' });
  const [newProject, setNewProject] = useState({ title: '', description: '', technologies: '', link: '', start_date: '', end_date: '' });
  const [newAccomplishment, setNewAccomplishment] = useState({ title: '', organization: '', date: '', description: '' });
  const [newEmployment, setNewEmployment] = useState({ company: '', job_title: '', start_date: '', end_date: '', description: '' });
  const [newInternship, setNewInternship] = useState({ company: '', role: '', start_date: '', end_date: '', description: '' });

  // Common skills for autocomplete
  const commonSkills = [
    // Programming Languages
    'Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'PHP', 'R', 'Scala', 'Dart',
    // Web Technologies
    'HTML', 'CSS', 'React', 'Angular', 'Vue.js', 'Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot', 'ASP.NET', 'Next.js', 'Nuxt.js',
    // Frontend
    'Tailwind CSS', 'Bootstrap', 'SASS/SCSS', 'UI/UX Design', 'Figma', 'Adobe XD', 'Responsive Design', 'Web Design',
    // Backend
    'REST API', 'GraphQL', 'Microservices', 'Serverless', 'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes',
    // Databases
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Firebase', 'SQLite', 'Oracle',
    // Data Science & ML
    'Machine Learning', 'Deep Learning', 'Data Analysis', 'Data Visualization', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn', 'NLP',
    // Mobile Development
    'React Native', 'Flutter', 'iOS Development', 'Android Development', 'Mobile App Development',
    // DevOps & Tools
    'Git', 'CI/CD', 'Jenkins', 'Terraform', 'Ansible', 'Linux', 'Bash', 'Agile', 'Scrum', 'JIRA',
    // Soft Skills
    'Communication', 'Teamwork', 'Problem Solving', 'Leadership', 'Time Management', 'Adaptability',
    // Other Technical
    'Blockchain', 'Cybersecurity', 'Testing/QA', 'Selenium', 'Postman', 'REST API Development', 'Database Design',
    // Business
    'Project Management', 'Business Analysis', 'Marketing', 'Sales', 'SEO', 'Content Writing',
    // Finance
    'Financial Analysis', 'Accounting', 'Excel', 'Tally', 'GST',
    // Design
    'Graphic Design', 'Logo Design', 'Illustration', 'Photoshop', 'CorelDRAW',
    // Marketing Digital
    'Digital Marketing', 'Social Media Marketing', 'Email Marketing', 'Google Ads', 'Facebook Ads',
    // Office
    'Microsoft Office', 'Word', 'Excel', 'PowerPoint', 'Google Docs', 'Google Sheets',
  ];

  // Common languages for autocomplete
  const commonLanguages = [
    'English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Urdu', 'Gujarati', 'Kannada', 'Malayalam',
    'Punjabi', 'Odia', 'Assamese', 'Sanskrit', 'Konkani', 'Sindhi', 'Nepali', 'French', 'Spanish', 'German',
    'Chinese', 'Japanese', 'Korean', 'Arabic', 'Portuguese', 'Italian', 'Russian', 'Dutch', 'Swedish', 'Norwegian',
    'Danish', 'Finnish', 'Polish', 'Turkish', 'Vietnamese', 'Thai', 'Indonesian', 'Malay', 'Greek', 'Hebrew',
    'Czech', 'Romanian', 'Hungarian', 'Ukrainian', 'Catalan', 'Esperanto', 'Latin'
  ];

  // Filter suggestions based on input
  const filteredSkills = commonSkills.filter(skill => 
    skill.toLowerCase().includes(newSkill.toLowerCase()) && 
    !profile.skills.includes(skill)
  ).slice(0, 10);

  const filteredLanguages = commonLanguages.filter(lang => 
    lang.toLowerCase().includes(newLanguage.toLowerCase()) && 
    !profile.languages.includes(lang)
  ).slice(0, 10);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setUserForm({ first_name: user.first_name || '', last_name: user.last_name || '' });
    fetchProfile();
  }, [user, navigate]);

  const calculateProfilePercent = (profileData) => {
    const fields = [
      { key: 'phone', weight: 5 },
      { key: 'profile_summary', weight: 10 },
      { key: 'bio', weight: 5 },
      { key: 'current_location', weight: 5 },
      { key: 'skills', weight: 15, isArray: true },
      { key: 'resume', weight: 15, isFile: true },
      { key: 'is_fresher', weight: 5, inverse: true },
      { key: 'education', weight: 15, isArray: true },
      { key: 'projects', weight: 10, isArray: true },
      { key: 'linkedin_url', weight: 5 },
      { key: 'github_url', weight: 5 },
      { key: 'preferred_job_type', weight: 5, isArray: true },
      { key: 'current_company', weight: 5, skipIfFresher: true },
      { key: 'current_job_title', weight: 5, skipIfFresher: true },
      { key: 'expected_salary', weight: 5 },
      { key: 'notice_period', weight: 5 },
    ];

    let totalWeight = 0;
    let earnedWeight = 0;

    fields.forEach(field => {
      if (field.skipIfFresher && profileData.is_fresher) return;
      
      totalWeight += field.weight;
      
      const value = profileData[field.key];
      
      if (field.isArray) {
        if (value && value.length > 0) earnedWeight += field.weight;
      } else if (field.isFile) {
        if (value) earnedWeight += field.weight;
      } else if (field.inverse) {
        if (!value) earnedWeight += field.weight;
      } else {
        if (value && value.toString().trim() !== '') earnedWeight += field.weight;
      }
    });

    return totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  };

  const fetchProfile = async () => {
    try {
      const response = await profileAPI.get();
      const data = response.data;
      console.log('Fetched profile data:', data);
      
      const toEmptyString = (val) => val === null || val === undefined ? '' : val;
      
      setProfile(prev => ({
        ...prev,
        ...data,
        phone: toEmptyString(data.phone),
        profile_summary: toEmptyString(data.profile_summary),
        bio: toEmptyString(data.bio),
        linkedin_url: toEmptyString(data.linkedin_url),
        github_url: toEmptyString(data.github_url),
        portfolio_url: toEmptyString(data.portfolio_url),
        current_location: toEmptyString(data.current_location),
        hometown: toEmptyString(data.hometown),
        date_of_birth: toEmptyString(data.date_of_birth),
        gender: toEmptyString(data.gender),
        marital_status: toEmptyString(data.marital_status),
        father_name: toEmptyString(data.father_name),
        mother_name: toEmptyString(data.mother_name),
        expected_salary: toEmptyString(data.expected_salary),
        preferred_industry: toEmptyString(data.preferred_industry),
        notice_period: toEmptyString(data.notice_period),
        skills: Array.isArray(data.skills) ? data.skills : [],
        languages: Array.isArray(data.languages) ? data.languages : [],
        education: Array.isArray(data.education) ? data.education : [],
        projects: Array.isArray(data.projects) ? data.projects : [],
        accomplishments: Array.isArray(data.accomplishments) ? data.accomplishments : [],
        employment_history: Array.isArray(data.employment_history) ? data.employment_history : [],
        internships: Array.isArray(data.internships) ? data.internships : [],
        preferred_job_type: Array.isArray(data.preferred_job_type) ? data.preferred_job_type : [],
        preferred_locations: Array.isArray(data.preferred_locations) ? data.preferred_locations : [],
        resume: data.resume || null,
      }));
      
      const percent = calculateProfilePercent({
        ...data,
        skills: Array.isArray(data.skills) ? data.skills : [],
        education: Array.isArray(data.education) ? data.education : [],
        projects: Array.isArray(data.projects) ? data.projects : [],
        resume: data.resume,
      });
      setProfilePercent(percent);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Separate function to upload just the resume
  const uploadResume = async (file) => {
    try {
      const formData = new FormData();
      formData.append('resume', file);
      // Use direct fetch to avoid Content-Type header issues
      const response = await fetch('/api/auth/profile/seeker/', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Upload failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Resume upload error:', error);
      throw error;
    }
  };

  // Helper function to update profile fields using profileAPI
  const updateProfileFields = async () => {
    const dataToSend = {};
    
    const simpleFields = ['phone', 'profile_summary', 'bio', 'linkedin_url', 'github_url', 
      'portfolio_url', 'is_fresher', 'current_company', 'current_job_title',
      'current_salary', 'expected_salary', 'preferred_industry', 'willing_to_relocate',
      'notice_period', 'available_from', 'current_location', 'hometown',
      'date_of_birth', 'gender', 'marital_status', 'father_name', 'mother_name'];
    
    simpleFields.forEach(field => {
      if (profile[field] !== null && profile[field] !== undefined && profile[field] !== '') {
        dataToSend[field] = profile[field];
      }
    });
    
    const jsonFields = ['skills', 'languages', 'education', 'projects', 'accomplishments',
      'employment_history', 'internships', 'preferred_job_type', 'preferred_locations'];
    
    jsonFields.forEach(field => {
      if (profile[field] && Array.isArray(profile[field])) {
        dataToSend[field] = profile[field];
      }
    });

    const response = await profileAPI.update(dataToSend);
    return response.data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // First, update user details (first_name, last_name)
      if (userForm.first_name || userForm.last_name) {
        try {
          await fetch('/api/auth/profile/', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              first_name: userForm.first_name,
              last_name: userForm.last_name
            })
          });
          
          const updatedUser = { ...user, ...userForm };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (userErr) {
          console.log('User update warning:', userErr);
        }
      }
      
      // Check if we have a new resume file to upload
      if (profile.resume instanceof File) {
        console.log('Uploading resume file:', profile.resume.name);
        try {
          await uploadResume(profile.resume);
          console.log('Resume uploaded successfully');
        } catch (resumeErr) {
          console.error('Resume upload error:', resumeErr);
        }
      }
      
      // Update other profile fields
      try {
        await updateProfileFields();
        console.log('Profile fields updated successfully');
      } catch (fieldsErr) {
        console.error('Fields update error:', fieldsErr);
      }
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      await fetchProfile();
      
      if (refreshUser) {
        await refreshUser();
      }
      
    } catch (err) {
      console.error('Error updating profile:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update profile. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const addSkill = (skill = null) => {
    const skillToAdd = skill || newSkill;
    if (skillToAdd.trim() && !profile.skills.includes(skillToAdd.trim())) {
      setProfile(prev => ({ ...prev, skills: [...prev.skills, skillToAdd.trim()] }));
      setNewSkill('');
      setShowSkillSuggestions(false);
    }
  };

  const removeSkill = (skill) => {
    setProfile(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const addLanguage = (lang = null) => {
    const langToAdd = lang || newLanguage;
    if (langToAdd.trim() && !profile.languages.includes(langToAdd.trim())) {
      setProfile(prev => ({ ...prev, languages: [...prev.languages, langToAdd.trim()] }));
      setNewLanguage('');
      setShowLanguageSuggestions(false);
    }
  };

  const removeLanguage = (lang) => {
    setProfile(prev => ({ ...prev, languages: prev.languages.filter(l => l !== lang) }));
  };

  const addEducation = () => {
    if (newEducation.institution || newEducation.type) {
      setProfile(prev => ({ ...prev, education: [...(prev.education || []), { ...newEducation, id: Date.now() }] }));
      setNewEducation({ type: 'high_school', institution: '', field: '', start_year: '', end_year: '', grade: '', description: '' });
    }
  };

  const removeEducation = (id) => {
    setProfile(prev => ({ ...prev, education: prev.education?.filter(e => e.id !== id) || [] }));
  };

  const addProject = () => {
    if (newProject.title) {
      setProfile(prev => ({ ...prev, projects: [...(prev.projects || []), { ...newProject, id: Date.now() }] }));
      setNewProject({ title: '', description: '', technologies: '', link: '', start_date: '', end_date: '' });
    }
  };

  const removeProject = (id) => {
    setProfile(prev => ({ ...prev, projects: prev.projects?.filter(p => p.id !== id) || [] }));
  };

  const addAccomplishment = () => {
    if (newAccomplishment.title) {
      setProfile(prev => ({ ...prev, accomplishments: [...(prev.accomplishments || []), { ...newAccomplishment, id: Date.now() }] }));
      setNewAccomplishment({ title: '', organization: '', date: '', description: '' });
    }
  };

  const removeAccomplishment = (id) => {
    setProfile(prev => ({ ...prev, accomplishments: prev.accomplishments?.filter(a => a.id !== id) || [] }));
  };

  const addEmployment = () => {
    if (newEmployment.company || newEmployment.job_title) {
      setProfile(prev => ({ ...prev, employment_history: [...(prev.employment_history || []), { ...newEmployment, id: Date.now() }] }));
      setNewEmployment({ company: '', job_title: '', start_date: '', end_date: '', description: '' });
    }
  };

  const removeEmployment = (id) => {
    setProfile(prev => ({ ...prev, employment_history: prev.employment_history?.filter(e => e.id !== id) || [] }));
  };

  const addInternship = () => {
    if (newInternship.company || newInternship.role) {
      setProfile(prev => ({ ...prev, internships: [...(prev.internships || []), { ...newInternship, id: Date.now() }] }));
      setNewInternship({ company: '', role: '', start_date: '', end_date: '', description: '' });
    }
  };

  const removeInternship = (id) => {
    setProfile(prev => ({ ...prev, internships: prev.internships?.filter(i => i.id !== id) || [] }));
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      console.log('File selected:', file.name, file.type);
      setProfile(prev => ({ ...prev, [field]: file }));
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: '👤' },
    { id: 'bio', label: 'Bio', icon: '📝' },
    { id: 'social', label: 'Social Links', icon: '🔗' },
    { id: 'skills', label: 'Skills & Languages', icon: '💡' },
    { id: 'resume', label: 'Resume', icon: '📄' },
    { id: 'employment', label: 'Employment', icon: '💼' },
    { id: 'internships', label: 'Internships', icon: '🎯' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'projects', label: 'Projects', icon: '🚀' },
    { id: 'accomplishments', label: 'Awards', icon: '🏆' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'personal', label: 'Personal', icon: '👨‍👩‍👧' },
  ];

  const educationTypes = [
    { value: 'high_school', label: 'High School / SSC' },
    { value: 'intermediate', label: 'Intermediate / HSC' },
    { value: 'bachelors', label: "Bachelor's Degree" },
    { value: 'masters', label: "Master's Degree" },
    { value: 'phd', label: 'Ph.D. / Doctorate' },
    { value: 'certification', label: 'Certification / Course' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/20" />
                  <circle cx="40" cy="40" r="35" stroke="url(#gradient)" strokeWidth="6" fill="transparent" strokeDasharray={`${profilePercent * 2.2} 220`} strokeLinecap="round" />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={profilePercent >= 80 ? '#10b981' : profilePercent >= 60 ? '#3b82f6' : profilePercent >= 40 ? '#f59e0b' : '#ef4444'} />
                      <stop offset="100%" stopColor={profilePercent >= 80 ? '#34d399' : profilePercent >= 60 ? '#06b6d4' : profilePercent >= 40 ? '#fbbf24' : '#f87171'} />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{profilePercent}%</span>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Profile Strength</h2>
                <p className="text-gray-400">
                  {profilePercent >= 80 ? 'Excellent! Your profile is complete.' : 
                   profilePercent >= 60 ? 'Good! Add more details to stand out.' :
                   profilePercent >= 40 ? 'In Progress. Complete more fields.' :
                   'Get Started! Add your information.'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to="/recommendations" className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                View Recommended Jobs 🤖
              </Link>
            </div>
          </div>
          
          {profilePercent < 100 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-gray-400 text-sm mb-2">Complete these to improve your profile:</p>
              <div className="flex flex-wrap gap-2">
                {!profile.skills?.length && <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm">Add Skills</span>}
                {!profile.education?.length && <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm">Add Education</span>}
                {!profile.profile_summary && <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm">Add Summary</span>}
                {!profile.bio && <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm">Add Bio</span>}
                {!profile.projects?.length && <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm">Add Projects</span>}
                {!profile.linkedin_url && <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">Add LinkedIn</span>}
                {!profile.current_location && <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">Add Location</span>}
              </div>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4">Your Profile Overview</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-gray-400 text-sm">Full Name</p>
              <p className="text-white font-semibold">{userForm.first_name} {userForm.last_name || 'Not set'}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-gray-400 text-sm">Email</p>
              <p className="text-white font-semibold">{user?.email}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-gray-400 text-sm">Phone</p>
              <p className="text-white font-semibold">{profile.phone || 'Not set'}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-gray-400 text-sm">Location</p>
              <p className="text-white font-semibold">{profile.current_location || 'Not set'}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-gray-400 text-sm">Skills</p>
              <p className="text-white font-semibold">{profile.skills?.length || 0} skills added</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-gray-400 text-sm">Education</p>
              <p className="text-white font-semibold">{profile.education?.length || 0} entries</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-gray-400 text-sm">Projects</p>
              <p className="text-white font-semibold">{profile.projects?.length || 0} projects</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-gray-400 text-sm">Resume</p>
              <p className="text-white font-semibold">{profile.resume ? 'Uploaded' : 'Not uploaded'}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Your Professional Profile</h1>
          <p className="text-gray-400">Complete your profile to stand out to recruiters</p>
        </motion.div>

        <AnimatePresence>
          {message.text && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`mb-6 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-500/20 border border-green-500/50 text-green-400' : 'bg-red-500/20 border border-red-500/50 text-red-400'}`}>
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col lg:flex-row gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:w-64 flex-shrink-0">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
              <nav className="space-y-1">
                {tabs.map(tab => (
                  <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === tab.id ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                    <span className="text-xl">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/10">
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Basic Information</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">First Name *</label>
                      <input type="text" name="first_name" value={userForm.first_name} onChange={handleUserChange} placeholder="Enter your first name" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Last Name *</label>
                      <input type="text" name="last_name" value={userForm.last_name} onChange={handleUserChange} placeholder="Enter your last name" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email (Cannot be changed)</label>
                    <input type="email" value={user?.email || ''} disabled className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                    <input type="tel" name="phone" value={profile.phone} onChange={handleProfileChange} placeholder="+91 9876543210" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Profile Summary</label>
                    <textarea name="profile_summary" value={profile.profile_summary} onChange={handleProfileChange} rows={4} placeholder="Write a brief summary about yourself..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500 resize-none" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Current Location</label>
                      <input type="text" name="current_location" value={profile.current_location} onChange={handleProfileChange} placeholder="Mumbai, Maharashtra" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Hometown</label>
                      <input type="text" name="hometown" value={profile.hometown} onChange={handleProfileChange} placeholder="Delhi, India" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'bio' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Bio</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Detailed Bio</label>
                    <textarea name="bio" value={profile.bio} onChange={handleProfileChange} rows={8} placeholder="Write a detailed bio about yourself..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500 resize-none" />
                  </div>
                </div>
              )}

              {activeTab === 'social' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Social Links</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2"><span className="text-blue-400 mr-2">💼</span>LinkedIn Profile</label>
                    <input type="url" name="linkedin_url" value={profile.linkedin_url} onChange={handleProfileChange} placeholder="https://linkedin.com/in/yourprofile" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2"><span className="text-gray-300 mr-2">💻</span>GitHub Profile</label>
                    <input type="url" name="github_url" value={profile.github_url} onChange={handleProfileChange} placeholder="https://github.com/yourusername" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2"><span className="text-green-400 mr-2">🌐</span>Portfolio Website</label>
                    <input type="url" name="portfolio_url" value={profile.portfolio_url} onChange={handleProfileChange} placeholder="https://yourportfolio.com" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                  </div>
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Skills & Languages</h2>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Skills</label>
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1 relative">
                        <input 
                          type="text" 
                          value={newSkill} 
                          onChange={(e) => {
                            setNewSkill(e.target.value);
                            setShowSkillSuggestions(e.target.value.length > 0);
                          }}
                          onFocus={() => newSkill.length > 0 && setShowSkillSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowSkillSuggestions(false), 200)}
                          placeholder="Type to search skills..." 
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" 
                        />
                        {showSkillSuggestions && filteredSkills.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-white/10 rounded-xl shadow-lg max-h-60 overflow-auto">
                            {filteredSkills.map((skill, index) => (
                              <div
                                key={index}
                                onClick={() => addSkill(skill)}
                                className="px-4 py-2 hover:bg-purple-600/30 cursor-pointer text-white"
                              >
                                {skill}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button type="button" onClick={() => addSkill()} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <motion.span key={index} initial={{ scale: 0 }} animate={{ scale: 1 }} className="px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-full text-white flex items-center gap-2">
                          {skill}
                          <button type="button" onClick={() => removeSkill(skill)} className="text-red-400 hover:text-red-300">×</button>
                        </motion.span>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Languages</label>
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1 relative">
                        <input 
                          type="text" 
                          value={newLanguage} 
                          onChange={(e) => {
                            setNewLanguage(e.target.value);
                            setShowLanguageSuggestions(e.target.value.length > 0);
                          }}
                          onFocus={() => newLanguage.length > 0 && setShowLanguageSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowLanguageSuggestions(false), 200)}
                          placeholder="Type to search languages..." 
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" 
                        />
                        {showLanguageSuggestions && filteredLanguages.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-white/10 rounded-xl shadow-lg max-h-60 overflow-auto">
                            {filteredLanguages.map((lang, index) => (
                              <div
                                key={index}
                                onClick={() => addLanguage(lang)}
                                className="px-4 py-2 hover:bg-purple-600/30 cursor-pointer text-white"
                              >
                                {lang}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button type="button" onClick={() => addLanguage()} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.languages.map((lang, index) => (
                        <motion.span key={index} initial={{ scale: 0 }} animate={{ scale: 1 }} className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-white flex items-center gap-2">
                          {lang}
                          <button type="button" onClick={() => removeLanguage(lang)} className="text-red-400 hover:text-red-300">×</button>
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'resume' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Resume & Documents</h2>
                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                    <input type="checkbox" name="is_fresher" checked={profile.is_fresher} onChange={handleProfileChange} className="w-5 h-5 rounded text-purple-600" />
                    <label className="text-white">I am a fresher (No work experience)</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Upload Resume (PDF)</label>
                    <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-purple-500 transition-colors">
                      <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e, 'resume')} className="hidden" id="resume-upload" />
                      <label htmlFor="resume-upload" className="cursor-pointer">
                        <div className="text-4xl mb-3">📄</div>
                        <p className="text-white mb-1">{profile.resume instanceof File ? profile.resume.name : (profile.resume ? 'resume.pdf' : 'Click to upload your resume')}</p>
                        <p className="text-gray-500 text-sm">PDF files only, max 5MB</p>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'employment' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Employment History</h2>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                    <h3 className="text-white font-semibold">Add New Employment</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Company</label>
                        <input type="text" value={newEmployment.company} onChange={(e) => setNewEmployment({...newEmployment, company: e.target.value})} placeholder="Google, Microsoft..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Job Title</label>
                        <input type="text" value={newEmployment.job_title} onChange={(e) => setNewEmployment({...newEmployment, job_title: e.target.value})} placeholder="Software Engineer..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                        <input type="text" value={newEmployment.start_date} onChange={(e) => setNewEmployment({...newEmployment, start_date: e.target.value})} placeholder="Jan 2020" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                        <input type="text" value={newEmployment.end_date} onChange={(e) => setNewEmployment({...newEmployment, end_date: e.target.value})} placeholder="Present" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                      <textarea value={newEmployment.description} onChange={(e) => setNewEmployment({...newEmployment, description: e.target.value})} rows={2} placeholder="Describe your responsibilities..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500 resize-none" />
                    </div>
                    <button type="button" onClick={addEmployment} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-semibold">+ Add Employment</button>
                  </div>
                  <div className="space-y-3">
                    {profile.employment_history?.map((emp) => (
                      <motion.div key={emp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-start">
                        <div>
                          <h4 className="text-white font-semibold">{emp.job_title}</h4>
                          <p className="text-gray-400">{emp.company}</p>
                          <p className="text-gray-500 text-sm">{emp.start_date} - {emp.end_date}</p>
                        </div>
                        <button type="button" onClick={() => removeEmployment(emp.id)} className="text-red-400 hover:text-red-300 p-2">🗑️</button>
                      </motion.div>
                    ))}
                    {(!profile.employment_history || profile.employment_history.length === 0) && <p className="text-gray-500 text-center py-4">No employment history added yet</p>}
                  </div>
                </div>
              )}

              {activeTab === 'internships' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Internships</h2>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                    <h3 className="text-white font-semibold">Add New Internship</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Company</label>
                        <input type="text" value={newInternship.company} onChange={(e) => setNewInternship({...newInternship, company: e.target.value})} placeholder="Google, Microsoft..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                        <input type="text" value={newInternship.role} onChange={(e) => setNewInternship({...newInternship, role: e.target.value})} placeholder="Software Development Intern..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                        <input type="text" value={newInternship.start_date} onChange={(e) => setNewInternship({...newInternship, start_date: e.target.value})} placeholder="Jun 2023" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                        <input type="text" value={newInternship.end_date} onChange={(e) => setNewInternship({...newInternship, end_date: e.target.value})} placeholder="Aug 2023" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                      </div>
                    </div>
                    <button type="button" onClick={addInternship} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-semibold">+ Add Internship</button>
                  </div>
                  <div className="space-y-3">
                    {profile.internships?.map((intern) => (
                      <motion.div key={intern.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-start">
                        <div>
                          <h4 className="text-white font-semibold">{intern.role}</h4>
                          <p className="text-gray-400">{intern.company}</p>
                          <p className="text-gray-500 text-sm">{intern.start_date} - {intern.end_date}</p>
                        </div>
                        <button type="button" onClick={() => removeInternship(intern.id)} className="text-red-400 hover:text-red-300 p-2">🗑️</button>
                      </motion.div>
                    ))}
                    {(!profile.internships || profile.internships.length === 0) && <p className="text-gray-500 text-center py-4">No internships added yet</p>}
                  </div>
                </div>
              )}

              {activeTab === 'education' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Education</h2>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                    <h3 className="text-white font-semibold">Add New Education</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Education Type</label>
                        <select value={newEducation.type} onChange={(e) => setNewEducation({...newEducation, type: e.target.value})} className="w-full px-4 py-3 bg-white border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-black">
                          {educationTypes.map(type => (<option key={type.value} value={type.value}>{type.label}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Institution / University</label>
                        <input type="text" value={newEducation.institution} onChange={(e) => setNewEducation({...newEducation, institution: e.target.value})} placeholder="IIT Delhi, DU, CBSE School..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Field of Study</label>
                        <input type="text" value={newEducation.field} onChange={(e) => setNewEducation({...newEducation, field: e.target.value})} placeholder="Computer Science, Commerce..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Grade / Percentage</label>
                        <input type="text" value={newEducation.grade} onChange={(e) => setNewEducation({...newEducation, grade: e.target.value})} placeholder="9.5 CGPA, 85%, A Grade..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Start Year</label>
                        <input type="text" value={newEducation.start_year} onChange={(e) => setNewEducation({...newEducation, start_year: e.target.value})} placeholder="2018" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">End Year</label>
                        <input type="text" value={newEducation.end_year} onChange={(e) => setNewEducation({...newEducation, end_year: e.target.value})} placeholder="2022" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                      </div>
                    </div>
                    <button type="button" onClick={addEducation} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-semibold">+ Add Education</button>
                  </div>
                  <div className="space-y-3">
                    {profile.education?.map((edu) => (
                      <motion.div key={edu.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-start">
                        <div>
                          <h4 className="text-white font-semibold">{educationTypes.find(t => t.value === edu.type)?.label || edu.type}</h4>
                          <p className="text-gray-400">{edu.institution} {edu.field && `- ${edu.field}`}</p>
                          <p className="text-gray-500 text-sm">{edu.start_year} - {edu.end_year} | Grade: {edu.grade}</p>
                        </div>
                        <button type="button" onClick={() => removeEducation(edu.id)} className="text-red-400 hover:text-red-300 p-2">🗑️</button>
                      </motion.div>
                    ))}
                    {(!profile.education || profile.education.length === 0) && <p className="text-gray-500 text-center py-4">No education added yet</p>}
                  </div>
                </div>
              )}

              {activeTab === 'projects' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Projects</h2>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                    <h3 className="text-white font-semibold">Add New Project</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Project Title *</label>
                      <input type="text" value={newProject.title} onChange={(e) => setNewProject({...newProject, title: e.target.value})} placeholder="E-Commerce Website, AI Chatbot..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                      <textarea value={newProject.description} onChange={(e) => setNewProject({...newProject, description: e.target.value})} rows={2} placeholder="What did you build?" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500 resize-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Technologies Used</label>
                      <input type="text" value={newProject.technologies} onChange={(e) => setNewProject({...newProject, technologies: e.target.value})} placeholder="React, Node.js, MongoDB..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Project Link</label>
                      <input type="url" value={newProject.link} onChange={(e) => setNewProject({...newProject, link: e.target.value})} placeholder="https://github.com/yourproject" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                    </div>
                    <button type="button" onClick={addProject} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-semibold">+ Add Project</button>
                  </div>
                  <div className="space-y-3">
                    {profile.projects?.map((proj) => (
                      <motion.div key={proj.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold">{proj.title}</h4>
                          <p className="text-gray-400 text-sm">{proj.description}</p>
                          {proj.technologies && <p className="text-purple-400 text-sm mt-1">Tech: {proj.technologies}</p>}
                          {proj.link && <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline">View Project →</a>}
                        </div>
                        <button type="button" onClick={() => removeProject(proj.id)} className="text-red-400 hover:text-red-300 p-2">🗑️</button>
                      </motion.div>
                    ))}
                    {(!profile.projects || profile.projects.length === 0) && <p className="text-gray-500 text-center py-4">No projects added yet</p>}
                  </div>
                </div>
              )}

              {activeTab === 'accomplishments' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Awards & Accomplishments</h2>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                    <h3 className="text-white font-semibold">Add New Award</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                      <input type="text" value={newAccomplishment.title} onChange={(e) => setNewAccomplishment({...newAccomplishment, title: e.target.value})} placeholder="1st Place in Hackathon, Best Developer Award..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Organization</label>
                      <input type="text" value={newAccomplishment.organization} onChange={(e) => setNewAccomplishment({...newAccomplishment, organization: e.target.value})} placeholder="Google, IEEE, University..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                      <input type="text" value={newAccomplishment.date} onChange={(e) => setNewAccomplishment({...newAccomplishment, date: e.target.value})} placeholder="December 2023" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                      <textarea value={newAccomplishment.description} onChange={(e) => setNewAccomplishment({...newAccomplishment, description: e.target.value})} rows={2} placeholder="Brief description..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500 resize-none" />
                    </div>
                    <button type="button" onClick={addAccomplishment} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-semibold">+ Add Award</button>
                  </div>
                  <div className="space-y-3">
                    {profile.accomplishments?.map((acc) => (
                      <motion.div key={acc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-start">
                        <div>
                          <h4 className="text-white font-semibold">{acc.title}</h4>
                          <p className="text-gray-400">{acc.organization}</p>
                          <p className="text-gray-500 text-sm">{acc.date}</p>
                        </div>
                        <button type="button" onClick={() => removeAccomplishment(acc.id)} className="text-red-400 hover:text-red-300 p-2">🗑️</button>
                      </motion.div>
                    ))}
                    {(!profile.accomplishments || profile.accomplishments.length === 0) && <p className="text-gray-500 text-center py-4">No awards/accomplishments added yet</p>}
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Job Preferences</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Job Type</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['Full-time', 'Part-time', 'Contract', 'Internship'].map(type => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={profile.preferred_job_type?.includes(type)} onChange={(e) => setProfile(prev => ({ ...prev, preferred_job_type: e.target.checked ? [...(prev.preferred_job_type || []), type] : prev.preferred_job_type?.filter(t => t !== type) || [] }))} className="w-4 h-4 rounded text-purple-600" />
                          <span className="text-white">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Industry</label>
                    <select name="preferred_industry" value={profile.preferred_industry} onChange={handleProfileChange} className="w-full px-4 py-3 bg-white border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-black">
                      <option value="">Select Industry</option>
                      <option value="IT">Information Technology</option>
                      <option value="Finance">Finance & Banking</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Education">Education</option>
                      <option value="Retail">Retail & E-commerce</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Marketing">Marketing & Advertising</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Expected CTC (₹)</label>
                    <input type="text" name="expected_salary" value={profile.expected_salary} onChange={handleProfileChange} placeholder="8 LPA, 15,00,000" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Notice Period</label>
                    <select name="notice_period" value={profile.notice_period} onChange={handleProfileChange} className="w-full px-4 py-3 bg-white border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-black">
                      <option value="">Select Notice Period</option>
                      <option value="immediate">Immediate</option>
                      <option value="15_days">15 Days</option>
                      <option value="1_month">1 Month</option>
                      <option value="2_months">2 Months</option>
                      <option value="3_months">3 Months</option>
                      <option value="more_than_3_months">More than 3 Months</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                    <input type="checkbox" name="willing_to_relocate" checked={profile.willing_to_relocate} onChange={handleProfileChange} className="w-5 h-5 rounded text-purple-600" />
                    <label className="text-white">Willing to relocate</label>
                  </div>
                </div>
              )}

              {activeTab === 'personal' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Personal Details</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth</label>
                      <input type="date" name="date_of_birth" value={profile.date_of_birth} onChange={handleProfileChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
                      <select name="gender" value={profile.gender} onChange={handleProfileChange} className="w-full px-4 py-3 bg-white border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-black">
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Marital Status</label>
                    <select name="marital_status" value={profile.marital_status} onChange={handleProfileChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white">
                      <option value="">Select Status</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                    </select>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Father's Name</label>
                      <input type="text" name="father_name" value={profile.father_name} onChange={handleProfileChange} placeholder="Enter father's name" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Mother's Name</label>
                      <input type="text" name="mother_name" value={profile.mother_name} onChange={handleProfileChange} placeholder="Enter mother's name" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-gray-500" />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-white/10">
                <motion.button type="button" onClick={handleSubmit} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-white shadow-lg hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50">
                  {saving ? <span className="flex items-center justify-center gap-2"><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />Saving...</span> : 'Save Profile'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
