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

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const accountType = localStorage.getItem('accountType');

    if (!token || accountType !== 'brand') {
      router.replace('/login');
    } else {
      setLoading(false);
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

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-slate-400 font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
