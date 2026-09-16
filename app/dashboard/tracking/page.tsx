'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search, ChevronDown, ChevronUp, Link as LinkIcon, ExternalLink, IndianRupee, ListChecks } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

interface AffiliateLink {
  _id: string;
  discountCode: string;
  clicks: number;
  productSalesCount: number;
  totalRevenueGenerated: number;
  creatorId: any;
  customCreatorName?: string;
  trackingUrl?: string;
  shopifyUrl?: string;
  shopifyProductHandle?: string;
  createdAt: string;
}

interface ProductGroup {
  handle: string;
  links: AffiliateLink[];
  totalClicks: number;
  totalSales: number;
  totalRevenue: number;
}

export default function TrackingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const [copiedLink, setCopiedLink] = useState<string | null>(null);

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
          // Group by product handle
          const grouped = data.reduce((acc: Record<string, ProductGroup>, link: AffiliateLink) => {
            const handle = link.shopifyProductHandle || 'General / Unknown';
            if (!acc[handle]) {
              acc[handle] = {
                handle,
                links: [],
                totalClicks: 0,
                totalSales: 0,
                totalRevenue: 0
              };
            }
            acc[handle].links.push(link);
            acc[handle].totalClicks += (link.clicks || 0);
            acc[handle].totalSales += (link.productSalesCount || 0);
            acc[handle].totalRevenue += (link.totalRevenueGenerated || 0);
            return acc;
          }, {} as Record<string, ProductGroup>);
          
          setProductGroups((Object.values(grouped) as ProductGroup[]).sort((a, b) => b.totalClicks - a.totalClicks));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const toggleGroup = (handle: string) => {
    const newSet = new Set(expandedGroups);
    if (newSet.has(handle)) {
      newSet.delete(handle);
    } else {
      newSet.add(handle);
    }
    setExpandedGroups(newSet);
  };

  const copyToClipboard = (url: string | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const filteredGroups = productGroups.filter(group => 
    group.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.links.some(link => link.discountCode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
          <p className="text-slate-500 font-medium animate-pulse">Loading tracking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Link Tracking</h1>
          <p className="text-slate-500 mt-1">View the performance of your products and their affiliate links.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search product or code..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none w-full md:w-72 shadow-sm transition-all bg-white"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 font-semibold text-sm text-slate-600 uppercase tracking-wider">
          <div className="col-span-4 pl-4">Product Name</div>
          <div className="col-span-2 text-center">Total Links</div>
          <div className="col-span-2 text-center">Clicks</div>
          <div className="col-span-2 text-center">Sales</div>
          <div className="col-span-2 text-right pr-4">Revenue</div>
        </div>

        {filteredGroups.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
             <ListChecks className="w-12 h-12 text-slate-300 mb-3" />
             <p className="text-lg font-medium text-slate-600">No links found</p>
             <p className="text-sm">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredGroups.map((group) => {
              const isExpanded = expandedGroups.has(group.handle);
              
              return (
                <div key={group.handle} className="group/row bg-white transition-all">
                  {/* Product Row */}
                  <div 
                    onClick={() => toggleGroup(group.handle)}
                    className={clsx(
                      "grid grid-cols-12 gap-4 p-4 items-center transition-colors cursor-pointer select-none",
                      isExpanded ? "bg-emerald-50/30" : "hover:bg-slate-50"
                    )}
                  >
                    <div className="col-span-4 pl-4 flex items-center gap-3">
                      <button className="p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-emerald-600" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      <div className="font-semibold text-slate-800 truncate" title={group.handle}>
                        {group.handle.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                        <LinkIcon className="w-3 h-3" />
                        {group.links.length}
                      </span>
                    </div>
                    <div className="col-span-2 text-center font-semibold text-slate-700">
                      {group.totalClicks.toLocaleString()}
                    </div>
                    <div className="col-span-2 text-center font-semibold text-emerald-600">
                      {group.totalSales.toLocaleString()}
                    </div>
                    <div className="col-span-2 text-right pr-4 font-bold text-slate-800">
                      ₹{group.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>

                  {/* Expanded Links Container */}
                  {isExpanded && (
                    <div className="bg-slate-50/80 border-t border-slate-100 shadow-inner">
                      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-100/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        <div className="col-span-3 pl-12">Discount Code</div>
                        <div className="col-span-3">Creator Name</div>
                        <div className="col-span-2 text-center">Clicks</div>
                        <div className="col-span-2 text-center">Sales</div>
                        <div className="col-span-2 text-right pr-4">Revenue</div>
                      </div>
                      
                      {group.links.map(link => (
                        <div key={link._id} className="grid grid-cols-12 gap-4 px-4 py-3.5 items-center hover:bg-white transition-colors text-sm border-b border-slate-100 last:border-0">
                          <div className="col-span-3 pl-12 flex items-center gap-2">
                            <span className="font-mono bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 font-semibold shadow-sm text-xs">
                              {link.discountCode}
                            </span>
                            {link.trackingUrl && (
                              <button 
                                onClick={(e) => copyToClipboard(link.trackingUrl, e)}
                                className="text-slate-400 hover:text-emerald-600 transition-colors"
                                title="Copy Affiliate Link"
                              >
                                {copiedLink === link.trackingUrl ? (
                                  <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">Copied!</span>
                                ) : (
                                  <ExternalLink className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
                          <div className="col-span-3 flex items-center gap-2">
                            {link.creatorId?.name || link.customCreatorName ? (
                              <span className="font-medium text-slate-700">{link.creatorId?.name || link.customCreatorName}</span>
                            ) : (
                              <span className="text-slate-400 italic">Unknown Creator</span>
                            )}
                          </div>
                          <div className="col-span-2 text-center font-medium text-slate-600">
                            {link.clicks.toLocaleString()}
                          </div>
                          <div className="col-span-2 text-center font-medium text-emerald-600">
                            {link.productSalesCount.toLocaleString()}
                          </div>
                          <div className="col-span-2 text-right pr-4 font-semibold text-slate-700">
                            ₹{(link.totalRevenueGenerated || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
