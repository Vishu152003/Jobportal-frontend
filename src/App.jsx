import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Ideas from './pages/Ideas';
import Profile from './pages/Profile';
import RecruiterDashboard from './pages/RecruiterDashboard';
import AdminDashboard from './pages/AdminPanel/AdminDashboard';
import JobSeekerDashboard from './pages/JobSeekerPanel/JobSeekerDashboard';
import MyApplications from './pages/MyApplications';
import JobApplicants from './pages/JobApplicants';
import PostJob from './pages/PostJob';
import Recommendations from './pages/Recommendations';
import Chat from './pages/Chat';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-purple-600 text-xl">Loading...</div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Role-based Route Component
const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-purple-600 text-xl">Loading...</div>
      </div>
    );
  }
  
  const role = user?.role || localStorage.getItem('userRole');
  
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

// Layout component that conditionally shows Navbar
const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname === '/admin';
  const isRecruiterRoute = location.pathname === '/recruiter';
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {!isAdminRoute && !isRecruiterRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token/:uid" element={<ResetPassword />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<Jobs />} />
        <Route path="/jobs/:jobId/applicants" element={
          <ProtectedRoute>
            <JobApplicants />
          </ProtectedRoute>
        } />
        <Route path="/ideas" element={<Ideas />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['seeker', 'recruiter', 'admin']}>
                <Dashboard />
              </RoleRoute>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/seeker" 
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['seeker']}>
                <Dashboard/>
              </RoleRoute>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/recruiter" 
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['recruiter', 'admin']}>
                <RecruiterDashboard />
              </RoleRoute>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </RoleRoute>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/jobs/new" 
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['recruiter', 'admin']}>
                <PostJob />
              </RoleRoute>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/applications" 
          element={
            <ProtectedRoute>
              <MyApplications />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/recommendations" 
          element={
            <ProtectedRoute>
              <Recommendations />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
