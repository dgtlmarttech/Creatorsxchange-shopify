'use client';
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Link as LinkIcon, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AffiliateLink {
  _id: string;
  discountCode: string;
  clicks: number;
  productSalesCount: number;
  totalRevenueGenerated: number;
  creatorId: any;
  shopifyProductHandle?: string;
  createdAt: string;
}

export default function DashboardOverview() {
  const router = useRouter();
  const [brandName, setBrandName] = useState('Partner');
  const [affiliates, setAffiliates] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }
    
    // Fetch profile
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/brand-profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.companyName) setBrandName(data.companyName);
      })
      .catch(() => {});

    // Fetch real affiliate data
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/shopify/affiliates/brand`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAffiliates(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  // Aggregations
  const totalRevenue = affiliates.reduce((sum, a) => sum + (a.totalRevenueGenerated || 0), 0);
  const totalSales = affiliates.reduce((sum, a) => sum + (a.productSalesCount || 0), 0);
  const totalClicks = affiliates.reduce((sum, a) => sum + (a.clicks || 0), 0);
  const uniqueInfluencers = new Set(affiliates.map(a => a.creatorId?._id || a.creatorId)).size;

  // Chart Data (Group by date for the last 7 days based on creation date of links as a proxy, or just flat if no time series data available)
  // Since we don't have daily timeseries in the affiliate schema, we will show a flat representation or mock the curve based on total if it's 0 to avoid empty charts, but user said NO DUMMY DATA.
  // So we will just show the links created over time or revenue over time if we have order dates. We don't have order dates easily accessible without another API.
  // We will build a chart of top 7 links by revenue instead.
  
  const topLinksChart = [...affiliates]
    .sort((a, b) => b.totalRevenueGenerated - a.totalRevenueGenerated)
    .slice(0, 7)
    .map(a => ({
      name: a.shopifyProductHandle || a.discountCode,
      revenue: a.totalRevenueGenerated
    }));

  const topLinksList = [...affiliates]
    .sort((a, b) => b.totalRevenueGenerated - a.totalRevenueGenerated)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Welcome back, {brandName}</h1>
          <p className="text-slate-500 mt-1">Here's your real-time affiliate performance.</p>
        </div>
        <button onClick={() => router.push('/dashboard/links')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors">
          Manage Links
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-emerald-200 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Total Revenue</p>
              <h3 className="text-3xl font-bold text-slate-800">₹{totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-blue-200 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Affiliate Sales</p>
              <h3 className="text-3xl font-bold text-slate-800">{totalSales.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-purple-200 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Total Clicks</p>
              <h3 className="text-3xl font-bold text-slate-800">{totalClicks.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
              <LinkIcon className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-amber-200 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Active Influencers</p>
              <h3 className="text-3xl font-bold text-slate-800">{uniqueInfluencers}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue by Top Links</h3>
          {topLinksChart.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={topLinksChart} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dx={-10} tickFormatter={(val) => `₹${val}`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    formatter={(value: any) => [`₹${value}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="h-72 flex items-center justify-center text-slate-400">No revenue data available yet.</div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Top Performing Links</h3>
          <div className="space-y-5">
            {topLinksList.length > 0 ? topLinksList.map((item, i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{item.shopifyProductHandle || item.discountCode}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.clicks.toLocaleString()} clicks • {item.productSalesCount} sales</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600 text-sm">₹{item.totalRevenueGenerated.toLocaleString()}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-400">No links have generated revenue yet.</p>
            )}
          </div>
          {topLinksList.length > 0 && (
            <button onClick={() => router.push('/dashboard/links')} className="w-full mt-6 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold transition-colors">
              View All Performance
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
