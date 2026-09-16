'use client';
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Filter, Download, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
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

export default function AnalyticsPage() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [affiliates, setAffiliates] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }
    
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

  if (loading) {
     return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  // Aggregations based on real data
  const totalRevenue = affiliates.reduce((sum, a) => sum + (a.totalRevenueGenerated || 0), 0);
  const totalSales = affiliates.reduce((sum, a) => sum + (a.productSalesCount || 0), 0);
  const totalClicks = affiliates.reduce((sum, a) => sum + (a.clicks || 0), 0);

  const aov = totalSales > 0 ? (totalRevenue / totalSales) : 0;
  const conversionRate = totalClicks > 0 ? ((totalSales / totalClicks) * 100) : 0;
  
  // ROAS requires Ad Spend tracking which isn't available, so we will replace this metric
  // with "Avg Clicks per Link" or something real.
  const totalLinks = affiliates.length;
  const avgClicksPerLink = totalLinks > 0 ? (totalClicks / totalLinks) : 0;

  // Chart Data: Group by Affiliate Link for Clicks vs Conversions
  const conversionData = affiliates.map(a => ({
    name: a.shopifyProductHandle || a.discountCode,
    clicks: a.clicks,
    conversions: a.productSalesCount
  })).sort((a, b) => b.clicks - a.clicks).slice(0, 10); // Top 10 by clicks

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Advanced Analytics</h1>
          <p className="text-slate-600 mt-1">Deep dive into your real-time campaign performance.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 py-2 px-4 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-semibold text-slate-500 mb-2">Average Order Value (AOV)</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-slate-800">₹{aov.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-semibold text-slate-500 mb-2">Overall Conversion Rate</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-slate-800">{conversionRate.toFixed(2)}%</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-semibold text-slate-500 mb-2">Avg Clicks per Link</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-slate-800">{Math.round(avgClicksPerLink)}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Clicks vs Sales (Top 10 Links)</h3>
        {conversionData.length > 0 ? (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis yAxisId="left" orientation="left" stroke="#64748b" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                <Bar yAxisId="left" dataKey="clicks" name="Total Clicks" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar yAxisId="right" dataKey="conversions" name="Sales" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400">
            No link data available to chart.
          </div>
        )}
      </div>
    </div>
  );
}
