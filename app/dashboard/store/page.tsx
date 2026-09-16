'use client';
import React, { useState, useEffect } from 'react';
import { Store, Link as LinkIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StoreConnectionPage() {
  const router = useRouter();
  const [shopUrl, setShopUrl] = useState('');
  const [isShopifyConnected, setIsShopifyConnected] = useState(false);
  const [shopifyDomain, setShopifyDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setActionLoading(false);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  useEffect(() => {
    const fetchBrandProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.replace('/login');
          return;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/brand-profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = await res.json();
        if (res.ok) {
          setIsShopifyConnected(!!data.isShopifyConnected);
          setShopifyDomain(data.shopifyDomain || '');
        }
      } catch (err) {
        console.error('Failed to fetch brand profile', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBrandProfile();

    // Check URL for OAuth return status
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('shopify') === 'connected') {
      setMessage({ text: 'Store connected successfully!', type: 'success' });
      setIsShopifyConnected(true);
      window.history.replaceState({}, '', '/dashboard/store');
    }
  }, [router]);

  const handleConnectShopify = () => {
    if (!shopUrl) {
      setMessage({ text: 'Please enter your Store URL (e.g. your-store.myshopify.com)', type: 'error' });
      return;
    }
    
    setActionLoading(true);
    const cleanUrl = shopUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    let backendUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000';
    if (backendUrl.endsWith('/api')) {
      backendUrl = backendUrl.slice(0, -4);
    }
    
    const token = localStorage.getItem('token');
    window.location.href = `${backendUrl}/api/shopify/auth?shop=${cleanUrl}&token=${token}`;
  };

  const handleDisconnectShopify = async () => {
    if (!confirm('Are you sure you want to disconnect your store? Affiliate links will stop tracking.')) return;
    
    setActionLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/brand-profile/shopify/disconnect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setIsShopifyConnected(false);
        setShopifyDomain('');
        setMessage({ text: 'Store disconnected successfully.', type: 'success' });
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (err) {
      console.error('Failed to disconnect Store', err);
      setMessage({ text: 'Failed to disconnect Store', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Store Connection</h1>
        <p className="text-slate-600 mt-1">Connect your store to track creator affiliate sales automatically.</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p>{message.text}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Store className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Store Integration</h2>
            <p className="text-slate-500 text-sm">Status: {isShopifyConnected ? <span className="text-emerald-600 font-semibold">Connected</span> : <span className="text-slate-500">Not Connected</span>}</p>
          </div>
        </div>

        <div className="p-6">
          {isShopifyConnected ? (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-lg p-5 border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-1">Connected Store URL</p>
                  <a href={`https://${shopifyDomain}`} target="_blank" rel="noreferrer" className="text-lg text-emerald-600 hover:underline flex items-center gap-2">
                    {shopifyDomain}
                    <LinkIcon className="w-4 h-4" />
                  </a>
                </div>
                <button
                  onClick={handleDisconnectShopify}
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Disconnecting...' : 'Disconnect Store'}
                </button>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                <h4 className="font-semibold text-blue-900 mb-2">Next Steps</h4>
                <p className="text-blue-800 text-sm mb-4">Your store is connected! You can now generate unique tracking links and discount codes for your influencers.</p>
                <button onClick={() => router.push('/dashboard/links')} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                  Manage Products & Links
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-700">Enter your Store URL to begin the connection process. You will be redirected to approve the installation.</p>
              
              <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
                <input
                  type="text"
                  placeholder="your-store.myshopify.com"
                  value={shopUrl}
                  onChange={(e) => setShopUrl(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900 bg-white"
                />
                <button
                  onClick={handleConnectShopify}
                  disabled={actionLoading}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition shadow-sm whitespace-nowrap disabled:opacity-70 flex items-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Store className="w-5 h-5" />}
                  Connect Store
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">Example: your-store.myshopify.com</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
