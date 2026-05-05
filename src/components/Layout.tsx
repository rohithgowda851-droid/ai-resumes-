import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Zap, 
  Settings, 
  LogOut,
  ChevronRight,
  Search,
  Wand2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NavItem = ({ to, icon: Icon, label, disabled = false }: { to: string, icon: any, label: string, disabled?: boolean }) => (
  <NavLink
    to={to}
    className={({ isActive }) => cn(
      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
      isActive ? "bg-emerald-50 text-emerald-700 font-medium shadow-sm" : "text-slate-500 hover:bg-slate-50",
      disabled && "opacity-50 cursor-not-allowed"
    )}
    onClick={(e) => disabled && e.preventDefault()}
  >
    <Icon size={18} />
    <span className="text-sm">{label}</span>
  </NavLink>
);

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Zap className="text-white" size={18} fill="currentColor" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-slate-900">Ranker.ai</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/candidates" icon={Users} label="Resume Bank" />
          <NavItem to="/jobs" icon={Briefcase} label="Job Postings" />
          <NavItem to="/ranker" icon={Zap} label="AI Matcher" />
          <NavItem to="/resume-builder" icon={Wand2} label="AI Resume Architect" />
          
          {profile?.role === 'admin' && (
            <>
              <div className="pt-4 pb-2">
                <div className="h-px bg-slate-100 mb-4 mx-2"></div>
                <NavItem to="/admin" icon={Settings} label="Admin Panel" />
              </div>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-900 rounded-xl p-4 text-white mb-6">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">AI Credits</p>
            <div className="flex items-end justify-between">
              <span className="text-lg font-display font-bold">8,420</span>
              <span className="text-[10px] text-emerald-400 font-bold">+12%</span>
            </div>
            <div className="w-full bg-white/10 h-1 rounded-full mt-3 overflow-hidden">
              <div className="w-3/4 h-full bg-emerald-500"></div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-3 py-3 rounded-xl border border-slate-100 bg-slate-50">
            <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-display font-bold text-sm">
              {(profile?.displayName || profile?.email || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate leading-none mb-1">{profile?.displayName || (profile?.role === 'admin' ? 'ROHIT S MADIWALAR' : 'Alex Rivera')}</span>
              <span className="text-[10px] text-slate-400 capitalize">{profile?.role === 'admin' ? 'System Administrator' : (profile?.role || 'Senior Recruiter')}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-10 flex items-center px-8 justify-between">
          <div className="relative w-96">
            <input 
              type="text" 
              placeholder="Search resumes..." 
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={handleSignOut}
               className="p-2 text-slate-400 hover:text-red-500 transition-colors"
               title="Sign Out"
             >
               <LogOut size={20} />
             </button>
             <div className="h-4 w-px bg-slate-200"></div>
             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
               <span>Status: Active</span>
               <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
             </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
