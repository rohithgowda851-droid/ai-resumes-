import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Trash2, 
  ShieldAlert, 
  Activity,
  UserPlus,
  ArrowUpRight,
  Database,
  History
} from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format } from 'date-fns';

export default function Admin() {
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const usersSnap = await getDocs(collection(db, 'users'));
      const analysesSnap = await getDocs(query(collection(db, 'analyses'), orderBy('createdAt', 'desc')));
      
      setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLogs(analysesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).slice(0, 10));
      setLoading(false);
    }
    fetchData();
  }, []);

  const deleteUser = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      await deleteDoc(doc(db, 'users', id));
      setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2 text-red-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-2 bg-red-50 w-fit px-3 py-1 rounded-full border border-red-100">
           <ShieldAlert size={12} />
           Security Restricted Area
        </div>
        <h1 className="text-4xl font-display italic mb-2">Systems Management</h1>
        <p className="text-slate-500 font-light italic">Core administrative controls and audit logs.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           {/* User Management */}
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-display italic">User Directory</h3>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Role Assignment & Permissions</p>
                </div>
                <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:scale-105 transition-transform shadow-md">
                   <UserPlus size={14} />
                   Invite User
                </button>
             </div>
             
             <div className="divide-y divide-slate-50">
               {users.map(u => (
                 <div key={u.id} className="px-6 py-4 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                          {u.displayName?.charAt(0) || u.email?.charAt(0)}
                       </div>
                       <div>
                          <p className="font-semibold text-sm">{u.displayName || 'Unnamed User'}</p>
                          <p className="text-xs text-slate-400 italic">{u.email}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-8">
                       <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${u.role === 'admin' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                          {u.role}
                       </span>
                       <button 
                        onClick={() => deleteUser(u.id)}
                        className="p-2 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                       >
                          <Trash2 size={16} />
                       </button>
                    </div>
                 </div>
               ))}
             </div>
           </div>

           {/* Metrics Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
                 <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
                    <Activity size={24} />
                 </div>
                 <div>
                    <div className="text-2xl font-display italic">99.9%</div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">API Uptime</div>
                 </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
                 <div className="p-4 bg-green-50 text-green-600 rounded-xl">
                    <Database size={24} />
                 </div>
                 <div>
                    <div className="text-2xl font-display italic">1.2 GB</div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Store Usage</div>
                 </div>
              </div>
           </div>
        </div>

        {/* Audit Log */}
        <div className="bg-slate-900 rounded-2xl p-8 text-white flex flex-col shadow-xl">
           <div className="flex items-center gap-3 mb-8">
              <History className="text-white/40" size={20} />
              <h3 className="text-lg font-display italic">System Audit</h3>
           </div>

           <div className="flex-1 space-y-6">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-4 group">
                   <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-400 ring-4 ring-blue-400/20"></div>
                      <div className="flex-1 w-[1px] bg-white/10 my-2"></div>
                   </div>
                   <div className="flex-1 pb-4">
                      <p className="text-[11px] text-white font-medium mb-1 group-hover:text-blue-400 transition-colors">Resume Analysis #{log.id.slice(0,5)}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-tighter">
                        {format(new Date(log.createdAt), 'HH:mm:ss')} • Candidate Match
                      </p>
                   </div>
                </div>
              ))}
              
              {logs.length === 0 && (
                <p className="text-white/20 italic text-sm text-center py-12">No recent audit data.</p>
              )}
           </div>

           <button className="mt-8 pt-8 border-t border-white/10 w-full text-center text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 hover:text-white transition-colors">
              Export System Metrics
           </button>
        </div>
      </div>
    </div>
  );
}
