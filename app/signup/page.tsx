'use client';
import React, { useState, useRef, useCallback } from 'react';
import { Loader2, User, Mail, Phone, Shield, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { motion } from 'framer-motion';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Phone OTP states
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpVerified, setPhoneOtpVerified] = useState(false);
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);
  const [phoneVerificationId, setPhoneVerificationId] = useState('');
  const [phoneResendTimer, setPhoneResendTimer] = useState(0);

  // Timer effect for phone OTP resend
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phoneResendTimer > 0) {
      interval = setInterval(() => {
        setPhoneResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phoneResendTimer]);

  // OTP states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  // reCAPTCHA states
  const [isRecaptchaReady, setIsRecaptchaReady] = useState<boolean>(false);
  const recaptchaInitialized = useRef<boolean>(false);
  const RECAPTCHA_SITE_KEY_V3 = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6Lc1eocrAAAAAPAPkJifLHs4HRm6RlOFMUI5EiL5";

  const initializeRecaptcha = useCallback(() => {
    if (recaptchaInitialized.current || typeof window === 'undefined') return;
    try {
      if (typeof (window as any).grecaptcha !== 'undefined' && (window as any).grecaptcha.ready) {
        (window as any).grecaptcha.ready(() => {
          setIsRecaptchaReady(true);
          recaptchaInitialized.current = true;
        });
      }
    } catch (error) {
      console.error('reCAPTCHA initialization error:', error);
    }
  }, []);

  const executeRecaptcha = useCallback(async (action: string = 'signup'): Promise<string | null> => {
    if (!isRecaptchaReady || typeof (window as any).grecaptcha === 'undefined') return null;
    try {
      const token = await (window as any).grecaptcha.execute(RECAPTCHA_SITE_KEY_V3, { action });
      return token;
    } catch (error) {
      return null;
    }
  }, [isRecaptchaReady, RECAPTCHA_SITE_KEY_V3]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneOtpVerified) {
      setError('Please verify your phone number first.');
      return;
    }

    if (!termsAccepted) {
      setError("You must agree to the Terms and Conditions.");
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const token = await executeRecaptcha('signup');

      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          accountType: 'brand',
          // Defaulting missing fields required by backend for 'brand' type
          companyName: `${fullName} Store`,
          website: 'https://your-store.com',
          contactPerson: fullName,
          phone,
          name: fullName,
          category: 'Other',
          recaptchaToken: token || "mock-token-fallback",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Signup failed');

      if (data.requiresOTP) {
        setVerificationId(data.verificationId);
        setShowOtpModal(true);
      } else {
        // Fallback if no OTP required
        router.push('/login?registered=true');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return;
    
    setOtpLoading(true);
    setOtpError('');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify-brand-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          verificationId,
          code: otpCode 
        }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Invalid OTP code');
      
      router.push('/login?registered=true');
    } catch (err: any) {
      setOtpError(err.message || 'Failed to verify OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (phone.length !== 10) {
      setError('Phone must be exactly 10 digits.');
      return;
    }
    
    setPhoneOtpLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/otp/whatsapp-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
      
      setPhoneVerificationId(data.data.verificationId);
      setPhoneOtpSent(true);
      setPhoneResendTimer(60);
    } catch (err: any) {
      setError(err.message || 'Something went wrong while sending SMS.');
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (phoneOtp.length !== 4) {
      setError('Enter a valid 4-digit OTP.');
      return;
    }

    setPhoneOtpLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/otp/whatsapp-validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          verificationId: phoneVerificationId,
          code: phoneOtp
        }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Invalid OTP');

      setPhoneOtpVerified(true);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP.');
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 py-12">
      <Script
        src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY_V3}`}
        async defer
        onLoad={() => setTimeout(initializeRecaptcha, 100)}
      />

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-emerald-600 p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Partner Signup</h2>
          <p className="text-emerald-100">Join the Affiliate Integration Platform</p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900 bg-white" placeholder="John Doe" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                      disabled={phoneOtpVerified}
                      className={`w-full pl-10 pr-4 py-3 border ${phoneOtpVerified ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-gray-300 text-gray-900'} rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors disabled:opacity-80`} 
                      placeholder="10-digit number" 
                      required 
                    />
                    {phoneOtpVerified && (
                      <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleSendPhoneOtp}
                    disabled={phoneOtpLoading || phone.length !== 10 || phoneOtpVerified}
                    className={`px-4 py-2 rounded-lg font-medium transition-all text-sm whitespace-nowrap flex items-center justify-center min-w-[100px]
                      ${phoneOtpVerified 
                        ? "bg-emerald-100 text-emerald-700 cursor-not-allowed" 
                        : "bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"}`}
                  >
                    {phoneOtpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : phoneOtpVerified ? "Verified" : phoneOtpSent ? "Resend" : "Send OTP"}
                  </button>
                </div>
                
                {phoneOtpSent && !phoneOtpVerified && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex gap-2">
                    <input
                      type="text"
                      value={phoneOtp}
                      onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="4-digit OTP"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-center font-mono tracking-widest outline-none text-gray-900 bg-white"
                      maxLength={4}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyPhoneOtp}
                      disabled={phoneOtpLoading || phoneOtp.length !== 4}
                      className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-all disabled:opacity-50 text-sm flex items-center justify-center min-w-[100px]"
                    >
                      {phoneOtpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                    </button>
                  </motion.div>
                )}
                {phoneResendTimer > 0 && !phoneOtpVerified && phoneOtpSent && (
                  <div className="text-xs text-gray-500 text-right pr-2">
                    Resend in {phoneResendTimer}s
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900 bg-white" placeholder="name@company.com" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Shield className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900 bg-white" placeholder="••••••••" required />
              </div>
            </div>

            <div className="flex items-center pt-2">
              <input type="checkbox" id="terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded" />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                I agree to the Terms and Conditions and Privacy Policy.
              </label>
            </div>

            <button type="submit" disabled={loading || !phoneOtpVerified} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2">
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /><span>Creating Account...</span></>
              ) : (
                <><User className="w-5 h-5" /><span>Create Account</span></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
              Log in to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h3>
            <p className="text-sm text-gray-500 mb-6">
              We've sent a 6-digit verification code to <strong>{email}</strong>.
            </p>
            
            {otpError && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm border border-red-200 text-left">
                {otpError}
              </div>
            )}
            
            <form onSubmit={handleVerifyOtp}>
              <div className="mb-6">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-3xl font-mono tracking-[0.5em] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 bg-white"
                  placeholder="------"
                  required
                />
              </div>
              <button type="submit" disabled={otpLoading || otpCode.length !== 6} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center disabled:opacity-70">
                {otpLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Verify Account
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
