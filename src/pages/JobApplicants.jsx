import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { jobsAPI, applicationsAPI, chatAPI, profileAPI } from '../services/api';

const JobApplicants = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [selectionAction, setSelectionAction] = useState('');
  const [selectionNotes, setSelectionNotes] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchJobAndApplicants();
  }, [jobId]);

  const fetchJobAndApplicants = async () => {
    setLoading(true);
    try {
      const jobRes = await jobsAPI.get(jobId);
      setJob(jobRes.data);

      const appsRes = await applicationsAPI.jobApplicants(jobId);
      setApplicants(Array.isArray(appsRes.data) ? appsRes.data : appsRes.data.results || []);
    } catch (err) {
      console.error('Error fetching job applicants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (applicantId, status) => {
    try {
      await applicationsAPI.updateStatus(applicantId, status);
      setApplicants(applicants.map(app => 
        app.id === applicantId ? { ...app, status } : app
      ));
      setSelectedApplicant(null);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const handleFinalSelection = async () => {
    if (!conversationId || !selectionAction) return;

    setUpdating(true);
    try {
      await chatAPI.finalSelection(conversationId, {
        action: selectionAction,
        selection_notes: selectionNotes
      });
      
      // Update the local state
      const newStatus = selectionAction === 'selected' ? 'offered' : 'rejected';
      setApplicants(applicants.map(app => 
        app.id === selectedApplicant.id ? { ...app, status: newStatus } : app
      ));
      
      setShowSelectionModal(false);
      setSelectionAction('');
      setSelectionNotes('');
      setSelectedApplicant(null);
      
      alert(selectionAction === 'selected' 
        ? 'Candidate has been selected! Notification sent to candidate.'
        : 'Candidate has been notified about the decision.');
    } catch (err) {
      console.error('Error making final selection:', err);
      alert('Failed to make final selection');
    } finally {
      setUpdating(false);
    }
  };

  const openSelectionModal = async (applicant, action) => {
    setSelectionAction(action);
    setSelectionNotes('');
    
    // Try to get conversation ID from the applicant
    if (applicant.conversation_id) {
      setConversationId(applicant.conversation_id);
      setShowSelectionModal(true);
    } else {
      // Try to get conversation through application
      try {
        const convRes = await applicationsAPI.getApplicationConversation(applicant.id);
        if (convRes.data && convRes.data.conversation && convRes.data.conversation.id) {
          setConversationId(convRes.data.conversation.id);
        } else {
          // Try to find conversation through chat API
          const eligibleRes = await chatAPI.getEligibleForChat();
          const eligible = eligibleRes.data.find(e => e.application_id === applicant.id);
          if (eligible && eligible.conversation_id) {
            setConversationId(eligible.conversation_id);
          } else {
            alert('No conversation found with this candidate. Please start a chat first.');
            return;
          }
        }
      } catch (err) {
        console.error('Error getting conversation:', err);
        alert('Could not find conversation with this candidate. Please start a chat first.');
        return;
      }
      
      setShowSelectionModal(true);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    interview: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    offered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    hired: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return '✅';
      case 'rejected': return '❌';
      case 'interview': return '📅';
      case 'offered': return '🎉';
      case 'hired': return '🎊';
      default: return '⏳';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4">
            ← Back
          </button>
          {job ? (
            <>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Applicants for {job.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {job.company_name || 'Company'} • {applicants.length} applicants
              </p>
            </>
          ) : (
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Job Applicants
            </h1>
          )}
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{applicants.length}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{applicants.filter(a => a.status === 'pending' || a.status === 'applied').length}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{applicants.filter(a => a.status === 'interview').length}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Interview</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{applicants.filter(a => a.status === 'offered' || a.status === 'hired').length}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Offered/Hired</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{applicants.filter(a => a.status === 'rejected').length}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Rejected</div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Candidates for {job?.title || 'Job'}</h3>
                <button
                  onClick={async () => {
                    try {
                      await applicationsAPI.recalculateScores(jobId);
                      await fetchJobAndApplicants();
                      alert('Match scores recalculated successfully!');
                    } catch (err) {
                      console.error('Error recalculating scores:', err);
                      alert('Failed to recalculate scores');
                    }
                  }}
                  className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl font-medium hover:bg-blue-200"
                >
                  🔄 Recalculate Scores
                </button>
              </div>
              {applicants.length > 0 ? (
                <div className="space-y-4">
                  {applicants.map((app, index) => (
                    <motion.div key={app.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                              {index + 1}️⃣
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {(app.seeker?.username || 'A')[0].toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{app.seeker?.username || 'Applicant'}</h4>
                              {app.match_score && (
                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                  app.match_score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                  app.match_score >= 60 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                  {Math.round(app.match_score)}% Match
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              Applied {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recently'}
                            </p>
                            {app.match_breakdown && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div className="bg-white dark:bg-gray-600 rounded-lg p-2 text-center">
                                  <div className="font-semibold text-gray-900 dark:text-white">{app.match_breakdown.skill_match}%</div>
                                  <div className="text-gray-500 dark:text-gray-400">Skills</div>
                                </div>
                                <div className="bg-white dark:bg-gray-600 rounded-lg p-2 text-center">
                                  <div className="font-semibold text-gray-900 dark:text-white">{app.match_breakdown.experience_match}%</div>
                                  <div className="text-gray-500 dark:text-gray-400">Experience</div>
                                </div>
                                <div className="bg-white dark:bg-gray-600 rounded-lg p-2 text-center">
                                  <div className="font-semibold text-gray-900 dark:text-white">{app.match_breakdown.education_match}%</div>
                                  <div className="text-gray-500 dark:text-gray-400">Education</div>
                                </div>
                                <div className="bg-white dark:bg-gray-600 rounded-lg p-2 text-center">
                                  <div className="font-semibold text-gray-900 dark:text-white">{app.match_breakdown.profile_completeness}%</div>
                                  <div className="text-gray-500 dark:text-gray-400">Profile</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-4 py-2 rounded-full text-sm font-semibold capitalize ${statusColors[app.status] || statusColors.pending}`}>
                            {getStatusIcon(app.status)} {app.status || 'Pending'}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedApplicant(app)}
                              className="flex-1 px-4 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl font-medium hover:bg-violet-200"
                            >
                              View Details
                            </button>
                            {app.seeker?.profile_id && (
                              <button
                                onClick={async () => {
                                  try {
                                await profileAPI.getProfileDetail(app.seeker.profile_id);
                                    console.log('Profile view triggered for profile:', app.seeker.profile_id);
                                    alert('Profile viewed! Check jobseeker dashboard - profile_views incremented.');
                                  } catch (err) {
                                    console.error('Profile view error:', err);
                                    alert('Error viewing profile');
                                  }
                                }}
                                className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl font-medium hover:bg-blue-200 flex items-center gap-1"
                              >
                                👁️ View Profile
                              </button>
                            )}

                          </div>

                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No applicants yet</h4>
                  <p className="text-gray-500 dark:text-gray-400">This job hasn't received any applications yet</p>
                </div>
              )}
            </div>
          </>
        )}

        <AnimatePresence>
          {selectedApplicant && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedApplicant(null)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                        {(selectedApplicant.seeker?.username || 'A')[0].toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedApplicant.seeker?.username || 'Applicant'}</h2>
                        <p className="text-gray-500 dark:text-gray-400">{selectedApplicant.seeker?.email || 'Email not available'}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedApplicant(null)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700">✕</button>
                  </div>

                  <div className="space-y-4">
                    {selectedApplicant.seeker_email && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📧 Email</h4>
                        <p className="text-gray-700 dark:text-gray-300">{selectedApplicant.seeker_email}</p>
                      </div>
                    )}
                    
                    {selectedApplicant.seeker_phone && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📱 Phone</h4>
                        <p className="text-gray-700 dark:text-gray-300">{selectedApplicant.seeker_phone}</p>
                      </div>
                    )}
                    
                    {selectedApplicant.seeker_location && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📍 Location</h4>
                        <p className="text-gray-700 dark:text-gray-300">{selectedApplicant.seeker_location}</p>
                      </div>
                    )}

                    {selectedApplicant.seeker_experience && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">💼 Experience</h4>
                        <p className="text-gray-700 dark:text-gray-300">{selectedApplicant.seeker_experience}</p>
                      </div>
                    )}
                    
                    {selectedApplicant.seeker_skills && selectedApplicant.seeker_skills.length > 0 && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🛠️ Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedApplicant.seeker_skills.map((skill, index) => (
                            <span key={index} className="px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full text-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(selectedApplicant.seeker_linkedin || selectedApplicant.seeker_github || selectedApplicant.seeker_portfolio) && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">🔗 Social Links</h4>
                        <div className="flex flex-wrap gap-3">
                          {selectedApplicant.seeker_linkedin && (
                            <a href={selectedApplicant.seeker_linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-200">
                              <span>💼</span> LinkedIn
                            </a>
                          )}
                          {selectedApplicant.seeker_github && (
                            <a href={selectedApplicant.seeker_github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-gray-800 dark:bg-gray-600 text-white rounded-xl hover:bg-gray-700">
                              <span>💻</span> GitHub
                            </a>
                          )}
                          {selectedApplicant.seeker_portfolio && (
                            <a href={selectedApplicant.seeker_portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-200">
                              <span>🌐</span> Portfolio
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedApplicant.resume_url && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📄 Resume</h4>
                        <a href={selectedApplicant.resume_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline">
                          <span>📎 View/Download Resume</span>
                        </a>
                      </div>
                    )}

                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Application Status</h4>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold capitalize ${statusColors[selectedApplicant.status] || statusColors.pending}`}>
                        {selectedApplicant.status || 'Pending'}
                      </span>
                    </div>

                    {selectedApplicant.match_score && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">AI Match Score</h4>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                selectedApplicant.match_score >= 80 ? 'bg-green-500' : 
                                selectedApplicant.match_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${selectedApplicant.match_score}%` }}
                            />
                          </div>
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(selectedApplicant.match_score)}%</span>
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Applied On</h4>
                      <p className="text-gray-700 dark:text-gray-300">
                        {selectedApplicant.applied_at ? new Date(selectedApplicant.applied_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-4">
                      <button 
                        onClick={() => handleUpdateStatus(selectedApplicant.id, 'interview')}
                        className="flex-1 py-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl font-semibold hover:bg-purple-200"
                      >
                        📅 Schedule Interview
                      </button>
                      
                      {/* Final Selection Buttons - Show when status is interview or offered */}
                      {(selectedApplicant.status === 'interview' || selectedApplicant.status === 'offered') && (
                        <>
                          <button 
                            onClick={() => openSelectionModal(selectedApplicant, 'selected')}
                            className="flex-1 py-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl font-semibold hover:bg-green-200"
                          >
                            🎉 Mark as Selected
                          </button>
                          <button 
                            onClick={() => openSelectionModal(selectedApplicant, 'rejected')}
                            className="flex-1 py-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-semibold hover:bg-red-200"
                          >
                            ❌ Not Selected
                          </button>
                        </>
                      )}
                      
                      {/* Show accept/reject for non-interview statuses */}
                      {selectedApplicant.status !== 'interview' && selectedApplicant.status !== 'offered' && selectedApplicant.status !== 'hired' && (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(selectedApplicant.id, 'accepted')}
                            className="flex-1 py-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl font-semibold hover:bg-green-200"
                          >
                            ✅ Accept
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(selectedApplicant.id, 'rejected')}
                            className="flex-1 py-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-semibold hover:bg-red-200"
                          >
                            ❌ Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Final Selection Modal */}
        <AnimatePresence>
          {showSelectionModal && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowSelectionModal(false)}
            >
              <motion.div 
                initial={{ scale: 0.9 }} 
                animate={{ scale: 1 }} 
                exit={{ scale: 0.9 }} 
                onClick={(e) => e.stopPropagation()} 
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectionAction === 'selected' ? '🎉 Confirm Selection' : '❌ Confirm Decision'}
                    </h2>
                    <button 
                      onClick={() => setShowSelectionModal(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {selectionAction === 'selected' 
                      ? `You are about to select ${selectedApplicant.seeker?.username} for this position. This will notify the candidate.`
                      : `You are about to notify ${selectedApplicant.seeker?.username} that they were not selected. This action cannot be undone.`}
                  </p>
                  
                  <div className="mb-4">
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Add a message (optional):
                    </label>
                    <textarea
                      value={selectionNotes}
                      onChange={(e) => setSelectionNotes(e.target.value)}
                      placeholder={selectionAction === 'selected' 
                        ? "Congratulations! Add a personalized message..." 
                        : "Add any additional feedback or reasons..."}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={handleFinalSelection}
                      disabled={updating}
                      className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                        selectionAction === 'selected'
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      } disabled:opacity-50`}
                    >
                      {updating ? 'Processing...' : selectionAction === 'selected' ? '✅ Confirm Selection' : '❌ Confirm Decision'}
                    </button>
                    <button 
                      onClick={() => setShowSelectionModal(false)}
                      className="px-6 py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600"
                    >
                      Cancel
                    </button>
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

export default JobApplicants;
