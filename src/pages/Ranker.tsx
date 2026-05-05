import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Zap, 
  Search, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Loader2,
  Trophy,
  Target,
  FileSearch,
  ChevronDown
} from 'lucide-react';
import { collection, getDocs, addDoc, query, orderBy, doc, getDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { rankResume, AnalysisResult } from '../services/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Ranker() {
  const { resumeId } = useParams();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');
  const navigate = useNavigate();
  
  const [resumes, setResumes] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>(resumeId || '');
  const [selectedJobId, setSelectedJobId] = useState<string>(jobId || '');
  
  const [isanalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    async function fetchData() {
      const resumesSnap = await getDocs(query(collection(db, 'resumes'), orderBy('createdAt', 'desc')));
      const jobsSnap = await getDocs(query(collection(db, 'jobs'), orderBy('createdAt', 'desc')));
      
      const resDocs = resumesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const jobDocs = jobsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setResumes(resDocs);
      setJobs(jobDocs);

      if (jobId) {
        setSelectedJobId(jobId);
      } else if (jobDocs.length > 0) {
        setSelectedJobId(jobDocs[0].id);
      }
      
      if (resumeId) {
        setSelectedResumeId(resumeId);
      }
    }
    fetchData();
  }, [resumeId, jobId]);

  const handleRank = async () => {
    if (!selectedResumeId || !selectedJobId) return;
    
    setIsAnalyzing(true);
    setResult(null);
    
    try {
      const resume = resumes.find(r => r.id === selectedResumeId);
      const job = jobs.find(j => j.id === selectedJobId);
      
      if (!resume || !job) return;
      
      const analysis = await rankResume(resume.extractedText, `Title: ${job.title}\nDescription: ${job.description}\nRequirements: ${job.requirements}`);
      
      // Save result to firestore
      await addDoc(collection(db, 'analyses'), {
        ...analysis,
        resumeId: selectedResumeId,
        jobId: selectedJobId,
        createdAt: new Date().toISOString()
      });
      
      setResult(analysis);
    } catch (err) {
      console.error("Ranking failed:", err);
      alert("AI Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-display font-bold text-slate-900 mb-1 tracking-tight">AI Matching Analysis</h1>
        <p className="text-slate-500 text-sm font-medium">Objective technical scoring powered by Gemini Intelligence Precision.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Selection Pane */}
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8">
           <div className="space-y-4">
             <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-1">Target Position</label>
             <div className="relative">
               <select 
                 value={selectedJobId}
                 onChange={(e) => setSelectedJobId(e.target.value)}
                 className="w-full bg-white border border-slate-200 rounded-xl px-4 py-4 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-display font-bold text-slate-800 text-sm shadow-sm"
               >
                 <option value="" disabled>Select Job Environment</option>
                 {jobs.map(job => (
                   <option key={job.id} value={job.id}>{job.title} — {job.company}</option>
                 ))}
               </select>
               <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
             </div>
           </div>

           <div className="space-y-4">
             <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-1">Select Candidate Resume</label>
             <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
               {resumes.map(res => (
                 <button 
                   key={res.id}
                   onClick={() => setSelectedResumeId(res.id)}
                   className={cn(
                     "flex items-center gap-4 px-4 py-3 rounded-xl border transition-all text-left group",
                     selectedResumeId === res.id 
                       ? "border-emerald-600 bg-emerald-50 shadow-sm ring-1 ring-emerald-600" 
                       : "border-slate-100 bg-slate-50 hover:border-slate-200 text-slate-600"
                   )}
                 >
                   <div className={cn(
                     "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                     selectedResumeId === res.id ? "bg-emerald-600 text-white" : "bg-white text-slate-400"
                   )}>
                     <Trophy size={18} />
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className={cn("font-display font-bold text-sm truncate", selectedResumeId === res.id ? "text-emerald-950" : "text-slate-800")}>{res.candidateName}</p>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-0.5 truncate">
                        {res.fileName}
                      </p>
                   </div>
                 </button>
               ))}
             </div>
           </div>

           <button 
             onClick={handleRank}
             disabled={!selectedJobId || !selectedResumeId || isanalyzing}
             className="w-full py-4 bg-emerald-600 text-white rounded-xl font-display font-bold text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-[0.99] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3 tracking-widest uppercase"
           >
             {isanalyzing ? (
               <>
                 <Loader2 size={18} className="animate-spin" />
                 Analyzing...
               </>
             ) : (
               <>
                 <Zap size={18} fill="currentColor" />
                 Run Matching Engine
               </>
             )}
           </button>
        </div>

        {/* Result Pane */}
        <div className="min-h-[500px]">
           <AnimatePresence mode="wait">
             {isanalyzing ? (
               <motion.div 
                 key="loading"
                 initial={{ opacity: 0, scale: 0.98 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.98 }}
                 className="h-full bg-white rounded-2xl border-2 border-dashed border-emerald-100 flex flex-col items-center justify-center p-12 text-center"
               >
                 <div className="relative mb-8">
                    <Loader2 size={64} className="text-emerald-600 animate-spin opacity-20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Zap size={32} className="text-emerald-600 animate-pulse" fill="currentColor" />
                    </div>
                 </div>
                 <h3 className="text-xl font-display font-bold text-slate-900 mb-2 tracking-tight">Intelligence Engine Active</h3>
                 <p className="text-slate-500 max-w-xs text-xs leading-relaxed">Parsing candidate semantics and mapping hard skills to position requirements.</p>
               </motion.div>
             ) : result ? (
               <motion.div 
                 key="result"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="space-y-6"
               >
                 {/* Score Card */}
                 <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 -mr-24 -mt-24 rounded-full blur-3xl"></div>
                    <div className="relative z-10 flex items-center justify-between">
                       <div>
                         <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2 block">Compatibility Score</span>
                         <div className="text-7xl font-display font-bold leading-none tracking-tighter text-emerald-500">{result.score}%</div>
                       </div>
                       <div className="flex flex-col items-end">
                          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10">
                            <Target className="text-emerald-500" size={32} />
                          </div>
                          <div className="text-right">
                             <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Keywords Matching</div>
                             <div className="text-2xl font-display font-bold text-white">{result.keywordMatch}%</div>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Detailed Feedback */}
                 <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <div className="space-y-5">
                          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest border-b border-emerald-50 pb-3">
                             <CheckCircle2 size={16} />
                             Matching Strengths
                          </div>
                           <ul className="space-y-3">
                             {result.strengths?.map((s, i) => (
                               <li key={i} className="text-[13px] leading-relaxed pl-4 border-l-2 border-emerald-500/30 text-slate-600 font-medium">{s}</li>
                             ))}
                          </ul>
                       </div>
                       <div className="space-y-5">
                          <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-widest border-b border-orange-50 pb-3">
                             <XCircle size={16} />
                             Experience Gaps
                          </div>
                          <ul className="space-y-3">
                             {result.weaknesses?.map((w, i) => (
                               <li key={i} className="text-[13px] leading-relaxed pl-4 border-l-2 border-orange-500/30 text-slate-600 font-medium">{w}</li>
                             ))}
                          </ul>
                       </div>
                    </div>

                    <div className="pt-10 border-t border-slate-50">
                       <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-5 text-center">AI Recommendation Pulse</div>
                       <div className="bg-slate-50 rounded-xl p-6 border border-emerald-100/30 relative">
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[10px] font-bold text-emerald-600 tracking-widest border border-slate-100 rounded-full">TRANSCRIPT</div>
                         <p className="text-slate-700 leading-relaxed text-sm italic text-center">
                           "{result.feedback}"
                         </p>
                       </div>
                    </div>
                 </div>
               </motion.div>
             ) : (
               <div className="h-full bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center text-slate-400 transition-all">
                  <FileSearch size={64} className="mb-6 opacity-20" />
                  <p className="font-bold text-xs uppercase tracking-widest opacity-50">Select parameters to initialize</p>
               </div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
