import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import CandidateDashboard from './pages/CandidateDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import CreateJob from './pages/CreateJob';
import { ServerWakeupBanner } from './components/ServerWakeupBanner';
import './index.css';

const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole?: string }) => {
  const { token, user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" />;
  }
  if (allowedRole && user?.role !== allowedRole) {
    // Basic redirect if they try to access wrong dashboard
    return <Navigate to={user?.role === 'RECRUITER' ? '/recruiter' : '/dashboard'} />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ServerWakeupBanner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRole="CANDIDATE">
                <CandidateDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/recruiter" 
            element={
              <ProtectedRoute allowedRole="RECRUITER">
                <RecruiterDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/recruiter/jobs/create" 
            element={
              <ProtectedRoute allowedRole="RECRUITER">
                <CreateJob />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/recruiter/jobs/edit/:id" 
            element={
              <ProtectedRoute allowedRole="RECRUITER">
                <CreateJob />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
