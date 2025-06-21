import { useState } from 'react';
import { useAuth } from '../lib/auth-context.js';
// Import wouter from our compatibility layer
const { useLocation } = require("../wouter-compat");

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { login, loading, error } = useAuth();
  const [location, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!username || !password) {
      setErrorMessage('Please enter both username and password');
      return;
    }
    
    const success = await login(username, password);
    if (success) {
      // Redirect to the page user tried to access or dashboard
      const params = new URLSearchParams(location.split('?')[1] || '');
      const from = params.get('from') || '/dashboard';
      setLocation(from);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="px-10 py-12">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">OllamaCognos</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Your Personal AI Health Assistant</p>
            </div>
            
            <form onSubmit={handleSubmit}>
              {(error || errorMessage) && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {errorMessage || error}
                </div>
              )}
              
              <div className="mb-6">
                <label htmlFor="username" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  placeholder="Enter your username"
                  autoComplete="username"
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="password" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
            
            <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>
                First time? The default admin account is created automatically.
                <br />
                Username: <span className="font-semibold">admin</span>
                <br />
                (See server logs for the initial password)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
