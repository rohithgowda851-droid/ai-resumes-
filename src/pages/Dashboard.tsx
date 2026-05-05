import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  Activity,
  ArrowUpRight,
  Zap
} from 'lucide-react';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
    <div className="relative z-10">
      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
      <div className="flex items-center gap-3">
        <p className={cn("text-3xl font-display font-bold", color === 'indigo' ? "text-emerald-600" : "text-slate-900")}>{value}</p>
        {change && (
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md">
            {change}
          </span>
        )}
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState({
    resumes: 0,
    jobs: 0,
    avgScore: 0,
    topRanked: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const resumesSnap = await getDocs(collection(db, 'resumes'));
      const jobsSnap = await getDocs(collection(db, 'jobs'));
      const analysesSnap = await getDocs(collection(db, 'analyses'));

      let totalScore = 0;
      let highScores = 0;
      analysesSnap.forEach(doc => {
        const data = doc.data();
        totalScore += data.score;
        if (data.score >= 80) highScores++;
      });

      setStats({
        resumes: resumesSnap.size,
        jobs: jobsSnap.size,
        avgScore: analysesSnap.size ? Math.round(totalScore / analysesSnap.size) : 0,
        topRanked: highScores
      });

      // Mock chart data for trends
      setChartData([
        { name: 'Mon', value: 40 },
        { name: 'Tue', value: 30 },
        { name: 'Wed', value: 60 },
        { name: 'Thu', value: 80 },
        { name: 'Fri', value: 100 },
        { name: 'Sat', value: 90 },
        { name: 'Sun', value: 95 },
      ]);
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-display font-bold text-slate-900 mb-1 tracking-tight">Recruitment Dashboard</h1>
        <p className="text-slate-500 text-sm font-medium">Monitor platform activity and AI matching performance.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Resumes" value={stats.resumes} icon={Users} color="slate" />
        <StatCard title="AI Match Avg" value={`${stats.avgScore}%`} icon={Activity} color="indigo" />
        <StatCard title="Job Openings" value={stats.jobs} icon={Briefcase} color="slate" />
        <StatCard title="Top Matches" value={stats.topRanked} change="+12%" icon={TrendingUp} color="slate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-display font-bold text-slate-800 uppercase tracking-widest text-[10px]">Matching Trends</h2>
            <div className="flex gap-2">
               <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded">Rank Persistence</span>
            </div>
          </div>
          <div className="p-8 flex-1 w-full min-h-[350px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData}>
                 <defs>
                   <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#059669" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} 
                    dy={10}
                 />
                 <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} 
                    dx={-10}
                 />
                 <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', padding: '12px' }}
                    cursor={{ stroke: '#059669', strokeWidth: 1, strokeDasharray: '4 4' }}
                 />
                 <Area type="monotone" dataKey="value" stroke="#059669" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-200">
            <h3 className="text-sm font-display font-bold flex items-center gap-2 mb-6 uppercase tracking-widest">
              <Zap size={16} fill="white" className="text-emerald-500" />
              Pulse Insights
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                  <span>Keyword Matching</span>
                  <span className="text-emerald-400">92%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[92%] transition-all duration-1000"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                  <span>Experience Integrity</span>
                  <span className="text-emerald-400">High</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[85%] transition-all duration-1000"></div>
                </div>
              </div>
            </div>
            <div className="mt-8 bg-white/10 rounded-xl p-4 border border-white/10">
              <p className="text-[11px] leading-relaxed opacity-90 italic">
                <span className="font-bold border-b border-white/20 mr-1 not-italic">Pro-Tip:</span> 
                Candidates with "System Design" keywords are matching 40% better for current open roles.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
             <h3 className="font-display font-bold text-slate-800 mb-4 flex items-center justify-between text-xs uppercase tracking-widest">
               Recent Analyses
               <span className="text-[10px] text-emerald-600 font-bold">LIVE</span>
             </h3>
             <div className="space-y-4">
               {[1, 2, 3].map((i) => (
                 <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                   <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-[10px] font-bold">
                     {i}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate tracking-tight">Candidate #{i + 142}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Match Score</p>
                   </div>
                   <div className="text-sm font-display font-bold text-emerald-600">8{i}%</div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
