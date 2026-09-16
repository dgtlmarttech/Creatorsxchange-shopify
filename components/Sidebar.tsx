'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Store, Link as LinkIcon, BarChart3, Settings, LogOut, Loader2, ListChecks } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Store Connection', href: '/dashboard/store', icon: Store },
  { name: 'Products & Links', href: '/dashboard/links', icon: LinkIcon },
  { name: 'Link Tracking', href: '/dashboard/tracking', icon: ListChecks },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ companyName?: string, email?: string, phone?: string } | null>(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const accountType = localStorage.getItem('accountType');

    if (!token || accountType !== 'brand') {
      router.replace('/login');
    } else {
      Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/brand-profile`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.json()),
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.json())
      ])
        .then(([profileData, userData]) => {
          setProfile({
            ...profileData,
            email: userData?.email,
            phone: userData?.phone
          });
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('accountType');
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="w-64 h-screen bg-slate-900 border-r border-slate-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col shadow-2xl">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Affiliate <span className="text-emerald-500">Hub</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Partner Dashboard</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group font-medium',
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className={clsx('w-5 h-5', isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400')} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-4">
        {profile && (
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex shrink-0 items-center justify-center text-emerald-400 font-bold border border-emerald-500/30">
              {(profile.companyName || 'B').charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{profile.companyName || 'Brand Partner'}</p>
              <p className="text-[11px] text-slate-400 truncate">{profile.email || profile.phone || ''}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg hover:bg-slate-800 hover:text-red-400 transition-colors text-slate-400 font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
