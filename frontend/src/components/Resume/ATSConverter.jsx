/**
 * ATSConverter.jsx - ATS Resume Converter Component
 * ================================================
 */

import React, { useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft, FaFileAlt, FaMagic, FaUpload, FaCheckCircle,
  FaGlobe, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaLinkedin,
  FaFilePdf, FaFileWord, FaInfoCircle, FaSync
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { AppContext } from '../../App';
import { resumeAPI } from '../../services/api';
import html2pdf from 'html2pdf.js';

const ATSConverter = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobKeywords, setJobKeywords] = useState('');
  const [convertedResume, setConvertedResume] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStats, setConversionStats] = useState(null);
  const previewRef = useRef(null);
  const navigate = useNavigate();

  const [sections, setSections] = useState(null);
  const { userName } = useContext(AppContext);
  const displayFallbackName = userName || localStorage.getItem('userName') || 'Professional Candidate';

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedExtensions = ['.pdf', '.docx', '.txt'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

      if (!allowedExtensions.includes(fileExtension)) {
        toast.error('Please select a valid resume file (PDF, DOCX, or TXT)');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setConvertedResume('');
      setConversionStats(null);
      setSections(null); // Clear sections on new file select
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      toast.error('Please select a resume file first');
      return;
    }

    setIsConverting(true);
    const loadingToast = toast.loading('Transforming your resume...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      if (jobKeywords.trim()) {
        const keywords = jobKeywords.split(',').map(k => k.trim()).filter(k => k);
        formData.append('job_keywords', JSON.stringify(keywords));
      }

      const data = await resumeAPI.convertATS(formData);

      if (data.success) {
        setConvertedResume(data.data.ats_resume);
        setSections(data.data.sections);
        setConversionStats({
          originalLength: data.data.original_length,
          convertedLength: data.data.converted_length
        });
        toast.success('Resume converted to professional format!', { id: loadingToast });
      } else {
        toast.error(data.message || 'Conversion failed', { id: loadingToast });
      }
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error('Failed to convert resume. Please try again.', { id: loadingToast });
    } finally {
      setIsConverting(false);
    }
  };

  const downloadPDF = () => {
    if (!sections) return;

    const element = previewRef.current;
    const opt = {
      margin: [0.3, 0.3],
      filename: `${selectedFile.name.split('.')[0]}_Professional.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: {
        scale: 4,
        useCORS: true,
        letterRendering: true,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    toast.promise(
      html2pdf().set(opt).from(element).save(),
      {
        loading: 'Generating High-Fidelity PDF...',
        success: 'Professional PDF Downloaded!',
        error: 'Failed to generate PDF. Please try again.'
      }
    );
  };

  const downloadDOCX = async () => {
    if (!sections) return;

    try {
      const response = await resumeAPI.downloadATSDocx(sections);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedFile.name.split('.')[0]}_Professional.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Professional DOCX Downloaded!');
    } catch (error) {
      toast.error('Failed to download DOCX');
    }
  };

  const downloadTXT = () => {
    if (!convertedResume) return;
    const blob = new Blob([convertedResume], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile.name.split('.')[0]}_ATS.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('ATS Plain Text Downloaded!');
  };

  // Helper to render sections professionally
  const ResumePreview = () => {
    if (!sections) return null;

    const renderContactLine = (line) => {
      const isEmail = line.toLowerCase().includes('@') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(line.trim());
      const isPhone = /[\d\-\+\(\)]{7,}/.test(line);
      const isLink = line.toLowerCase().includes('http') || line.toLowerCase().includes('linkedin.com') || line.toLowerCase().includes('github.com');

      let Icon = FaGlobe;
      if (isEmail) Icon = FaEnvelope;
      else if (isPhone) Icon = FaPhoneAlt;
      else if (isLink) Icon = (line.toLowerCase().includes('linkedin')) ? FaLinkedin : FaGlobe;

      return (
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <Icon className="text-indigo-400 text-[10px]" />
          {line.trim()}
        </span>
      );
    };

    return (
      <div id="professional-resume" className="bg-white text-slate-800 font-sans shadow-2xl min-h-[1100px] w-full max-w-[850px] mx-auto p-20 border border-gray-100 flex flex-col gap-8 ring-1 ring-black/5 rounded-sm">
        {/* Contact Info Header - Premium Centered */}
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight drop-shadow-sm uppercase">
            {(() => {
              const contactLines = sections.contact ? sections.contact.split('\n').filter(line => line.trim()) : [];
              const genericTerms = ['RESUME', 'CURRICULUM VITAE', 'CV', 'PROFILE', 'CONTACT', 'PERSONAL DETAILS'];
              const filteredLines = contactLines.filter(l => !genericTerms.includes(l.toUpperCase()));
              return filteredLines[0] || displayFallbackName;
            })()}
          </h2>
          {sections.contact && (
            <div className="text-[12px] text-slate-500 flex flex-wrap justify-center items-center gap-x-5 gap-y-2 font-medium">
              {sections.contact.split('\n').filter(line => {
                const l = line.trim();
                const genericTerms = ['RESUME', 'CURRICULUM VITAE', 'CV', 'PROFILE', 'CONTACT', 'PERSONAL DETAILS'];
                return l && !genericTerms.includes(l.toUpperCase());
              }).slice(1).map((line, i) => (
                <div key={i} className="flex items-center">
                  {renderContactLine(line)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-16 h-1 bg-indigo-600 mx-auto rounded-full opacity-60" />

        {/* Dynamic Sections (Single Column) */}
        {['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'awards'].map(key => {
          const content = sections[key];
          if (!content || content.trim().length < 3) return null;

          const title = key === 'summary' ? 'PROFESSIONAL SUMMARY' : key.toUpperCase();

          return (
            <div key={key} className="group transition-all duration-300 break-inside-avoid">
              <div className="flex items-center gap-4 mb-3">
                <h3 className="text-[14px] font-black text-indigo-900 tracking-[0.15em] whitespace-nowrap">
                  {title}
                </h3>
                <div className="h-[1px] w-full bg-slate-100 group-hover:bg-indigo-100 transition-colors" />
              </div>

              <div className="text-[14px] leading-relaxed text-slate-700 whitespace-pre-wrap pl-1">
                {key === 'skills' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
                    {content.split('\n').map((skill, i) => {
                      const cleaned = skill.replace(/^[*\-•\d\.]+\s*/, '').trim();
                      if (!cleaned) return null;
                      return (
                        <div key={i} className="flex items-center gap-2.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
                          <span className="font-medium text-slate-600 group-hover:text-indigo-600 transition-colors uppercase text-[11px] tracking-wide">{cleaned}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {content.split(/\n\s*\n/).map((block, i) => (
                      <div key={i} className="relative">
                        {block.split('\n').map((line, li) => {
                          const isHeading = li === 0 && line.length < 100 && (key === 'experience' || key === 'education' || key === 'projects');
                          return (
                            <p key={li} className={isHeading ? "font-bold text-slate-900 text-[15.5px] mb-1" : "mb-0.5 last:mb-0"}>
                              {line}
                            </p>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Subtle Footer Watermark */}
        <div className="mt-auto pt-16 text-center opacity-20 pointer-events-none no-print">
          <p className="text-[10px] font-mono tracking-widest text-slate-400 italic uppercase">
            ATS OPTIMIZED &bull; PREMIUM STRUCTURED BY INTELLIGENT RESUME SYSTEM
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/')}
        className="flex items-center text-gray-600 hover:text-purple-600 mb-6 transition-colors font-medium"
      >
        <FaArrowLeft className="mr-2" /> Back to Dashboard
      </motion.button>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-purple-800 to-indigo-900 px-8 py-10 text-white">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mr-4">
              <FaMagic className="text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Premium Resume Converter</h1>
              <p className="text-purple-100">Professional template design with 100% ATS compatibility</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid lg:grid-cols-12 gap-12">
            {/* Input Side (Left) */}
            <div className="lg:col-span-4 space-y-8">
              <section>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <FaUpload className="mr-2 text-purple-600" /> 1. Resume File
                </h3>
                <div className="border-2 border-dashed border-purple-100 bg-purple-50/30 rounded-2xl p-6 text-center hover:border-purple-400 transition-all group">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer block">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                      <FaFileAlt className="text-purple-600 text-xl" />
                    </div>
                    <p className="text-gray-700 font-bold text-sm truncate px-4">
                      {selectedFile ? selectedFile.name : 'Click to Upload'}
                    </p>
                  </label>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <FaCheckCircle className="mr-2 text-indigo-600" /> 2. Keywords
                </h3>
                <textarea
                  value={jobKeywords}
                  onChange={(e) => setJobKeywords(e.target.value)}
                  placeholder="Paste job keywords here..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 text-sm h-32"
                />
              </section>

              <button
                onClick={handleConvert}
                disabled={!selectedFile || isConverting}
                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${!selectedFile || isConverting
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700 hover:-translate-y-1'
                  }`}
              >
                {isConverting ? <FaSync className="animate-spin" /> : <FaMagic />}
                {isConverting ? 'Generating...' : 'Transform Resume'}
              </button>
            </div>

            {/* Preview Side (Right) */}
            <div className="lg:col-span-8 bg-gray-50 rounded-3xl p-6 border border-gray-100 shadow-inner">
              {!sections ? (
                <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-gray-400 text-center">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                    <FaFileAlt className="text-3xl opacity-20" />
                  </div>
                  <h4 className="font-bold text-gray-600 mb-2 text-xl">Document Preview</h4>
                  <p className="text-sm max-w-xs">Your professional resume template will appear here after conversion.</p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between px-2">
                    <h3 className="font-bold text-gray-800">High-Fidelity Preview</h3>
                    <div className="flex gap-2">
                      <button onClick={downloadPDF} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200" title="Download PDF">
                        <FaFilePdf />
                      </button>
                      <button onClick={downloadDOCX} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200" title="Download Word">
                        <FaFileWord />
                      </button>
                      <button onClick={downloadTXT} className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300" title="Download Text">
                        <FaFileAlt />
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-h-[700px] overflow-y-auto scrollbar-thin">
                    <div ref={previewRef}>
                      <ResumePreview />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid md:grid-cols-3 gap-6">
        {[
          { title: "Standard Headers", desc: "Uses machine-readable section keys like EXPERIENCE and EDUCATION", icon: "📑" },
          { title: "Format Normalization", desc: "Removes complex tables/graphics that choke parsing systems", icon: "✨" },
          { title: "Keyword Injector", desc: "Semantically integrates job requirements into your profile", icon: "🎯" }
        ].map((feat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start">
            <span className="text-2xl mr-4">{feat.icon}</span>
            <div>
              <h4 className="font-bold text-gray-800 text-sm mb-1">{feat.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed">{feat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <style jsx="true">{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
      `}</style>
    </div>
  );
};

export default ATSConverter;