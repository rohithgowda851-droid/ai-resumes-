import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Briefcase,
  Layers,
  ArrowRight
} from 'lucide-react';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    requirements: ''
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    setLoading(true);
    const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    setJobs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await addDoc(collection(db, 'jobs'), {
      ...formData,
      createdBy: user.uid,
      createdAt: new Date().toISOString()
    });

    setFormData({ title: '', company: '', description: '', requirements: '' });
    setShowForm(false);
    fetchJobs();
  };

  const deleteJob = async (id: string) => {
    await deleteDoc(doc(db, 'jobs', id));
    fetchJobs();
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 mb-1 tracking-tight">Job Postings</h1>
          <p className="text-slate-500 text-sm font-medium">Define requirements to feed the AI ranking engine.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-100"
        >
          <Plus size={20} />
          <span className="font-display font-bold text-sm">Add Position</span>
        </button>
      </header>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-1">Job Title</label>
                  <input 
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    type="text" 
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-sans"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-1">Company</label>
                  <input 
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    type="text" 
                    placeholder="e.g. Acme Corp"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-sans"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-1">Description</label>
                <textarea 
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  placeholder="Describe the role responsibilities..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none text-sm font-sans"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-1">Requirements (Keywords, Experience, Skills)</label>
                <textarea 
                  required
                  value={formData.requirements}
                  onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                  rows={4}
                  placeholder="Paste requirements list here..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none text-sm font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-display font-bold text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all"
                >
                  Save Position
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <div key={job.id} className="grid grid-rows-[auto_auto_1fr_auto] bg-white p-6 rounded-2xl border border-slate-100 shadow-sm group hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 rounded-xl bg-slate-50 text-emerald-600 border border-slate-100 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all duration-300">
                <Briefcase size={22} />
              </div>
              <button 
                onClick={() => deleteJob(job.id)}
                className="p-1 text-slate-300 hover:text-red-500 transition-colors"
              >
                <MoreVertical size={18} />
              </button>
            </div>
            
            <h3 className="text-lg font-display font-bold text-slate-900 mb-1 truncate tracking-tight">{job.title}</h3>
            <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold mb-4">{job.company}</p>
            
            <p className="text-slate-500 text-xs leading-relaxed line-clamp-3 mb-6">
              {job.description}
            </p>

            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
               <div className="flex -space-x-2">
                 {[1,2].map(i => (
                   <div key={i} className="w-8 h-8 rounded-xl border-2 border-white bg-emerald-50 flex items-center justify-center text-[10px] font-display font-bold text-emerald-600 shadow-sm">
                     AI
                   </div>
                 ))}
               </div>
               <Link 
                 to={`/ranker?jobId=${job.id}`}
                 className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase tracking-widest group/btn"
               >
                 Execute Analysis
                 <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
               </Link>
            </div>
          </div>
        ))}

        {jobs.length === 0 && !loading && (
          <div className="col-span-full py-24 text-center bg-white rounded-2xl border border-slate-100 border-dashed">
            <Layers className="mx-auto text-slate-200 mb-4" size={48} />
            <p className="text-slate-400 text-sm italic">No positions created yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
