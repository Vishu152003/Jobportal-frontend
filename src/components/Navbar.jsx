import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const userRole = user?.role || localStorage.getItem('userRole');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'application': return '📋';
      case 'status': return '📊';
      case 'message': return '💬';
      case 'job': return '💼';
      case 'interview': return '📅';
      default: return '🔔';
    }
  };

  const navLinks = [
    { to: '/jobs', label: 'Find Jobs', icon: '🔍' },
    { to: '/ideas', label: 'Startup Ideas', icon: '💡' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }} className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <span className="text-xl">💼</span>
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">JobPortal</span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className="px-4 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-200 font-medium">
                <span className="mr-1">{link.icon}</span>{link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <motion.button onClick={() => setDarkMode(!darkMode)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
              <motion.div initial={false} animate={{ rotate: darkMode ? 0 : 180, scale: darkMode ? 1 : 0 }} transition={{ duration: 0.3 }} className="absolute">🌙</motion.div>
              <motion.div initial={false} animate={{ rotate: darkMode ? -180 : 0, scale: darkMode ? 0 : 1 }} transition={{ duration: 0.3 }} className="absolute">☀️</motion.div>
            </motion.button>

            {/* Notifications Bell */}
            {isAuthenticated && (
              <div className="relative" ref={notificationRef}>
                <motion.button 
                  onClick={() => setNotificationOpen(!notificationOpen)} 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  className="relative w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                >
                  <span className="text-xl">🔔</span>
                  {unreadCount > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </motion.button>

                <AnimatePresence>
                  {notificationOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                      animate={{ opacity: 1, y: 0, scale: 1 }} 
                      exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                      transition={{ duration: 0.2 }} 
                      className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-xs text-violet-600 hover:text-violet-700"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((notification) => (
                            <div 
                              key={notification.id}
                              onClick={() => {
                                markAsRead(notification.id);
                                if (notification.link) {
                                  navigate(notification.link);
                                }
                                setNotificationOpen(false);
                              }}
                              className={`p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!notification.is_read ? 'bg-violet-50 dark:bg-violet-900/20' : ''}`}
                            >
                              <div className="flex items-start space-x-3">
                                <span className="text-xl">{getNotificationIcon(notification.notification_type)}</span>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${notification.is_read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {notification.time_ago}
                                  </p>
                                </div>
                                {!notification.is_read && (
                                  <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                          <Link 
                            to="/notifications" 
                            onClick={() => setNotificationOpen(false)}
                            className="block text-center text-sm text-violet-600 hover:text-violet-700 py-2"
                          >
                            View all notifications
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <motion.button onClick={() => setUserDropdownOpen(!userDropdownOpen)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">{user?.first_name ? user.first_name[0].toUpperCase() : '👤'}</div>
                  <span className="font-medium">{user?.first_name || user?.username}</span>
                  <motion.div animate={{ rotate: userDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>▼</motion.div>
                </motion.button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.2 }} className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="font-semibold text-gray-900 dark:text-white">{user?.first_name} {user?.last_name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full capitalize">{user?.role}</span>
                      </div>
                      <div className="p-2">
{userRole !== 'recruiter' && <Link to="/dashboard" onClick={() => setUserDropdownOpen(false)} className="flex items-center space-x-2 px-3 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><span>📊</span><span>Dashboard</span></Link>}
                        {(userRole === 'recruiter' || userRole === 'admin') && <Link to="/recruiter" onClick={() => setUserDropdownOpen(false)} className="flex items-center space-x-2 px-3 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><span>🏢</span><span>Recruiter</span></Link>}
                        {userRole === 'admin' && <Link to="/admin" onClick={() => setUserDropdownOpen(false)} className="flex items-center space-x-2 px-3 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><span>👑</span><span>Admin</span></Link>}
                        {userRole !== 'recruiter' && <Link to="/applications" onClick={() => setUserDropdownOpen(false)} className="flex items-center space-x-2 px-3 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><span>📋</span><span>My Applications</span></Link>}
                        {userRole !== 'recruiter' && <Link to="/recommendations" onClick={() => setUserDropdownOpen(false)} className="flex items-center space-x-2 px-3 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><span>🤖</span><span>AI Recommendations</span></Link>}
<Link to="/chat" onClick={() => setUserDropdownOpen(false)} className="flex items-center space-x-2 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><span>💬</span><span>Messages</span></Link>
                        {userRole !== 'recruiter' && <Link to="/profile" onClick={() => setUserDropdownOpen(false)} className="flex items-center space-x-2 px-3 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><span>👤</span><span>Profile</span></Link>}
                        <button onClick={handleLogout} className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><span>🚪</span><span>Logout</span></button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="px-4 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition-colors">Sign In</Link>
                <Link to="/register" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 transition-all duration-200">Get Started</Link>
              </div>
            )}
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            <motion.div animate={{ rotate: menuOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
              {menuOpen ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
            </motion.div>
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="md:hidden py-4 border-t dark:border-gray-700">
              <div className="flex flex-col space-y-2">
                {navLinks.map((link) => (<Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)} className="flex items-center space-x-2 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><span>{link.icon}</span><span>{link.label}</span></Link>))}
                <button onClick={() => setDarkMode(!darkMode)} className="flex items-center justify-between px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><span className="flex items-center space-x-2"><span>{darkMode ? '☀️' : '🌙'}</span><span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span></span></button>
                {isAuthenticated ? (
                  <>
{userRole !== 'recruiter' && <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center space-x-2 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><span>📊</span><span>Dashboard</span></Link>}
                    {(userRole === 'recruiter' || userRole === 'admin') && <Link to="/recruiter" onClick={() => setMenuOpen(false)} className="flex items-center space-x-2 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><span>🏢</span><span>Recruiter</span></Link>}
                    {userRole === 'admin' && <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center space-x-2 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><span>👑</span><span>Admin</span></Link>}
                    {userRole !== 'recruiter' && <Link to="/applications" onClick={() => setMenuOpen(false)} className="flex items-center space-x-2 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><span>📋</span><span>My Applications</span></Link>}
                    {userRole !== 'recruiter' && <Link to="/recommendations" onClick={() => setMenuOpen(false)} className="flex items-center space-x-2 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><span>🤖</span><span>AI Recommendations</span></Link>}
                    <Link to="/chat" onClick={() => setMenuOpen(false)} className="flex items-center space-x-2 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><span>💬</span><span>Messages</span></Link>
                    {userRole !== 'recruiter' && <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center space-x-2 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><span>👤</span><span>Profile</span></Link>}
                    <button onClick={handleLogout} className="flex items-center space-x-2 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><span>🚪</span><span>Logout</span></button>
                  </>
                ) : (
                  <div className="flex flex-col space-y-2 pt-2">
                    <Link to="/login" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-center rounded-xl text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 font-medium">Sign In</Link>
                    <Link to="/register" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold">Get Started</Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
