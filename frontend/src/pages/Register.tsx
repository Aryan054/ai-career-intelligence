import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import apiClient from '../api/client';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, ArrowRight } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'CANDIDATE' | 'RECRUITER'>('CANDIDATE');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { token, user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (token && user) {
      if (user.role === 'RECRUITER') {
        navigate('/recruiter', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [token, user, navigate]);

  const [loadingPhase, setLoadingPhase] = useState<'connecting' | 'waking'>('connecting');

  const handleRegister = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    setLoadingPhase('connecting');

    // If server takes > 3.5s to respond, it is likely warming up from Render sleep
    const wakeTimer = setTimeout(() => {
      setLoadingPhase('waking');
    }, 3500);

    try {
      await apiClient.post('/auth/register', {
        email,
        password,
        full_name: fullName,
        role
      });
      clearTimeout(wakeTimer);
      navigate('/login', { state: { message: 'Registration successful! Please sign in.' } });
    } catch (err: any) {
      clearTimeout(wakeTimer);
      const isLocalUrl = apiClient.defaults.baseURL?.includes('localhost') || apiClient.defaults.baseURL?.includes('127.0.0.1');
      const isHosted = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Server response timed out. The backend might still be waking up from cold sleep (Render free tier takes ~30-50s). Please click "Retry" below.');
      } else if (!err.response) {
        if (isHosted && isLocalUrl) {
          setError('Cannot reach backend: The app is running on Vercel, but API URL is defaulting to localhost. Please set your Render backend URL using the "Backend URL" button at the top.');
        } else {
          setError('Cannot reach backend server. The Render cloud instance is likely spinning up from sleep (~30-50s). Please wait a few seconds and try again.');
        }
      } else {
        setError(err.response?.data?.detail || 'Failed to register. Please try again.');
      }
    } finally {
      clearTimeout(wakeTimer);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10">
        
        <div className="text-center mb-8">
          <div className="mx-auto bg-indigo-50 w-12 h-12 flex items-center justify-center rounded-xl mb-4">
            <UserPlus className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create an account</h2>
          <p className="text-sm text-slate-500 mt-2">Join AI Career Intelligence today</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 p-3.5 rounded-lg mb-6 text-sm">
            <p className="font-medium leading-relaxed">{error}</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRegister()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
              >
                Retry Now
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Account Type</label>
            <div className="flex gap-3 p-1 bg-slate-100/80 rounded-lg border border-slate-200/60">
              <button
                type="button"
                onClick={() => setRole('CANDIDATE')}
                className={`flex-1 py-1.5 px-4 rounded-md text-sm font-medium transition-all ${
                  role === 'CANDIDATE' 
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Candidate
              </button>
              <button
                type="button"
                onClick={() => setRole('RECRUITER')}
                className={`flex-1 py-1.5 px-4 rounded-md text-sm font-medium transition-all ${
                  role === 'RECRUITER' 
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Recruiter
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow sm:text-sm"
                required 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input 
                type="email" 
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow sm:text-sm"
                required 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow sm:text-sm"
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {loadingPhase === 'waking' ? 'Waking up cloud server...' : 'Creating account...'}
              </span>
            ) : (
              <>
                <span>Create account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
