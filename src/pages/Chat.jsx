import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { chatAPI } from '../services/api';

const Chat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [interviewDetails, setInterviewDetails] = useState({
    interview_date: '',
    interview_time: '',
    interview_mode: 'online',
    meeting_link: '',
    hr_contact: '',
    required_documents: '',
    interview_notes: ''
  });
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const role = user?.role || localStorage.getItem('userRole') || 'seeker';
  const isRecruiter = role === 'recruiter';

  const connectWebSocket = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:8000/ws/chat/`;
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found');
      return;
    }

    try {
      const ws = new WebSocket(`${wsUrl}?token=${token}`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_message') {
          if (selectedConversation && data.conversation_id === selectedConversation.id) {
            setMessages(prev => [...prev, {
              id: Date.now(),
              content: data.message,
              sender: { id: data.sender_id, username: data.sender_username },
              created_at: new Date().toISOString(),
            }]);
          }
          
          setConversations(prev => prev.map(conv => 
            conv.id === data.conversation_id 
              ? { ...conv, last_message: { content: data.message }, updated_at: new Date().toISOString() }
              : conv
          ).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [selectedConversation]);

  useEffect(() => {
    fetchConversations();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const res = await chatAPI.getConversations();
      setConversations(res.data.results || res.data || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const res = await chatAPI.getMessages(conversationId);
      setMessages(res.data.results || res.data || []);
      await chatAPI.markAsRead(conversationId);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      const res = await chatAPI.sendMessage(selectedConversation.id, {
        content: newMessage.trim()
      });
      
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const recipient = selectedConversation.participants?.find(p => p.id !== user?.id);
        if (recipient) {
          wsRef.current.send(JSON.stringify({
            type: 'chat_message',
            message: newMessage.trim(),
            recipient_id: recipient.id,
            conversation_id: selectedConversation.id,
          }));
        }
      }
      
      setConversations(prev => {
        const updated = prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, last_message: { content: newMessage.trim() }, updated_at: new Date().toISOString() }
            : conv
        );
        return updated.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      });
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSendInterviewDetails = async (e) => {
    e.preventDefault();
    if (!selectedConversation) return;

    setSending(true);
    try {
      const res = await chatAPI.sendInterviewDetails(selectedConversation.id, interviewDetails);
      setSelectedConversation(res.data);
      setShowInterviewForm(false);
      setInterviewDetails({
        interview_date: '',
        interview_time: '',
        interview_mode: 'online',
        meeting_link: '',
        hr_contact: '',
        required_documents: '',
        interview_notes: ''
      });
      alert('Interview details sent successfully!');
    } catch (err) {
      console.error('Error sending interview details:', err);
      alert('Failed to send interview details');
    } finally {
      setSending(false);
    }
  };

  const handleInterviewResponse = async (action) => {
    if (!selectedConversation) return;
    
    console.log('=== INTERVIEW RESPONSE DEBUG ===');
    console.log('Conversation ID:', selectedConversation.id);
    console.log('Action:', action);
    console.log('User role:', user?.role);
    console.log('Interview date:', selectedConversation.interview_date);
    console.log('Interview time:', selectedConversation.interview_time);
    console.log('================================');
    
    if (action === 'reschedule') {
      setShowRescheduleModal(true);
      return;
    }

    if (!window.confirm(`Are you sure you want to ${action} this interview?`)) return;

    setSending(true);
    try {
      const url = `/chat/conversations/${selectedConversation.id}/respond_to_interview/`;
      console.log('Calling API:', url);
      
      const res = await chatAPI.respondToInterview(selectedConversation.id, { action, reschedule_reason: '' });
      console.log('API Response:', res.data);
      setSelectedConversation(res.data);
      alert(`Interview ${action}ed successfully!`);
      fetchMessages(selectedConversation.id);
    } catch (err) {
      console.error('Error responding to interview:', err);
      console.log('Error response:', err.response);
      console.log('Error status:', err.response?.status);
      console.log('Error data:', err.response?.data);
      
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || err.message || 'Unknown error';
      alert(`Failed to respond to interview.\n\nError: ${errorMessage}\n\nMake sure:\n1. The recruiter has scheduled an interview\n2. You are logged in as a jobseeker\n3. A conversation exists between you and the recruiter`);
    } finally {
      setSending(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedConversation || !rescheduleReason.trim()) {
      alert('Please provide a reason for reschedule');
      return;
    }

    setSending(true);
    try {
      const res = await chatAPI.respondToInterview(selectedConversation.id, { 
        action: 'reschedule', 
        reschedule_reason: rescheduleReason 
      });
      setSelectedConversation(res.data);
      setShowRescheduleModal(false);
      setRescheduleReason('');
      alert('Reschedule request sent successfully!');
      fetchMessages(selectedConversation.id);
    } catch (err) {
      console.error('Error requesting reschedule:', err);
      alert('Failed to request reschedule');
    } finally {
      setSending(false);
    }
  };

  const handleFinalSelection = async (action) => {
    if (!selectedConversation) return;
    
    if (!window.confirm(`Are you sure you want to mark this candidate as ${action}?`)) return;

    setSending(true);
    try {
      const res = await chatAPI.finalSelection(selectedConversation.id, {
        action: action,
        selection_notes: ''
      });
      setSelectedConversation(res.data);
      alert(`Candidate marked as ${action}!`);
      fetchMessages(selectedConversation.id);
    } catch (err) {
      console.error('Error making final selection:', err);
      alert('Failed to update selection status');
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = (conversation) => {
    if (!conversation) return { username: 'Unknown', role: '' };
    const other = conversation.participants?.find(p => p.id !== user?.id);
    if (other) return other;
    return { username: 'Unknown User', role: '' };
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getConversationPreview = (conversation) => {
    const other = getOtherParticipant(conversation);
    const lastMessage = conversation.last_message?.content || 'No messages yet';
    return { other, lastMessage };
  };

  const hasInterviewDetails = (conv) => {
    return conv?.interview_date && conv?.interview_time;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-12 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                💬 Messages
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isRecruiter ? 'Chat with job seekers' : 'Chat with recruiters'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {wsConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </motion.div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden h-[calc(100vh-200px)] min-h-[500px]">
          <div className="flex h-full">
            <div className={`w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 ${selectedConversation ? 'hidden md:block' : ''}`}>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Conversations</h2>
                {isRecruiter && (
                  <button 
                    onClick={() => setShowNewChatModal(true)}
                    className="px-3 py-1 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
                  >
                    + New
                  </button>
                )}
              </div>
              
              <div className="overflow-y-auto h-[calc(100%-65px)]">
                {conversations.length > 0 ? (
                  conversations.map((conv) => {
                    const { other, lastMessage } = getConversationPreview(conv);
                    const isSelected = selectedConversation?.id === conv.id;
                    const unread = conv.unread_count > 0;
                    const hasInterview = hasInterviewDetails(conv);
                    
                    return (
                      <motion.div
                        key={conv.id}
                        whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.05)' }}
                        onClick={() => setSelectedConversation(conv)}
                        className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors ${
                          isSelected ? 'bg-violet-50 dark:bg-violet-900/20' : ''
                        } ${unread ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {(other.username || 'U')[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className={`font-semibold truncate ${unread ? 'text-violet-700 dark:text-violet-400' : 'text-gray-900 dark:text-white'}`}>
                                {other.username || 'Unknown User'}
                              </h3>
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                {formatTime(conv.updated_at)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {lastMessage}
                              </p>
                              {unread && (
                                <span className="ml-2 bg-violet-600 text-white text-xs px-2 py-0.5 rounded-full">
                                  {conv.unread_count}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs ${other.role === 'recruiter' ? 'text-blue-500' : 'text-green-500'}`}>
                                {other.role === 'recruiter' ? '🏢 Recruiter' : '👔 Job Seeker'}
                              </span>
                              {hasInterview && (
                                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded">
                                  📅 Interview
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <div className="text-5xl mb-4">💬</div>
                    <p className="text-gray-500 dark:text-gray-400">No conversations yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      {isRecruiter 
                        ? 'Start chatting with job applicants' 
                        : 'Apply to jobs to chat with recruiters'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className={`w-full md:w-2/3 flex flex-col ${!selectedConversation ? 'hidden md:flex' : ''}`}>
              {selectedConversation ? (
                <>
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setSelectedConversation(null)}
                        className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        ←
                      </button>
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center text-white font-bold">
                        {(getOtherParticipant(selectedConversation).username || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {getOtherParticipant(selectedConversation).username}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getOtherParticipant(selectedConversation).role === 'recruiter' ? '🏢 Recruiter' : '👔 Job Seeker'}
                        </span>
                      </div>
                    </div>
                    {isRecruiter && (
                      <button
                        onClick={() => setShowInterviewForm(!showInterviewForm)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        📅 Send Interview Details
                      </button>
                    )}
                  </div>

                  <AnimatePresence>
                    {showInterviewForm && isRecruiter && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20"
                      >
                        <form onSubmit={handleSendInterviewDetails} className="p-4 space-y-4">
                          <h4 className="font-semibold text-green-800 dark:text-green-400">📅 Send Interview Details</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Interview Date *</label>
                              <input
                                type="date"
                                required
                                value={interviewDetails.interview_date}
                                onChange={(e) => setInterviewDetails({...interviewDetails, interview_date: e.target.value})}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Interview Time *</label>
                              <input
                                type="time"
                                required
                                value={interviewDetails.interview_time}
                                onChange={(e) => setInterviewDetails({...interviewDetails, interview_time: e.target.value})}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Mode *</label>
                              <select
                                required
                                value={interviewDetails.interview_mode}
                                onChange={(e) => setInterviewDetails({...interviewDetails, interview_mode: e.target.value})}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                              >
                                <option value="online">Online</option>
                                <option value="offline">Offline</option>
                                <option value="phone">Phone</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Meeting Link</label>
                              <input
                                type="url"
                                value={interviewDetails.meeting_link}
                                onChange={(e) => setInterviewDetails({...interviewDetails, meeting_link: e.target.value})}
                                placeholder="https://..."
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">HR Contact</label>
                              <input
                                type="text"
                                value={interviewDetails.hr_contact}
                                onChange={(e) => setInterviewDetails({...interviewDetails, hr_contact: e.target.value})}
                                placeholder="Email or phone"
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Required Documents</label>
                              <textarea
                                value={interviewDetails.required_documents}
                                onChange={(e) => setInterviewDetails({...interviewDetails, required_documents: e.target.value})}
                                placeholder="List any documents the candidate needs to bring"
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                                rows={2}
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Additional Notes</label>
                              <textarea
                                value={interviewDetails.interview_notes}
                                onChange={(e) => setInterviewDetails({...interviewDetails, interview_notes: e.target.value})}
                                placeholder="Any additional information"
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                                rows={2}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={sending}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                            >
                              {sending ? 'Sending...' : 'Send Interview Details'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowInterviewForm(false)}
                              className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {hasInterviewDetails(selectedConversation) && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">📅</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-green-800 dark:text-green-400">Interview Details</h4>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Date:</span>
                              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                {formatDate(selectedConversation.interview_date)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Time:</span>
                              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                {selectedConversation.interview_time}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Mode:</span>
                              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                {selectedConversation.interview_mode === 'online' ? '💻 Online' : 
                                 selectedConversation.interview_mode === 'offline' ? '🏢 Offline' : '📞 Phone'}
                              </span>
                            </div>
                            {selectedConversation.meeting_link && (
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Link:</span>
                                <a 
                                  href={selectedConversation.meeting_link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="ml-2 text-blue-600 hover:underline"
                                >
                                  Join Meeting
                                </a>
                              </div>
                            )}
                          </div>
                          {selectedConversation.hr_contact && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-600 dark:text-gray-400">HR Contact:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{selectedConversation.hr_contact}</span>
                            </div>
                          )}
                          {selectedConversation.required_documents && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Required Documents:</span>
                              <p className="text-gray-900 dark:text-white mt-1">{selectedConversation.required_documents}</p>
                            </div>
                          )}
                          {selectedConversation.interview_notes && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Notes:</span>
                              <p className="text-gray-900 dark:text-white mt-1">{selectedConversation.interview_notes}</p>
                            </div>
                          )}
                          
                          {selectedConversation.interview_status && (
                            <div className="mt-3 p-2 bg-white dark:bg-gray-700 rounded-lg">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status: </span>
                              <span className={`text-sm font-semibold ${
                                selectedConversation.interview_status === 'accepted' ? 'text-green-600' :
                                selectedConversation.interview_status === 'rejected' ? 'text-red-600' :
                                selectedConversation.interview_status === 'reschedule_requested' ? 'text-yellow-600' :
                                'text-gray-600'
                              }`}>
                                {selectedConversation.interview_status === 'accepted' ? '✅ Accepted' :
                                 selectedConversation.interview_status === 'rejected' ? '❌ Declined' :
                                 selectedConversation.interview_status === 'reschedule_requested' ? '⏰ Reschedule Requested' :
                                 '⏳ Pending Response'}
                              </span>
                            </div>
                          )}
                          
                          {!isRecruiter && selectedConversation.interview_date && selectedConversation.interview_time && (
                            <div className="mt-4 flex gap-2">
                              <button
                                onClick={() => handleInterviewResponse('accept')}
                                disabled={sending}
                                className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                              >
                                ✅ Accept Interview
                              </button>
                              <button
                                onClick={() => handleInterviewResponse('reschedule')}
                                disabled={sending}
                                className="flex-1 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50"
                              >
                                ⏰ Request Reschedule
                              </button>
                              <button
                                onClick={() => handleInterviewResponse('reject')}
                                disabled={sending}
                                className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50"
                              >
                                ❌ Decline
                              </button>
                            </div>
                          )}
                          
                          {isRecruiter && selectedConversation.interview_date && selectedConversation.interview_time && (!selectedConversation.final_selection_status || selectedConversation.final_selection_status === 'pending') && (
                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <p className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-2">After the interview, mark the candidate:</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleFinalSelection('selected')}
                                  disabled={sending}
                                  className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                                >
                                  🎉 Mark as Selected
                                </button>
                                <button
                                  onClick={() => handleFinalSelection('rejected')}
                                  disabled={sending}
                                  className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50"
                                >
                                  ❌ Not Selected
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedConversation.final_selection_status && selectedConversation.final_selection_status !== 'pending' && (
                    <div className={`p-4 border-b ${
                      selectedConversation.final_selection_status === 'selected' 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">
                          {selectedConversation.final_selection_status === 'selected' ? '🎉' : '😔'}
                        </div>
                        <div>
                          <h4 className={`font-semibold ${
                            selectedConversation.final_selection_status === 'selected' 
                              ? 'text-green-800 dark:text-green-400'
                              : 'text-red-800 dark:text-red-400'
                          }`}>
                            {selectedConversation.final_selection_status === 'selected' 
                              ? '🎉 Congratulations - You have been Selected!'
                              : '❌ Better luck next time'}
                          </h4>
                          {selectedConversation.selection_notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {selectedConversation.selection_notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length > 0 ? (
                      messages.map((msg, index) => {
                        const isOwn = msg.sender?.id === user?.id;
                        const showAvatar = index === 0 || messages[index - 1]?.sender?.id !== msg.sender?.id;
                        
                        return (
                          <motion.div
                            key={msg.id || index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex items-end gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                              {!isOwn && showAvatar && (
                                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
                                  {(msg.sender?.username || 'U')[0].toUpperCase()}
                                </div>
                              )}
                              {!isOwn && !showAvatar && <div className="w-8" />}
                              <div className={`px-4 py-2 rounded-2xl ${
                                isOwn 
                                  ? 'bg-violet-600 text-white rounded-br-md' 
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
                              }`}>
                                <p className="text-sm">{msg.content}</p>
                                <p className={`text-xs mt-1 ${isOwn ? 'text-violet-200' : 'text-gray-400'}`}>
                                  {formatTime(msg.created_at)}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="text-4xl mb-2">💬</div>
                          <p className="text-gray-500 dark:text-gray-400">No messages yet</p>
                          <p className="text-sm text-gray-400 dark:text-gray-500">
                            {isRecruiter ? 'Send a message to start the conversation' : 'Apply to jobs to chat with recruiters'}
                          </p>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-violet-500 text-gray-900 dark:text-white"
                        disabled={sending}
                      />
                      <motion.button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sending ? '...' : '➤'}
                      </motion.button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Choose from your existing conversations or start a new one
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showNewChatModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowNewChatModal(false)}
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
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Start New Conversation</h2>
                  <button 
                    onClick={() => setShowNewChatModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  To start a conversation with a candidate:
                </p>
                <ol className="list-decimal list-inside space-y-3 text-gray-600 dark:text-gray-400 mb-6">
                  <li>Go to the <strong>Applications</strong> tab</li>
                  <li>Find a candidate you want to chat with</li>
                  <li>Click the <strong>Shortlist</strong> button to shortlist them</li>
                  <li>Once shortlisted, come back to <strong>Chat</strong> to start messaging</li>
                </ol>
                <button 
                  onClick={() => setShowNewChatModal(false)}
                  className="w-full py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRescheduleModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowRescheduleModal(false)}
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
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Request Reschedule</h2>
                  <button 
                    onClick={() => setShowRescheduleModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleRescheduleSubmit} className="p-6">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Please provide a reason for requesting to reschedule your interview:
                </p>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Enter your reason for rescheduling..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white mb-4"
                  rows={4}
                  required
                />
                <div className="flex gap-2">
                  <button 
                    type="submit"
                    disabled={sending || !rescheduleReason.trim()}
                    className="flex-1 py-3 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                  >
                    {sending ? 'Sending...' : 'Submit Request'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowRescheduleModal(false)}
                    className="px-6 py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;
