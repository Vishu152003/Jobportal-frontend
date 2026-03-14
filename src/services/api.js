import axios from 'axios';

const API_URL = window.location.hostname === "localhost"
    ? "http://localhost:8000/api"
    : "https://job-portal-backend-7e27.onrender.com/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API - Matching backend endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  getUser: () => api.get('/auth/me/'),
  verifyToken: () => api.get('/auth/me/'),
  updateUser: (data) => api.patch('/auth/profile/', data),
  updateProfile: (data) => api.patch('/auth/profile/seeker/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
  getProfile: () => api.get('/auth/profile/seeker/'),
  getProfileDetail: (id) => api.get(`/auth/profiles/${id}/`),
  blockUser: (userId, blocked) => api.post(`/auth/users/${userId}/block/`, { blocked }),

  deleteUser: (userId) => api.delete(`/auth/users/${userId}/delete/`),
  requestPasswordReset: (data) => api.post('/auth/password-reset/', data),
  resetPassword: (data) => api.post('/auth/password-reset-direct/', data),
};

// Profile API - For job seeker profile management
export const profileAPI = {
  get: () => api.get('/auth/profile/seeker/'),
  update: (data) => api.patch('/auth/profile/seeker/', data),
  uploadResume: (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    // Don't set Content-Type header - let axios set it with proper boundary
    return api.patch('/auth/profile/seeker/', formData);
  },
  uploadPhoto: (file) => {
    const formData = new FormData();
    formData.append('profile_photo', file);
    // Don't set Content-Type header - let axios set it with proper boundary
    return api.patch('/auth/profile/seeker/', formData);
  },
};

// Company API - For recruiter profile management
export const companyAPI = {
  get: () => api.get('/auth/profile/company/'),
  update: (data) => api.patch('/auth/profile/company/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadLogo: (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.patch('/auth/profile/company/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// Jobs API
export const jobsAPI = {
  list: (params) => api.get('/jobs/', { params }),
  get: (id) => api.get(`/jobs/${id}/`),
  create: (data) => api.post('/jobs/', data),
  update: (id, data) => api.put(`/jobs/${id}/`, data),
  delete: (id) => api.delete(`/jobs/${id}/`),
  myJobs: () => api.get('/jobs/my-jobs/'),
  pending: () => api.get('/jobs/pending/'),
  approve: (id) => api.post(`/jobs/${id}/approve/`),
  reject: (id) => api.post(`/jobs/${id}/reject/`),
  // Saved Jobs
  getSavedJobs: () => api.get('/jobs/saved-jobs/'),
  saveJob: (jobId) => api.post(`/jobs/${jobId}/save_job/`),
  unsaveJob: (jobId) => api.post(`/jobs/${jobId}/unsave_job/`),
  checkSaved: (jobId) => api.get(`/jobs/${jobId}/check_saved/`),
};

// Applications API
export const applicationsAPI = {
  list: () => api.get('/applications/'),
  get: (id) => api.get(`/applications/${id}/`),
  create: (data) => {
    // If data is FormData, let axios handle the Content-Type with boundary
    if (data instanceof FormData) {
      return api.post('/applications/', data);
    }
    return api.post('/applications/', data);
  },
  myApplications: () => api.get('/applications/my_applications/'),
  jobApplicants: (jobId) => api.get(`/applications/job/${jobId}/`),
  myJobApplicants: () => api.get('/applications/my-job-applicants/'),
  stats: () => api.get('/applications/stats/'),
  updateStatus: (id, status) => api.post(`/applications/${id}/update_status/`, { status }),
  recalculateScores: (jobId) => api.post('/applications/recalculate-scores/', { job_id: jobId }),
  dashboardStats: () => api.get('/auth/jobseeker-dashboard/'),
};

// Ideas API
export const ideasAPI = {
  list: (params) => api.get('/ideas/', { params }),
  get: (id) => api.get(`/ideas/${id}/`),
  create: (data) => api.post('/ideas/', data),
  update: (id, data) => api.put(`/ideas/${id}/`, data),
  delete: (id) => api.delete(`/ideas/${id}/`),
  vote: (id, voteType) => api.post(`/ideas/${id}/vote/`, { vote_type: voteType }),
  bookmark: (id) => api.post(`/ideas/${id}/bookmark/`),
  report: (id, reason) => api.post(`/ideas/${id}/report/`, { reason }),
  getComments: (id) => api.get(`/ideas/${id}/comments/`),
  addComment: (id, data) => api.post(`/ideas/${id}/comments/`, data),
  myIdeas: () => api.get('/ideas/my-ideas/'),
  pending: () => api.get('/ideas/pending/'),
  reported: () => api.get('/ideas/reported/'),
  approve: (id) => api.post(`/ideas/${id}/approve/`),
  reject: (id) => api.post(`/ideas/${id}/reject/`),
  categories: () => api.get('/ideas/categories/'),
};

// Bookmarks API
export const bookmarksAPI = {
  list: () => api.get('/ideas/bookmarks/'),
  add: (ideaId) => api.post('/ideas/bookmarks/', { idea: ideaId }),
  remove: (id) => api.delete(`/ideas/bookmarks/${id}/`),
};

// AI API
export const aiAPI = {
  matchResume: (jobId, resumeFile) => {
    const formData = new FormData();
    formData.append('job_id', jobId);
    formData.append('resume', resumeFile);
    return api.post('/ai/match-resume/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  recommendJobs: () => api.post('/ai/recommend-jobs/'),
  analyzeIdea: (data) => api.post('/ai/analyze-idea/', data),
  parseResume: (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post('/ai/parse-resume/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  jobMatchDetails: (jobId) => api.post('/ai/job-match-details/', { job_id: jobId }),
};

// Analytics API
export const analyticsAPI = {
  dashboard: () => api.get('/analytics/dashboard/'),
  users: () => api.get('/analytics/users/'),
  jobs: () => api.get('/analytics/jobs/'),
  applications: () => api.get('/analytics/applications/'),
  ideas: () => api.get('/analytics/ideas/'),
  skills: () => api.get('/analytics/skills/'),
  homeStats: () => api.get('/analytics/home-stats/'),
  featuredJobs: () => api.get('/analytics/featured-jobs/'),
  featuredCompanies: () => api.get('/analytics/featured-companies/'),
};

// Admin User Management API
export const adminAPI = {
  getUsers: (params) => api.get('/auth/users/', { params }),
  getUser: (id) => api.get(`/auth/users/${id}/`),
  blockUser: (userId) => api.post(`/auth/users/${userId}/block/`),
  deleteUser: (id) => api.delete(`/auth/users/${id}/`),
  getReportedIdeas: () => api.get('/ideas/reported/'),
  removeIdea: (id) => api.delete(`/ideas/${id}/`),
};

// Chat API
export const chatAPI = {
  // Conversations
  getConversations: () => api.get('/chat/conversations/'),
  getConversation: (id) => api.get(`/chat/conversations/${id}/`),
  createConversation: (data) => api.post('/chat/conversations/', data),
  deleteConversation: (id) => api.delete(`/chat/conversations/${id}/`),
  
  // Messages
  getMessages: (conversationId) => api.get(`/chat/conversations/${conversationId}/messages/`),
  sendMessage: (conversationId, data) => api.post(`/chat/conversations/${conversationId}/messages/`, data),
  markAsRead: (conversationId) => api.post(`/chat/conversations/${conversationId}/mark_read/`),
  
  // Interview Details (Recruiter)
  sendInterviewDetails: (conversationId, data) => api.post(`/chat/conversations/${conversationId}/send_interview_details/`, data),
  getEligibleForChat: () => api.get('/chat/conversations/eligible_for_chat/'),
  
  // Interview Response (Jobseeker)
  respondToInterview: (conversationId, data) => api.post(`/chat/conversations/${conversationId}/respond_to_interview/`, data),
  
  // Final Selection (Recruiter)
  finalSelection: (conversationId, data) => api.post(`/chat/conversations/${conversationId}/final_selection/`, data),
  
  // Application Chat
  getApplicationConversation: (applicationId) => api.get(`/applications/${applicationId}/get_conversation/`),
};

// Notifications API
export const notificationAPI = {
  getNotifications: () => api.get('/notifications/'),
  getUnreadCount: () => api.get('/notifications/unread_count/'),
  markAsRead: (id) => api.post(`/notifications/${id}/mark_read/`),
  markAllAsRead: () => api.post('/notifications/mark_all_read/'),
  deleteNotification: (id) => api.delete(`/notifications/${id}/`),
  clearAll: () => api.delete('/notifications/clear_all/'),
  getSettings: () => api.get('/notifications/settings/'),
  updateSettings: (data) => api.patch('/notifications/settings/', data),
};

export default api;

