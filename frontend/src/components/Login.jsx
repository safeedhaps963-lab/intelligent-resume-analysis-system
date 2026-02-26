import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AppContext } from '../App';
import { FaUser, FaEnvelope, FaLock, FaSignInAlt, FaUserPlus } from 'react-icons/fa';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const ctx = useContext(AppContext);

  const from = location.state?.from?.pathname || "/";

  const validateForm = () => {
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (isRegister && !name) {
      toast.error('Please enter your name');
      return false;
    }
    return true;
  };

  const handleAuthResult = (data) => {
    const accessToken = data.data?.access_token || data.access_token || data.token;
    const refreshToken = data.data?.refresh_token || data.refresh_token;

    if (accessToken) {
      localStorage.setItem('access_token', accessToken);
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken);

      // Clean up old keys if they exist
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');

      const role = data.role || data.data?.role || data.data?.user?.role || 'user';
      const nameVal = data.user?.name || data.data?.user?.name || (typeof data.data?.user === 'object' ? data.data.user.name : null) || name;
      localStorage.setItem('userRole', role);
      if (nameVal) localStorage.setItem('userName', nameVal);
      if (ctx?.setIsAuthenticated) ctx.setIsAuthenticated(true);
      if (ctx?.setUserRole) ctx.setUserRole(role);
      if (ctx?.setUserName && nameVal) ctx.setUserName(nameVal);
      toast.success(isRegister ? 'Account created' : 'Signed in');

      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister ? { email, password, name } : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok && data && data.success) {
        handleAuthResult(data);
      } else {
        toast.error((data && (data.error || data.message)) || 'Authentication failed');
      }
    } catch (err) {
      console.error('Auth error', err);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-indigo-600 p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-2">{isRegister ? 'Join Us' : 'Welcome Back'}</h2>
          <p className="text-indigo-100">
            {isRegister ? 'Create your account to get started' : 'Sign in to access your dashboard'}
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={submit} className="space-y-5">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FaUser />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FaEnvelope />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FaLock />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg 
                ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'}`}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {isRegister ? <FaUserPlus /> : <FaSignInAlt />}
                  {isRegister ? 'Create Account' : 'Sign In'}
                </>
              )}
            </button>
          </form>


          <div className="mt-8 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-indigo-600 font-semibold hover:underline transition-all">
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
            </button>
          </div>
        </div>
      </div>

      <p className="fixed bottom-6 text-gray-400 text-sm">
        &copy; 2026 Intelligent Resume Analysis System. All rights reserved.
      </p>
    </div>
  );
};

export default Login;
