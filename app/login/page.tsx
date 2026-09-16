'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState({ type: '', text: '' });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Login failed');

      if (data.accountType !== 'brand') {
        throw new Error('Only Brand accounts can access the Shopify Dashboard.');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('accountType', data.accountType);

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    
    setForgotLoading(true);
    setForgotMessage({ type: '', text: '' });
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Failed to send reset email');
      
      setForgotMessage({ type: 'success', text: 'Password reset link has been sent to your email.' });
      setForgotEmail('');
    } catch (err: any) {
      setForgotMessage({ type: 'error', text: err.message || 'Something went wrong.' });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-emerald-600 p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Affiliate Partner Hub</h2>
          <p className="text-emerald-100">Login to manage your campaigns and affiliate tracking.</p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <button type="button" onClick={() => setShowForgotModal(true)} className="text-sm text-emerald-600 hover:underline font-medium">Forgot password?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="text-emerald-600 font-semibold hover:underline">
              Create a Brand Account
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Reset Password</h3>
            <p className="text-sm text-gray-500 mb-6">Enter your email address and we'll send you a link to reset your password.</p>
            
            {forgotMessage.text && (
              <div className={`px-4 py-3 rounded-lg mb-4 text-sm border ${forgotMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                {forgotMessage.text}
              </div>
            )}
            
            <form onSubmit={handleForgotPassword}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="name@company.com"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowForgotModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={forgotLoading} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center disabled:opacity-70">
                  {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Send Link
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
