import React, { useState } from 'react';
import { 
  Wand2, 
  Download, 
  Copy, 
  Check, 
  Loader2, 
  User, 
  Briefcase, 
  GraduationCap, 
  Trophy,
  History
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ResumeData {
  fullName: string;
  jobTitle: string;
  email: string;
  location: string;
  summary: string;
  experience: {
    company: string;
    role: string;
    duration: string;
    achievements: string[];
  }[];
  education: {
    school: string;
    degree: string;
    year: string;
  }[];
  skills: string[];
}

export default function ResumeBuilder() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Create a professional, modern resume based on this description: ${prompt}. 
        Focus on technical roles if applicable. Ensure the output is high-impact.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              fullName: { type: Type.STRING },
              jobTitle: { type: Type.STRING },
              email: { type: Type.STRING },
              location: { type: Type.STRING },
              summary: { type: Type.STRING },
              experience: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    company: { type: Type.STRING },
                    role: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    achievements: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              },
              education: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    school: { type: Type.STRING },
                    degree: { type: Type.STRING },
                    year: { type: Type.STRING }
                  }
                }
              },
              skills: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["fullName", "jobTitle", "summary", "experience", "skills"]
          }
        }
      });

      if (response.text) {
        setResumeData(JSON.parse(response.text));
      }
    } catch (error) {
      console.error("AI Generation Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!resumeData) return;
    const text = `
${resumeData.fullName.toUpperCase()}
${resumeData.jobTitle} | ${resumeData.email} | ${resumeData.location}

SUMMARY
${resumeData.summary}

EXPERIENCE
${resumeData.experience?.map(exp => `
${exp.role} at ${exp.company} (${exp.duration})
${exp.achievements?.map(a => `• ${a}`).join('\n')}
`).join('\n')}

EDUCATION
${resumeData.education?.map(edu => `${edu.degree} - ${edu.school} (${edu.year})`).join('\n')}

SKILLS
${resumeData.skills?.join(', ')}
    `;
    
    const blob = new Blob([text.trim()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resumeData.fullName.replace(/\s+/g, '_')}_Resume.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    if (!resumeData) return;
    const text = `
${resumeData.fullName}
${resumeData.jobTitle} | ${resumeData.email} | ${resumeData.location}

Summary
${resumeData.summary}

Experience
${resumeData.experience?.map(exp => `
${exp.role} at ${exp.company} (${exp.duration})
${exp.achievements?.map(a => `• ${a}`).join('\n')}
`).join('\n')}

Education
${resumeData.education?.map(edu => `${edu.degree} - ${edu.school} (${edu.year})`).join('\n')}

Skills
${resumeData.skills?.join(', ')}
    `;
    navigator.clipboard.writeText(text.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">AI Resume Architect</h1>
        <p className="text-slate-500 text-sm font-light">Transform your experience into a professional resume in seconds.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-8 items-start">
        {/* Input Pane */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold px-1">Describe Yourself</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. I am a Senior React dev with 8 years of exp at Google. I love building high-scale apps and mentoring juniors. I also have an MBA from Stanford..."
                rows={10}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-sans resize-none"
              />
              <p className="text-[10px] text-slate-400 italic px-1">
                The more detail you provide about your specific achievements, the better the result.
              </p>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={!prompt || isGenerating}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.99] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3 tracking-widest uppercase"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Building...
                </>
              ) : (
                <>
                  <Wand2 size={18} fill="currentColor" />
                  Generate Resume
                </>
              )}
            </button>
          </div>

          <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100/50">
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-indigo-600 mb-4 flex items-center gap-2">
              <History size={14} />
              Tips for Better Results
            </h4>
            <ul className="space-y-3 text-[11px] text-slate-600 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400">•</span>
                Mention specific tools and technologies (React, Node, etc.)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400">•</span>
                Include measurable impacts (e.g. "Increased sales by 20%")
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400">•</span>
                Specify the type of roles you are targeting
              </li>
            </ul>
          </div>
        </div>

        {/* Output Pane */}
        <div className="min-h-[700px]">
          <AnimatePresence mode="wait">
            {!resumeData && !isGenerating && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center text-slate-400"
              >
                  <Wand2 size={64} className="mb-6 opacity-20" />
                  <p className="font-bold text-xs uppercase tracking-widest opacity-50">Drafting Environment Initialized</p>
                  <p className="text-xs mt-2 opacity-40">Your content will appear here after generation.</p>
              </motion.div>
            )}

            {isGenerating && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="h-full bg-white rounded-2xl border-2 border-dashed border-indigo-100 flex flex-col items-center justify-center p-12 text-center"
              >
                <div className="relative mb-8">
                    <Loader2 size={64} className="text-indigo-600 animate-spin opacity-20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Wand2 size={32} className="text-indigo-600 animate-pulse" fill="currentColor" />
                    </div>
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">AI Resume Architect is Crafting...</h3>
                 <p className="text-slate-500 max-w-xs text-xs leading-relaxed">Synthesizing professional bullet points and optimizing for ATS matching.</p>
              </motion.div>
            )}

            {resumeData && !isGenerating && (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden flex flex-col"
              >
                <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-lg">
                      {resumeData.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold tracking-tight leading-none mb-1">{resumeData.fullName}</h3>
                      <p className="text-[10px] text-indigo-300 uppercase font-bold tracking-widest">{resumeData.jobTitle}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={copyToClipboard}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                      title="Copy Content"
                    >
                      {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                    </button>
                    <button 
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                      title="Download as TXT"
                      onClick={handleDownload}
                    >
                      <Download size={18} />
                    </button>
                  </div>
                </div>

                <div className="p-10 space-y-10 overflow-y-auto max-h-[600px] custom-scrollbar bg-white">
                  {/* Contact */}
                  <div className="flex justify-center gap-6 text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><User size={12} /> {resumeData.email}</span>
                    <span className="flex items-center gap-1.5"><Briefcase size={12} /> {resumeData.location}</span>
                  </div>

                  {/* Summary */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-indigo-600 font-bold text-xs uppercase tracking-widest border-b border-indigo-50 pb-2">
                      Professional Summary
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600 italic">
                      "{resumeData.summary}"
                    </p>
                  </div>

                  {/* Experience */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-indigo-600 font-bold text-xs uppercase tracking-widest border-b border-indigo-50 pb-2">
                      Work Experience
                    </div>
                    <div className="space-y-8">
                      {resumeData.experience?.map((exp, i) => (
                        <div key={i} className="space-y-3 relative pl-6 border-l border-slate-100">
                          <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-indigo-500"></div>
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">{exp.role}</h4>
                              <p className="text-xs text-indigo-600 font-medium">{exp.company}</p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full uppercase">{exp.duration}</span>
                          </div>
                          <ul className="space-y-2">
                            {exp.achievements?.map((ach, j) => (
                              <li key={j} className="text-[13px] text-slate-600 leading-relaxed list-disc ml-4">
                                {ach}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Education & Skills */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-indigo-600 font-bold text-xs uppercase tracking-widest border-b border-indigo-50 pb-2">
                        <GraduationCap size={16} /> Education
                      </div>
                      <div className="space-y-4">
                        {resumeData.education?.map((edu, i) => (
                          <div key={i} className="space-y-1">
                            <h4 className="font-bold text-slate-900 text-sm">{edu.degree}</h4>
                            <p className="text-xs text-slate-500">{edu.school}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{edu.year}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-indigo-600 font-bold text-xs uppercase tracking-widest border-b border-indigo-50 pb-2">
                        <Trophy size={16} /> Key Skills
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {resumeData.skills?.map((skill, i) => (
                          <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-lg border border-slate-200">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
