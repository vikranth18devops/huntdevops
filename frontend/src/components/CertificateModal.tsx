import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  Award, 
  ShieldCheck, 
  Sparkles, 
  Copy 
} from 'lucide-react';
import { ToolLogo } from './TechLogos';

export interface CertificateData {
  certificateCode: string;
  recipientName: string;
  username: string;
  topicId: string;
  topicTitle: string;
  scorePercent: number;
  issuedAt: string;
}

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: CertificateData | null;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  certificate
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !certificate) return null;

  const handleCopyLink = () => {
    const url = `${window.location.origin}?verify_cert=${certificate.certificateCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(certificate.issuedAt || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden my-6">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-400" />
            <span className="text-sm font-bold text-white tracking-wide">Official Verified Certificate</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
              ID: {certificate.certificateCode}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer"
              title="Copy Credential Verification Link"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied Link!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span>Share Link</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              title="Print or Save PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ==================================================== */}
        {/* CERTIFICATE CANVAS (PRINTABLE) */}
        {/* ==================================================== */}
        <div className="p-6 sm:p-10 bg-slate-950 flex items-center justify-center">
          <div 
            id="huntdevops-certificate-card"
            className="w-full relative bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/70 p-8 sm:p-12 rounded-3xl border-4 border-amber-500/40 shadow-2xl overflow-hidden text-center text-slate-100"
          >
            {/* Elegant Certificate Guilloche Border Inner Inset */}
            <div className="absolute inset-3 rounded-2xl border border-amber-400/20 pointer-events-none" />
            <div className="absolute inset-5 rounded-2xl border border-amber-400/10 pointer-events-none" />

            {/* Corner Decorative Flares */}
            <div className="absolute top-4 left-4 h-8 w-8 border-t-2 border-l-2 border-amber-400/60 rounded-tl-lg" />
            <div className="absolute top-4 right-4 h-8 w-8 border-t-2 border-r-2 border-amber-400/60 rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 border-amber-400/60 rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-amber-400/60 rounded-br-lg" />

            {/* Subtle Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <ToolLogo id={certificate.topicId} className="h-96 w-96" />
            </div>

            {/* Certificate Header Brand */}
            <div className="relative z-10 flex items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
              <div className="flex items-center gap-3">
                <img 
                  src="/fevicon.png" 
                  alt="HuntDevOps Logo" 
                  className="h-10 w-10 object-contain rounded-xl bg-slate-950 p-1 border border-amber-500/40 shadow-md" 
                />
                <div className="text-left">
                  <div className="font-black text-xl tracking-tight text-white">
                    hunt<span className="text-indigo-400">devops</span>
                  </div>
                  <div className="text-[10px] font-mono text-amber-400 tracking-widest uppercase font-bold">
                    DevOps Engineering Academy
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Main Certificate Title & Statement */}
            <div className="relative z-10 my-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold tracking-wider uppercase">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Certificate of Technical Mastery
              </div>

              <p className="text-xs sm:text-sm font-medium text-slate-400 uppercase tracking-widest pt-2">
                This is proudly presented to
              </p>

              <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 tracking-tight font-serif py-1">
                {certificate.recipientName || certificate.username}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed pt-2">
                for demonstrating exceptional technical competence and successfully mastering all curriculum modules and benchmark assessments in
              </p>

              {/* Module Badge & Title Highlight */}
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-950/80 border border-amber-500/30 shadow-xl my-2">
                <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30">
                  <ToolLogo id={certificate.topicId} className="h-7 w-7" />
                </div>
                <div className="text-left">
                  <div className="text-base sm:text-lg font-black text-white tracking-tight">
                    {certificate.topicTitle}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> 100% Sub-Modules Passed ({certificate.scorePercent}% Score)
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Footer & Signatures */}
            <div className="relative z-10 pt-8 mt-6 border-t border-amber-500/20 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
              
              {/* Issued Date */}
              <div className="text-center sm:text-left space-y-1">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Date of Issuance</div>
                <div className="text-xs font-bold text-slate-200 font-mono">{formattedDate}</div>
                <div className="text-[10px] text-emerald-400 flex items-center justify-center sm:justify-start gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Blockchain & Cloud Verified
                </div>
              </div>

              {/* Gold Mastery Seal */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-500 p-0.5 shadow-xl shadow-amber-500/20 border-2 border-amber-300">
                  <div className="flex flex-col items-center justify-center h-full w-full rounded-full bg-slate-950 text-amber-300 text-center p-1">
                    <Award className="h-7 w-7 text-amber-400" />
                    <span className="text-[8px] font-mono font-black uppercase tracking-tighter">HUNTDEVOPS</span>
                    <span className="text-[7px] font-bold text-amber-400/80">CERTIFIED</span>
                  </div>
                </div>
              </div>

              {/* Credential Code & Signature */}
              <div className="text-center sm:text-right space-y-1">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Credential ID</div>
                <div className="text-xs font-mono font-bold text-amber-400 tracking-wider">
                  {certificate.certificateCode}
                </div>
                <div className="text-[10px] text-slate-400 font-serif italic pt-1">
                  Vikranth Sunkarpally · Lead Architect
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
