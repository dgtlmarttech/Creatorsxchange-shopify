import React from 'react';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 justify-between shadow-sm z-10">
          <h2 className="text-xl font-semibold text-slate-800">Dashboard</h2>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">
              B
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
