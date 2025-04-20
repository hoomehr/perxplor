import React, { useState } from 'react';

interface EmailLoginProps {
  onLogin: (email: string) => void;
  onCancel: () => void;
}

const EmailLogin: React.FC<EmailLoginProps> = ({ onLogin, onCancel }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!password.trim() || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    // Clear any previous errors
    setError('');
    setIsLoading(true);
    
    // In a real app, this would call an authentication API
    // For this demo, we'll simulate a successful login
    setTimeout(() => {
      setIsLoading(false);
      onLogin(email);
    }, 800);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 shadow-lg w-full max-w-md">
      <h2 className="text-xl text-white font-bold mb-4">Login with Email</h2>
      
      {error && (
        <div className="bg-red-900 text-white p-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-400 mb-2" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-400 mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <div className="flex justify-between">
          <button
            type="button"
            className="bg-gray-700 text-white rounded px-4 py-2 hover:bg-gray-600 transition"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 transition"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmailLogin;
