import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Link } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  BarChart3,
  X,
  Loader2
} from 'lucide-react';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Candidates() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCandidates();
  }, []);

  async function fetchCandidates() {
    setLoading(true);
    const q = query(collection(db, 'resumes'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    setCandidates(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user || acceptedFiles.length === 0) return;
    
    setIsUploading(true);
    const file = acceptedFiles[0];
    
    const formData = new FormData();
    formData.append('resume', file);

    try {
      // 1. Extract text via server API
      console.log("Sending request to /api/extract-text");
      const response = await fetch(window.location.origin + '/api/extract-text', {
        method: 'POST',
        body: formData,
      });
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response received:", text.slice(0, 500));
        throw new Error(`Server returned non-JSON response (${response.status}). Check server logs.`);
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      const text = data.text;
      if (!text) throw new Error("No text extracted from resume.");

      console.log("Text extracted successfully, saving to Firestore...");

      // 2. Save to Firestore
      await addDoc(collection(db, 'resumes'), {
        candidateName: file.name.replace(/\.[^/.]+$/, "").split('_').join(' '),
        candidateEmail: '', // Placeholder
        extractedText: text,
        fileName: file.name,
        uploadedBy: user.uid,
        createdAt: new Date().toISOString()
      });

      fetchCandidates();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to process resume. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, [user]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false
  } as any);

  const filteredCandidates = candidates.filter(c => 
    c.candidateName.toLowerCase().includes(search.toLowerCase()) ||
    c.fileName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-display font-bold text-slate-900 mb-1 tracking-tight">Talent Pool</h1>
        <p className="text-slate-500 text-sm font-medium">Managed resume database and candidate records.</p>
      </header>

      {/* Upload Zone */}
      <div 
        {...getRootProps()} 
        className={cn(
          "bg-white border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center text-center",
          isDragActive ? "border-emerald-600 bg-emerald-50" : "border-slate-200 hover:border-emerald-300",
          isUploading && "opacity-50 pointer-events-none"
        )}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="flex flex-col items-center gap-4">
             <Loader2 className="animate-spin text-emerald-600" size={48} />
             <p className="text-emerald-600 font-display font-bold text-lg">Parsing Resume Architecture...</p>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm border border-emerald-100">
              <Upload size={24} />
            </div>
            <p className="text-sm font-display font-bold text-slate-900">Upload New Resume</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Drag & Drop PDF or DOCX (Max 10MB)</p>
            <button className="mt-6 w-full max-w-[200px] py-2.5 bg-emerald-600 text-white rounded-lg text-[10px] uppercase tracking-[0.15em] font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-colors">
              Browse Files
            </button>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search candidates by name or filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm font-sans"
          />
        </div>
        <button className="flex items-center justify-center gap-2 bg-white border border-slate-200 px-6 py-3.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
          <Filter size={16} />
          <span className="font-bold text-[10px] uppercase tracking-widest">Filters</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="grid grid-cols-[1.5fr_1fr_1.5fr_1fr_0.5fr] bg-slate-50/50 text-left">
           <span className="col-header">Candidate</span>
           <span className="col-header">Insight Status</span>
           <span className="col-header">Source File</span>
           <span className="col-header">Retention</span>
           <span className="col-header text-right"></span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredCandidates.map((c) => (
            <Link 
              key={c.id} 
              to={`/ranker/${c.id}`}
              className="grid grid-cols-[1.5fr_1fr_1.5fr_1fr_0.5fr] px-6 py-5 items-center hover:bg-slate-50 transition-colors group cursor-pointer"
            >
               <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-[10px] font-display font-bold border border-emerald-100">
                    {c.candidateName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-display font-bold text-slate-900 truncate tracking-tight">{c.candidateName}</span>
                    <span className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">ID-{c.id.slice(0, 8)}</span>
                  </div>
               </div>
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Match</div>
               <div className="flex items-center gap-2 text-slate-500">
                  <FileText size={14} className="flex-shrink-0 text-slate-400" />
                  <span className="text-[11px] truncate max-w-[150px] font-mono italic">{c.fileName || 'resume_v1.pdf'}</span>
               </div>
               <div>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded-md border border-emerald-100/50">NEW ENTRY</span>
               </div>
               <div className="flex justify-end">
                  <button className="p-2 text-slate-300 hover:text-emerald-600 transition-colors opacity-0 group-hover:opacity-100">
                    <MoreVertical size={16} />
                  </button>
               </div>
            </Link>
          ))}

          {filteredCandidates.length === 0 && !loading && (
            <div className="py-24 text-center">
              <FileText className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-400 italic text-sm">No candidates found in repository.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
